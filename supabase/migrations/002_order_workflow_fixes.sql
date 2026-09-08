-- Fix Pakistani phone normalization for existing installations.

create or replace function public.normalize_pk_phone(value text)
returns text language sql immutable
as $$ select regexp_replace(regexp_replace(regexp_replace(value, '\D', '', 'g'), '^92', ''), '^0', ''); $$;

create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare new_order public.orders; item jsonb; product_row public.products; customer_uuid uuid; computed_subtotal numeric := 0; fee numeric := 0; normalized_phone text; store_config jsonb; configured_fee numeric := 500; free_threshold numeric := 50000; selected_variant jsonb;
begin
  normalized_phone := public.normalize_pk_phone(customer->>'phone');
  if normalized_phone !~ '^3[0-9]{9}$' then raise exception 'Invalid Pakistani phone number'; end if;
  if length(trim(customer->>'full_name')) < 2 or length(trim(customer->>'address')) < 10 or length(trim(customer->>'city')) < 2 then raise exception 'Incomplete delivery details'; end if;
  if jsonb_array_length(items) = 0 then raise exception 'Cart is empty'; end if;
  for item in select * from jsonb_array_elements(items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid and status = 'active' for share;
    if not found then raise exception 'A product is unavailable'; end if;
    selected_variant := null;
    if jsonb_array_length(product_row.variants) > 0 then
      select v into selected_variant from jsonb_array_elements(product_row.variants) v where v->>'id' = item->>'variant_id' limit 1;
      if selected_variant is null then raise exception 'Select a valid variant for %', product_row.name; end if;
    end if;
    if (item->>'quantity')::integer < 1 or (item->>'quantity')::integer > 10 or product_row.stock < (item->>'quantity')::integer then raise exception 'Insufficient stock for %', product_row.name; end if;
    computed_subtotal := computed_subtotal + product_row.price * (item->>'quantity')::integer;
  end loop;
  select value into store_config from public.site_settings where key = 'store';
  configured_fee := greatest(coalesce((store_config->>'delivery_fee')::numeric, 500), 0);
  free_threshold := greatest(coalesce((store_config->>'free_delivery_threshold')::numeric, 50000), 0);
  if computed_subtotal < free_threshold then fee := configured_fee; end if;
  insert into public.customers(full_name, phone, email, city, address, user_id)
    values(trim(customer->>'full_name'), normalized_phone, nullif(trim(customer->>'email'),''), trim(customer->>'city'), trim(customer->>'address'), auth.uid()) returning id into customer_uuid;
  insert into public.orders(order_number, customer_id, user_id, customer_name, phone, email, city, address, notes, subtotal, delivery_fee, total)
    values('MH-' || to_char(now(),'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)), customer_uuid, auth.uid(), trim(customer->>'full_name'), normalized_phone, nullif(trim(customer->>'email'),''), trim(customer->>'city'), trim(customer->>'address'), nullif(trim(customer->>'notes'),''), computed_subtotal, fee, computed_subtotal + fee) returning * into new_order;
  for item in select * from jsonb_array_elements(items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid;
    selected_variant := null;
    if nullif(item->>'variant_id','') is not null then select v into selected_variant from jsonb_array_elements(product_row.variants) v where v->>'id' = item->>'variant_id' limit 1; end if;
    insert into public.order_items(order_id, product_id, product_name, variant_id, variant_label, quantity, unit_price) values(new_order.id, product_row.id, product_row.name, selected_variant->>'id', selected_variant->>'label', (item->>'quantity')::integer, product_row.price);
  end loop;
  return jsonb_build_object('order_number',new_order.order_number,'total',new_order.total,'status',new_order.status);
end; $$;

create or replace function public.track_order(order_no text, customer_phone text)
returns jsonb language sql stable security definer set search_path = public
as $$ select jsonb_build_object('order_number',order_number,'status',status,'total',total,'created_at',created_at) from public.orders where upper(order_number)=upper(trim(order_no)) and phone=public.normalize_pk_phone(customer_phone) limit 1; $$;
