-- Milestone 2 foundation: individual identities and a minimal staff access boundary.
-- No product, order, payment, or delivery tables are introduced here.

create type public.chicc_account_role as enum (
  'customer', 'staff', 'delivery_worker', 'manager'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.chicc_account_role not null default 'customer',
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 120
  )
);

comment on table public.profiles is
  'One application profile per Supabase Auth user. Roles are assigned by a trusted manager, never by self-signup.';

alter table public.profiles enable row level security;

-- Clear any inherited grants, then expose only safe columns to signed-in clients.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.is_active
      and p.role in (
        'staff'::public.chicc_account_role,
        'delivery_worker'::public.chicc_account_role,
        'manager'::public.chicc_account_role
      )
  );
$$;

create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.is_active
      and p.role = 'manager'::public.chicc_account_role
  );
$$;

revoke all on function public.is_internal_user() from public, anon;
revoke all on function public.is_manager() from public, anon;
grant execute on function public.is_internal_user() to authenticated;
grant execute on function public.is_manager() to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Managers can read all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_manager()));

create policy "Users can update their own display name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and is_active)
  with check (id = (select auth.uid()) and is_active);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- New Auth users start as customers. A trusted manager must promote internal
-- accounts through a protected provisioning path before staff access is given.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'customer'::public.chicc_account_role,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


