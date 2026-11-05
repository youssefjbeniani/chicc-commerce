-- Milestone 5: validated website and WhatsApp order intake plus delivery transitions.
-- Order tables remain inaccessible for direct writes; callers use these RPC functions.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

alter table public.orders
  add constraint orders_address_required_fields check (
    jsonb_typeof(delivery_address) = 'object'
    and char_length(trim(coalesce(delivery_address ->> 'street', ''))) between 1 and 300
    and char_length(trim(coalesce(delivery_address ->> 'city', ''))) between 1 and 120
    and char_length(coalesce(delivery_address ->> 'region', '')) <= 120
    and char_length(coalesce(delivery_address ->> 'postal_code', '')) <= 40
    and char_length(coalesce(delivery_address ->> 'country', '')) <= 100
  );

create table public.order_internal_metadata (
  order_id uuid primary key references public.orders(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.order_internal_metadata enable row level security;
revoke all on table public.order_internal_metadata from public, anon, authenticated;
grant select on table public.order_internal_metadata to authenticated;

create policy "Staff can read order audit metadata"
  on public.order_internal_metadata for select to authenticated
  using ((select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])));

create policy "Staff can list active delivery worker profiles"
  on public.profiles for select to authenticated
  using (
    role = 'delivery_worker'::public.chicc_account_role
    and is_active
    and (select public.has_chicc_role(array[
      'staff'::public.chicc_account_role,
      'manager'::public.chicc_account_role
    ]))
  );

create table private.website_order_rate_limits (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table private.website_order_rate_limits enable row level security;
revoke all on table private.website_order_rate_limits from public, anon, authenticated, service_role;
create index website_order_rate_limits_window_idx
  on private.website_order_rate_limits(window_started_at);

create function private.consume_website_order_rate_limit(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into private.website_order_rate_limits (ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update
  set request_count = case
        when private.website_order_rate_limits.window_started_at <= now() - interval '1 hour' then 1
        else private.website_order_rate_limits.request_count + 1
      end,
      window_started_at = case
        when private.website_order_rate_limits.window_started_at <= now() - interval '1 hour' then now()
        else private.website_order_rate_limits.window_started_at
      end
  returning request_count into v_count;

  delete from private.website_order_rate_limits
  where window_started_at < now() - interval '24 hours';

  return v_count <= 10;
end;
$$;

revoke all on function private.consume_website_order_rate_limit(text) from public, anon, authenticated;
grant execute on function private.consume_website_order_rate_limit(text) to service_role;

-- PostgREST only exposes configured API schemas (normally public), so the
-- Edge Function calls this narrow service-role-only wrapper over RPC.
create function public.consume_website_order_rate_limit(p_ip_hash text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.consume_website_order_rate_limit(p_ip_hash);
$$;

revoke all on function public.consume_website_order_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_website_order_rate_limit(text) to service_role;

create function private.create_order_internal(
  p_channel public.chicc_order_channel,
  p_actor_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address jsonb,
  p_delivery_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_snapshot jsonb;
  v_product record;
  v_product_id uuid;
  v_quantity integer;
  v_currency_code text;
  v_total numeric := 0;
  v_order_id uuid;
  v_seen_ids uuid[] := array[]::uuid[];
begin
  if char_length(trim(coalesce(p_customer_name, ''))) not between 1 and 120
     or char_length(trim(coalesce(p_customer_phone, ''))) not between 5 and 40
     or p_delivery_notes is not null and char_length(p_delivery_notes) > 2000 then
    raise exception using errcode = '22023', message = 'Invalid order details';
  end if;

  if p_delivery_address is null or jsonb_typeof(p_delivery_address) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid delivery address';
  end if;
  if char_length(trim(coalesce(p_delivery_address ->> 'street', ''))) not between 1 and 300
     or char_length(trim(coalesce(p_delivery_address ->> 'city', ''))) not between 1 and 120
     or char_length(coalesce(p_delivery_address ->> 'region', '')) > 120
     or char_length(coalesce(p_delivery_address ->> 'postal_code', '')) > 40
     or char_length(coalesce(p_delivery_address ->> 'country', '')) > 100 then
    raise exception using errcode = '22023', message = 'Invalid delivery address';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid order items';
  end if;
  if jsonb_array_length(p_items) not between 1 and 30 then
    raise exception using errcode = '22023', message = 'Invalid order items';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception using errcode = '22023', message = 'Invalid order item';
    end if;
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := nullif(v_item ->> 'quantity', '')::integer;
    if v_product_id is null or v_quantity is null or v_quantity not between 1 and 25 then
      raise exception using errcode = '22023', message = 'Invalid order item';
    end if;
    if v_product_id = any(v_seen_ids) then
      raise exception using errcode = '22023', message = 'Duplicate order item';
    end if;
    v_seen_ids := array_append(v_seen_ids, v_product_id);

    select p.id, p.name_i18n, p.sku, p.price_minor, p.currency_code
      into v_product
      from public.products as p
      where p.id = v_product_id and p.is_published
      for share;
    if not found then
      raise exception using errcode = '22023', message = 'Product is unavailable';
    end if;

    if v_currency_code is null then
      v_currency_code := v_product.currency_code;
    elsif v_currency_code <> v_product.currency_code then
      raise exception using errcode = '22023', message = 'Order items must use one currency';
    end if;

    v_total := v_total + (v_product.price_minor::numeric * v_quantity);
    if v_total > 9223372036854775807 then
      raise exception using errcode = '22003', message = 'Order total is too large';
    end if;

    v_snapshot := coalesce(v_snapshot, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name_i18n', v_product.name_i18n,
      'sku_snapshot', v_product.sku,
      'quantity', v_quantity,
      'unit_price_minor', v_product.price_minor
    ));
  end loop;

  insert into public.orders (
    channel, customer_name, customer_phone, delivery_address,
    delivery_notes, currency_code, total_minor
  ) values (
    p_channel, trim(p_customer_name), trim(p_customer_phone), p_delivery_address,
    nullif(trim(coalesce(p_delivery_notes, '')), ''), v_currency_code, v_total::bigint
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_snapshot)
  loop
    insert into public.order_items (
      order_id, product_id, product_name_i18n, sku_snapshot,
      options_snapshot, quantity, unit_price_minor
    ) values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item -> 'product_name_i18n',
      v_item ->> 'sku_snapshot',
      '{}'::jsonb,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'unit_price_minor')::bigint
    );
  end loop;

  if p_actor_id is not null then
    insert into public.order_internal_metadata(order_id, created_by)
    values (v_order_id, p_actor_id);
  end if;

  return v_order_id;
end;
$$;

revoke all on function private.create_order_internal(
  public.chicc_order_channel, uuid, text, text, jsonb, text, jsonb
) from public, anon, authenticated, service_role;

create function public.create_website_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address jsonb,
  p_delivery_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.create_order_internal(
    'website'::public.chicc_order_channel,
    null,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_delivery_notes,
    p_items
  );
end;
$$;

revoke all on function public.create_website_order(text, text, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_website_order(text, text, jsonb, text, jsonb) to service_role;

create function public.create_manual_whatsapp_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address jsonb,
  p_delivery_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])) then
    raise exception using errcode = '42501', message = 'Not authorized to enter WhatsApp orders';
  end if;

  return private.create_order_internal(
    'whatsapp'::public.chicc_order_channel,
    (select auth.uid()),
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_delivery_notes,
    p_items
  );
end;
$$;

revoke all on function public.create_manual_whatsapp_order(text, text, jsonb, text, jsonb) from public, anon;
grant execute on function public.create_manual_whatsapp_order(text, text, jsonb, text, jsonb) to authenticated;

create function public.assign_delivery_worker(p_order_id uuid, p_worker_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ])) then
    raise exception using errcode = '42501', message = 'Not authorized to assign delivery';
  end if;

  if p_worker_id is not null and not exists (
    select 1 from public.profiles as p
    where p.id = p_worker_id
      and p.role = 'delivery_worker'::public.chicc_account_role
      and p.is_active
  ) then
    raise exception using errcode = '22023', message = 'Delivery worker is unavailable';
  end if;

  update public.orders
  set assigned_worker_id = p_worker_id
  where id = p_order_id and status not in ('out_for_delivery', 'delivered', 'cancelled');
  if not found then
    raise exception using errcode = '22023', message = 'Order is unavailable';
  end if;
end;
$$;

revoke all on function public.assign_delivery_worker(uuid, uuid) from public, anon;
grant execute on function public.assign_delivery_worker(uuid, uuid) to authenticated;

create function public.transition_order_status(
  p_order_id uuid,
  p_new_status public.chicc_order_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.chicc_order_status;
  v_assigned_worker_id uuid;
  v_can_manage boolean;
  v_is_assigned_worker boolean;
  v_allowed boolean := false;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Sign in required';
  end if;

  v_can_manage := (select public.has_chicc_role(array[
    'staff'::public.chicc_account_role,
    'manager'::public.chicc_account_role
  ]));

  select o.status, o.assigned_worker_id
    into v_status, v_assigned_worker_id
    from public.orders as o
    where o.id = p_order_id
    for update;
  if not found then
    raise exception using errcode = '22023', message = 'Order is unavailable';
  end if;

  v_is_assigned_worker := v_assigned_worker_id = (select auth.uid())
    and (select public.has_chicc_role(array['delivery_worker'::public.chicc_account_role]));

  if v_can_manage then
    v_allowed := case v_status
      when 'pending' then p_new_status in ('confirmed', 'cancelled')
      when 'confirmed' then p_new_status in ('preparing', 'cancelled')
      when 'preparing' then p_new_status in ('ready_for_delivery', 'cancelled')
      when 'ready_for_delivery' then p_new_status in ('out_for_delivery', 'cancelled')
      when 'out_for_delivery' then p_new_status = 'delivered'
      else false
    end;
    if p_new_status = 'out_for_delivery' and v_assigned_worker_id is null then
      v_allowed := false;
    end if;
  elsif v_is_assigned_worker then
    v_allowed := (v_status = 'ready_for_delivery' and p_new_status = 'out_for_delivery')
      or (v_status = 'out_for_delivery' and p_new_status = 'delivered');
  end if;

  if not v_allowed then
    raise exception using errcode = '42501', message = 'Order status transition is not allowed';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;
end;
$$;

revoke all on function public.transition_order_status(uuid, public.chicc_order_status) from public, anon;
grant execute on function public.transition_order_status(uuid, public.chicc_order_status) to authenticated;
