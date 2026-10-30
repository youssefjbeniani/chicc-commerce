-- Milestone 9: optional inventory tracking with transactional reservations.

alter table public.products
  add column stock_quantity bigint check (stock_quantity is null or stock_quantity >= 0);

alter table public.products
  add column is_in_stock boolean generated always as (stock_quantity is null or stock_quantity > 0) stored;

alter table public.order_items
  add column stock_reserved boolean not null default false;

-- Public catalog visitors may see availability, but not exact stock counts.
revoke select on table public.products from anon;
grant select (
  id, category_id, slug, sku, name_i18n, description_i18n, image_path,
  price_minor, currency_code, is_published, sort_order, created_at, updated_at,
  is_in_stock
) on table public.products to anon;

create or replace function private.create_order_internal(
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
  v_snapshot jsonb := '[]'::jsonb;
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

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception using errcode = '22023', message = 'Invalid order items';
  end if;

  -- Validate IDs and quantities first, then lock all product rows in a
  -- consistent order so concurrent multi-product orders do not deadlock.
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
  end loop;

  perform p.id
    from public.products as p
    where p.id = any(v_seen_ids)
    order by p.id
    for update;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;

    select p.id, p.name_i18n, p.sku, p.price_minor, p.currency_code, p.stock_quantity
      into v_product
      from public.products as p
      where p.id = v_product_id and p.is_published;
    if not found then
      raise exception using errcode = '22023', message = 'Product is unavailable';
    end if;

    if v_currency_code is null then
      v_currency_code := v_product.currency_code;
    elsif v_currency_code <> v_product.currency_code then
      raise exception using errcode = '22023', message = 'Order items must use one currency';
    end if;

    if v_product.stock_quantity is not null then
      if v_product.stock_quantity < v_quantity then
        raise exception using errcode = '22023', message = 'Insufficient stock';
      end if;
      update public.products
        set stock_quantity = stock_quantity - v_quantity
        where id = v_product.id;
    end if;

    v_total := v_total + (v_product.price_minor::numeric * v_quantity);
    if v_total > 9223372036854775807 then
      raise exception using errcode = '22003', message = 'Order total is too large';
    end if;

    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name_i18n', v_product.name_i18n,
      'sku_snapshot', v_product.sku,
      'quantity', v_quantity,
      'unit_price_minor', v_product.price_minor,
      'stock_reserved', v_product.stock_quantity is not null
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
      options_snapshot, quantity, unit_price_minor, stock_reserved
    ) values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item -> 'product_name_i18n',
      v_item ->> 'sku_snapshot',
      '{}'::jsonb,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'unit_price_minor')::bigint,
      (v_item ->> 'stock_reserved')::boolean
    );
  end loop;

  if p_actor_id is not null then
    insert into public.order_internal_metadata(order_id, created_by)
    values (v_order_id, p_actor_id);
  end if;

  return v_order_id;
end;
$$;

create or replace function public.transition_order_status(
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
  v_item record;
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

  if p_new_status = 'cancelled' then
    for v_item in
      select oi.product_id, sum(oi.quantity)::bigint as quantity
      from public.order_items as oi
      where oi.order_id = p_order_id
        and oi.stock_reserved
        and oi.product_id is not null
      group by oi.product_id
      order by oi.product_id
    loop
      update public.products
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.product_id and stock_quantity is not null;
    end loop;
  end if;

  update public.orders set status = p_new_status where id = p_order_id;
end;
$$;
