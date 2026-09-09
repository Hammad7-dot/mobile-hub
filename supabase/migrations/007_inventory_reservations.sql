-- Reserve product inventory when a COD order is placed and release expired holds.

alter table public.orders
  add column if not exists inventory_reserved boolean not null default false,
  add column if not exists reserved_at timestamptz,
  add column if not exists reservation_expires_at timestamptz;

create index if not exists orders_reservation_expiry_idx
  on public.orders(reservation_expires_at)
  where status = 'pending' and inventory_reserved;

-- Normalize legacy variants so reservation-aware checkout can validate them.
with normalized as (
  select product.id,
    jsonb_agg(
      variant || jsonb_build_object(
        'ram', coalesce(nullif(variant->>'ram', ''), product.specifications->>'ram', ''),
        'label', coalesce(nullif(variant->>'label', ''), generated.label),
        'id', coalesce(
          nullif(variant->>'id', ''),
          trim(both '-' from regexp_replace(lower(generated.label), '[^a-z0-9]+', '-', 'g'))
        )
      )
    ) as variants
  from public.products as product
  cross join lateral jsonb_array_elements(product.variants) as variant
  cross join lateral (
    select concat_ws(' · ',
      nullif(coalesce(variant->>'ram', product.specifications->>'ram'), ''),
      nullif(variant->>'storage', ''),
      nullif(variant->>'color', '')
    ) as label
  ) as generated
  where exists (
    select 1 from jsonb_array_elements(product.variants) as candidate
    where nullif(candidate->>'id', '') is null or nullif(candidate->>'label', '') is null
  )
  group by product.id
)
update public.products as product
set variants = normalized.variants,
    updated_at = now()
from normalized
where normalized.id = product.id;
create or replace function public.manage_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'Cancelled orders cannot be reopened';
  end if;

  if old.status = 'delivered' and new.status <> 'delivered' then
    raise exception 'Delivered orders cannot be changed';
  end if;

  if old.status <> 'pending' and new.status = 'pending' then
    raise exception 'Processed orders cannot return to pending';
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled'
     and (old.inventory_reserved or old.inventory_adjusted) then
    for line in select product_id, quantity from public.order_items where order_id = new.id loop
      update public.products
      set stock = stock + line.quantity, updated_at = now()
      where id = line.product_id;
    end loop;
    new.inventory_reserved := false;
    new.inventory_adjusted := false;
    new.reservation_expires_at := null;
  elsif old.status = 'pending' and new.status <> 'pending' and new.status <> 'cancelled'
        and old.inventory_reserved then
    -- Stock was already deducted when the order was placed.
    new.inventory_reserved := false;
    new.inventory_adjusted := true;
    new.reservation_expires_at := null;
  elsif old.status = 'pending' and new.status <> 'pending' and new.status <> 'cancelled'
        and not old.inventory_reserved and not old.inventory_adjusted then
    -- Orders created before this migration were not reserved; deduct them once.
    for line in select product_id, quantity from public.order_items where order_id = new.id loop
      update public.products
      set stock = stock - line.quantity, updated_at = now()
      where id = line.product_id and stock >= line.quantity;
      if not found then raise exception 'Insufficient stock to process legacy order'; end if;
    end loop;
    new.inventory_adjusted := true;
  end if;

  return new;
end;
$$;

drop trigger if exists order_inventory on public.orders;
create trigger order_inventory
before update on public.orders
for each row execute function public.manage_order_inventory();

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_order record;
  released_count integer := 0;
begin
  for expired_order in
    select id
    from public.orders
    where status = 'pending'
      and inventory_reserved
      and reservation_expires_at <= now()
    for update skip locked
  loop
    update public.orders
    set status = 'cancelled', updated_at = now()
    where id = expired_order.id;
    released_count := released_count + 1;
  end loop;
  return released_count;
end;
$$;

revoke all on function public.release_expired_inventory_reservations() from public;

create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.orders;
  item jsonb;
  product_row public.products;
  customer_uuid uuid;
  computed_subtotal numeric := 0;
  fee numeric := 0;
  normalized_phone text;
  store_config jsonb;
  configured_fee numeric := 500;
  free_threshold numeric := 50000;
  selected_variant jsonb;
begin
  perform public.release_expired_inventory_reservations();

  normalized_phone := public.normalize_pk_phone(customer->>'phone');
  if normalized_phone !~ '^3[0-9]{9}$' then raise exception 'Invalid Pakistani phone number'; end if;
  if length(trim(customer->>'full_name')) < 2 or length(trim(customer->>'address')) < 10 or length(trim(customer->>'city')) < 2 then raise exception 'Incomplete delivery details'; end if;
  if jsonb_array_length(items) = 0 then raise exception 'Cart is empty'; end if;

  for item in select value from jsonb_array_elements(items) order by value->>'product_id' loop
    select * into product_row
    from public.products
    where id = (item->>'product_id')::uuid and status = 'active'
    for update;
    if not found then raise exception 'A product is unavailable'; end if;

    selected_variant := null;
    if jsonb_array_length(product_row.variants) > 0 then
      select variant into selected_variant
      from jsonb_array_elements(product_row.variants) as variant
      where variant->>'id' = item->>'variant_id'
      limit 1;
      if selected_variant is null then raise exception 'Select a valid variant for %', product_row.name; end if;
    end if;

    if (item->>'quantity')::integer < 1 or (item->>'quantity')::integer > 10 then raise exception 'Invalid quantity'; end if;
    computed_subtotal := computed_subtotal + product_row.price * (item->>'quantity')::integer;
  end loop;

  select value into store_config from public.site_settings where key = 'store';
  configured_fee := greatest(coalesce((store_config->>'delivery_fee')::numeric, 500), 0);
  free_threshold := greatest(coalesce((store_config->>'free_delivery_threshold')::numeric, 50000), 0);
  if computed_subtotal < free_threshold then fee := configured_fee; end if;

  insert into public.customers(full_name, phone, email, city, address, user_id)
  values(trim(customer->>'full_name'), normalized_phone, nullif(trim(customer->>'email'), ''), trim(customer->>'city'), trim(customer->>'address'), auth.uid())
  returning id into customer_uuid;

  insert into public.orders(
    order_number, customer_id, user_id, customer_name, phone, email, city, address,
    notes, subtotal, delivery_fee, total, inventory_reserved, reserved_at, reservation_expires_at
  ) values (
    'MH-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    customer_uuid, auth.uid(), trim(customer->>'full_name'), normalized_phone,
    nullif(trim(customer->>'email'), ''), trim(customer->>'city'), trim(customer->>'address'),
    nullif(trim(customer->>'notes'), ''), computed_subtotal, fee, computed_subtotal + fee,
    true, now(), now() + interval '30 minutes'
  ) returning * into new_order;

  for item in select value from jsonb_array_elements(items) order by value->>'product_id' loop
    update public.products
    set stock = stock - (item->>'quantity')::integer, updated_at = now()
    where id = (item->>'product_id')::uuid
      and status = 'active'
      and stock >= (item->>'quantity')::integer
    returning * into product_row;
    if not found then raise exception 'Insufficient stock for an item in this order'; end if;

    selected_variant := null;
    if nullif(item->>'variant_id', '') is not null then
      select variant into selected_variant
      from jsonb_array_elements(product_row.variants) as variant
      where variant->>'id' = item->>'variant_id'
      limit 1;
    end if;

    insert into public.order_items(order_id, product_id, product_name, variant_id, variant_label, quantity, unit_price)
    values(
      new_order.id, product_row.id, product_row.name,
      selected_variant->>'id', selected_variant->>'label',
      (item->>'quantity')::integer, product_row.price
    );
  end loop;

  return jsonb_build_object(
    'order_number', new_order.order_number,
    'total', new_order.total,
    'status', new_order.status,
    'reservation_expires_at', new_order.reservation_expires_at
  );
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- Supabase Cron runs the cleanup every five minutes. Re-running this migration
-- updates the existing named job instead of creating a duplicate.
create extension if not exists pg_cron;
select cron.schedule(
  'release-expired-order-reservations',
  '*/5 * * * *',
  'select public.release_expired_inventory_reservations();'
);
