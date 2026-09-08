-- Shared, database-backed abuse protection for public form endpoints.

create extension if not exists pgcrypto;

create table if not exists public.rate_limits (
  action text not null,
  identifier_hash text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  primary key (action, identifier_hash)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(p_action text, p_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  max_requests integer;
  window_seconds integer;
  hashed_identifier text;
  current_row public.rate_limits;
  seconds_remaining integer;
begin
  select limits.max_requests, limits.window_seconds
  into max_requests, window_seconds
  from (values
    ('order:create', 5, 600),
    ('order:track', 20, 60),
    ('used-phone:create', 5, 600)
  ) as limits(action, max_requests, window_seconds)
  where limits.action = p_action;

  if max_requests is null or nullif(trim(p_identifier), '') is null then
    raise exception 'Invalid rate-limit request';
  end if;

  hashed_identifier := encode(extensions.digest(p_identifier, 'sha256'), 'hex');

  insert into public.rate_limits(action, identifier_hash, window_start, request_count)
  values (p_action, hashed_identifier, now(), 1)
  on conflict (action, identifier_hash) do update set
    window_start = case
      when rate_limits.window_start + make_interval(secs => window_seconds) <= now() then now()
      else rate_limits.window_start
    end,
    request_count = case
      when rate_limits.window_start + make_interval(secs => window_seconds) <= now() then 1
      else rate_limits.request_count + 1
    end
  returning * into current_row;

  seconds_remaining := greatest(1, ceil(extract(epoch from
    current_row.window_start + make_interval(secs => window_seconds) - now()
  ))::integer);

  return jsonb_build_object(
    'allowed', current_row.request_count <= max_requests,
    'limit', max_requests,
    'remaining', greatest(0, max_requests - current_row.request_count),
    'retry_after', seconds_remaining
  );
end;
$$;

revoke all on function public.consume_rate_limit(text, text) from public;
grant execute on function public.consume_rate_limit(text, text) to anon, authenticated;

create index if not exists rate_limits_window_start_idx on public.rate_limits(window_start);
