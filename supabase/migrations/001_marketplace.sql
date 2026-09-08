create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled');
create type public.request_status as enum ('pending', 'reviewing', 'offered', 'accepted', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  name text not null,
  slug text not null unique,
  sku text unique,
  category text not null default 'mobiles',
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 3,
  status text not null default 'active' check (status in ('draft','active','archived','upcoming')),
  pta_approved boolean not null default true,
  warranty text not null default '1 Year',
  featured boolean not null default false,
  release_date date,
  specifications jsonb not null default '{}'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  images text[] not null default '{}',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending',
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  notes text,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null default 'cod' check (payment_method in ('cod','jazzcash','easypaisa','card')),
  inventory_adjusted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  variant_id text,
  variant_label text,
  quantity integer not null check (quantity > 0 and quantity <= 10),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.used_phone_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  brand text not null,
  model text not null,
  storage text,
  condition text not null,
  pta_approved boolean not null,
  battery_health integer check (battery_health between 0 and 100),
  expected_price numeric(12,2) check (expected_price >= 0),
  full_name text not null,
  phone text not null,
  city text,
  details text,
  images text[] not null default '{}',
  status public.request_status not null default 'pending',
  admin_notes text,
  offer_price numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index products_brand_idx on public.products(brand_id);
create index products_status_idx on public.products(status);
create index products_price_idx on public.products(price);
create index orders_phone_idx on public.orders(phone);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles(id, full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.normalize_pk_phone(value text)
returns text language sql immutable set search_path = public
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

create or replace function public.adjust_inventory_on_confirmation()
returns trigger language plpgsql security definer set search_path = public
as $$ declare line record; begin
  if new.status = 'confirmed' and old.status <> 'confirmed' and not new.inventory_adjusted then
    for line in select product_id, quantity from public.order_items where order_id = new.id loop
      update public.products set stock = stock - line.quantity, updated_at = now() where id = line.product_id and stock >= line.quantity;
      if not found then raise exception 'Insufficient stock to confirm order'; end if;
    end loop;
    new.inventory_adjusted := true;
  end if;
  return new;
end; $$;
create trigger order_inventory before update on public.orders for each row execute function public.adjust_inventory_on_confirmation();

create or replace function public.track_order(order_no text, customer_phone text)
returns jsonb language sql stable security definer set search_path = public
as $$ select jsonb_build_object('order_number',order_number,'status',status,'total',total,'created_at',created_at) from public.orders where upper(order_number)=upper(trim(order_no)) and phone=public.normalize_pk_phone(customer_phone) limit 1; $$;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.used_phone_requests enable row level security;
alter table public.site_settings enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on table public.profiles from authenticated;
grant update(full_name, phone, updated_at) on table public.profiles to authenticated;
create policy "brands public read" on public.brands for select using (is_active or public.is_admin());
create policy "brands admin write" on public.brands for all using (public.is_admin()) with check (public.is_admin());
create policy "products public read" on public.products for select using (status in ('active','upcoming') or public.is_admin());
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "customers own read" on public.customers for select using (user_id = auth.uid() or public.is_admin());
create policy "orders own read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "items own read" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "reviews public read" on public.reviews for select using (is_approved or public.is_admin());
create policy "reviews authenticated insert" on public.reviews for insert to authenticated with check (user_id=auth.uid());
create policy "reviews admin update" on public.reviews for update using (public.is_admin());
create policy "used requests own read" on public.used_phone_requests for select using (user_id=auth.uid() or public.is_admin());
create policy "used requests public insert" on public.used_phone_requests for insert with check (user_id is null or user_id=auth.uid());
create policy "used requests admin update" on public.used_phone_requests for update using (public.is_admin());
create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

grant execute on function public.place_order(jsonb,jsonb) to anon, authenticated;
grant execute on function public.track_order(text,text) to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']),
('used-phone-images','used-phone-images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "product images public read" on storage.objects for select using (bucket_id='product-images');
create policy "product images admin write" on storage.objects for all using (bucket_id='product-images' and public.is_admin()) with check (bucket_id='product-images' and public.is_admin());
create policy "used images authenticated insert" on storage.objects for insert to authenticated with check (bucket_id='used-phone-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "used images owner/admin read" on storage.objects for select to authenticated using (bucket_id='used-phone-images' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

insert into public.site_settings(key,value) values
('store', '{"name":"MobileHub","phone":"+92 300 1234567","whatsapp":"923001234567","address":"Lahore, Pakistan","delivery_fee":500,"free_delivery_threshold":50000}'::jsonb)
on conflict do nothing;
