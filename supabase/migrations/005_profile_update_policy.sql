-- Allow every signed-in user, including admins, to edit only their own safe profile fields.
-- Column grants prevent customers from changing the protected role column.

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on table public.profiles from authenticated;
grant update(full_name, phone, updated_at) on table public.profiles to authenticated;