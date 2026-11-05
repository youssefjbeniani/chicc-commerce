-- Milestone 3 foundation: multilingual catalog, order snapshots, and worker assignment.
-- Customer and staff order writes are intentionally not exposed yet.

create type public.chicc_order_channel as enum ('website', 'whatsapp');
create type public.chicc_order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create function public.has_chicc_role(p_roles public.chicc_account_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.is_active
      and p.role = any (p_roles)
  );
$$;

revoke all on function public.has_chicc_role(public.chicc_account_role[]) from public, anon;
grant execute on function public.has_chicc_role(public.chicc_account_role[]) to authenticated;

create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_i18n jsonb not null check (
    jsonb_typeof(name_i18n) = 'object'
    and name_i18n ?& array['fr', 'ar', 'en']
    and jsonb_typeof(name_i18n -> 'fr') = 'string'
    and jsonb_typeof(name_i18n -> 'ar') = 'string'
    and jsonb_typeof(name_i18n -> 'en') = 'string'
  ),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.catalog_categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique,
  name_i18n jsonb not null check (
    jsonb_typeof(name_i18n) = 'object'
    and name_i18n ?& array['fr', 'ar', 'en']
    and jsonb_typeof(name_i18n -> 'fr') = 'string'
    and jsonb_typeof(name_i18n -> 'ar') = 'string'
    and jsonb_typeof(name_i18n -> 'en') = 'string'
  ),
  description_i18n jsonb check (
    description_i18n is null or jsonb_typeof(description_i18n) = 'object'
  ),
  price_minor bigint not null check (price_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  channel public.chicc_order_channel not null,
  status public.chicc_order_status not null default 'pending',
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  customer_phone text not null check (char_length(trim(customer_phone)) between 5 and 40),
  delivery_address jsonb not null check (jsonb_typeof(delivery_address) = 'object'),
  delivery_notes text check (delivery_notes is null or char_length(delivery_notes) <= 2000),
  assigned_worker_id uuid references public.profiles(id) on delete set null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  total_minor bigint not null check (total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_i18n jsonb not null check (
    jsonb_typeof(product_name_i18n) = 'object'
    and product_name_i18n ?& array['fr', 'ar', 'en']
    and jsonb_typeof(product_name_i18n -> 'fr') = 'string'
    and jsonb_typeof(product_name_i18n -> 'ar') = 'string'
    and jsonb_typeof(product_name_i18n -> 'en') = 'string'
  ),
  sku_snapshot text,
  options_snapshot jsonb not null default '{}'::jsonb check (
    jsonb_typeof(options_snapshot) = 'object'
  ),
  quantity integer not null check (quantity between 1 and 9999),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint generated always as (unit_price_minor * quantity) stored
);

create index products_category_id_idx on public.products(category_id);
create index products_public_sort_idx on public.products(sort_order, slug) where is_published;
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_assigned_status_idx on public.orders(assigned_worker_id, status, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);

create trigger categories_set_updated_at
  before update on public.catalog_categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.catalog_categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Explicitly reset default API grants before granting only intended operations.
revoke all on table public.catalog_categories from public, anon, authenticated;
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.orders from public, anon, authenticated;
revoke all on table public.order_items from public, anon, authenticated;

grant select on table public.catalog_categories to anon, authenticated;
grant insert, update, delete on table public.catalog_categories to authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create policy "Anyone can read published categories"
  on public.catalog_categories for select to anon, authenticated
  using (is_published);

create policy "Staff can read all categories"
  on public.catalog_categories for select to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Staff can create categories"
  on public.catalog_categories for insert to authenticated
  with check ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Staff can update categories"
  on public.catalog_categories for update to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])))
  with check ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Managers can delete categories"
  on public.catalog_categories for delete to authenticated
  using ((select public.has_chicc_role(array['manager'::public.chicc_account_role])));

create policy "Anyone can read published products"
  on public.products for select to anon, authenticated
  using (is_published);

create policy "Staff can read all products"
  on public.products for select to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Staff can create products"
  on public.products for insert to authenticated
  with check ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Staff can update products"
  on public.products for update to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])))
  with check ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Managers can delete products"
  on public.products for delete to authenticated
  using ((select public.has_chicc_role(array['manager'::public.chicc_account_role])));

create policy "Staff and managers can read all orders"
  on public.orders for select to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Delivery workers can read assigned orders"
  on public.orders for select to authenticated
  using (
    assigned_worker_id = (select auth.uid())
    and (select public.has_chicc_role(array['delivery_worker'::public.chicc_account_role]))
  );

create policy "Staff and managers can read order items"
  on public.order_items for select to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Delivery workers can read items for assigned orders"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1
      from public.orders as o
      where o.id = order_items.order_id
        and o.assigned_worker_id = (select auth.uid())
        and (select public.has_chicc_role(array['delivery_worker'::public.chicc_account_role]))
    )
  );



comment on column public.products.price_minor is
  'Product price in integer minor units for the paired ISO 4217 currency code.';
comment on column public.orders.total_minor is
  'Order total in integer minor units for the paired ISO 4217 currency code.';
comment on table public.orders is
  'Private website or WhatsApp order record. Writes are disabled for client roles until validated server-side workflows are added.';
