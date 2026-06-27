drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
  on public.user_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.user_profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and coalesce(is_admin, false) = false
  );

drop policy if exists "Users can update their own profile" on public.user_profiles;

create policy "Users can update their own profile"
  on public.user_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and is_admin = false
  );
