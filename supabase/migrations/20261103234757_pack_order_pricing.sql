-- Fixed, server-calculated prices for the public Duo and Trio offers.
-- This reuses the normal order helper so availability and stock reservations
-- stay in the same transaction as the discounted order total.
create function public.create_website_pack_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address jsonb,
  p_delivery_notes text,
  p_items jsonb,
  p_pack_size integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_currency_code text;
  v_regular_total bigint;
  v_pack_total bigint;
  v_unit_price bigint;
  v_remainder bigint;
begin
  if p_pack_size is null or p_pack_size not in (2, 3) then
    raise exception using errcode = '22023', message = 'Invalid pack size';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid pack items';
  end if;
  if jsonb_array_length(p_items) <> p_pack_size then
    raise exception using errcode = '22023', message = 'Invalid pack items';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where jsonb_typeof(item.value) <> 'object'
       or coalesce(item.value ->> 'quantity', '') <> '1'
  ) then
    raise exception using errcode = '22023', message = 'Pack items must each have quantity one';
  end if;

  v_order_id := private.create_order_internal(
    'website'::public.chicc_order_channel,
    null,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_delivery_notes,
    p_items
  );

  select currency_code, total_minor
    into v_currency_code, v_regular_total
    from public.orders
    where id = v_order_id
    for update;

  if v_currency_code <> 'TND' then
    raise exception using errcode = '22023', message = 'Pack prices are only configured for TND';
  end if;

  v_pack_total := case p_pack_size when 2 then 69000 else 89000 end;
  v_unit_price := v_pack_total / p_pack_size;
  v_remainder := v_pack_total % p_pack_size;

  with ranked_items as (
    select id, product_id, unit_price_minor as original_unit_price_minor,
      row_number() over (order by product_id nulls last, id) as pack_position
    from public.order_items
    where order_id = v_order_id
  )
  update public.order_items as item
  set unit_price_minor = v_unit_price + case when ranked.pack_position <= v_remainder then 1 else 0 end,
      options_snapshot = item.options_snapshot || jsonb_build_object(
        'pack_size', p_pack_size,
        'pack_position', ranked.pack_position,
        'original_unit_price_minor', ranked.original_unit_price_minor,
        'regular_pack_total_minor', v_regular_total,
        'pack_discount_minor', greatest(v_regular_total - v_pack_total, 0)
      )
  from ranked_items as ranked
  where item.id = ranked.id;

  update public.orders
    set total_minor = v_pack_total
    where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_website_pack_order(text, text, jsonb, text, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.create_website_pack_order(text, text, jsonb, text, jsonb, integer)
  to service_role;
