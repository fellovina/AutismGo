alter table public.profiles enable row level security;
alter table public.sensory_profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can read their own profile') then
    create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update their own profile') then
    create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sensory_profiles' and policyname = 'Users can read their own sensory profile') then
    create policy "Users can read their own sensory profile" on public.sensory_profiles for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sensory_profiles' and policyname = 'Users can insert their own sensory profile') then
    create policy "Users can insert their own sensory profile" on public.sensory_profiles for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sensory_profiles' and policyname = 'Users can update their own sensory profile') then
    create policy "Users can update their own sensory profile" on public.sensory_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end
$$;
