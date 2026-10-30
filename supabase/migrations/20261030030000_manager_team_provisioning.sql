-- Milestone 6: manager-only provisioning for confirmed Auth users.
-- Auth account creation/invitations remain in the Supabase Dashboard.

create function public.list_internal_accounts()
returns table (
  account_id uuid,
  account_email text,
  account_display_name text,
  account_role public.chicc_account_role,
  account_is_active boolean,
  account_created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email, p.display_name, p.role, p.is_active, p.created_at
  from public.profiles as p
  join auth.users as u on u.id = p.id
  where (select public.is_manager())
    and p.role in (
      'staff'::public.chicc_account_role,
      'delivery_worker'::public.chicc_account_role
    )
  order by p.created_at desc, lower(u.email);
$$;

revoke all on function public.list_internal_accounts() from public, anon;
grant execute on function public.list_internal_accounts() to authenticated;

create function public.provision_internal_account(
  p_email text,
  p_role public.chicc_account_role,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_user_id uuid;
  v_email_confirmed_at timestamptz;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if (select auth.uid()) is null or not (select public.is_manager()) then
    raise exception using errcode = '42501', message = 'Manager access required';
  end if;

  if length(v_email) not between 3 and 254
     or position('@' in v_email) < 2
     or position(' ' in v_email) > 0
     or p_role is null
     or p_role not in (
       'staff'::public.chicc_account_role,
       'delivery_worker'::public.chicc_account_role
     )
     or p_display_name is not null and char_length(trim(p_display_name)) > 120 then
    raise exception using errcode = '22023', message = 'Invalid account details';
  end if;

  select u.id, u.email_confirmed_at
    into v_user_id, v_email_confirmed_at
    from auth.users as u
    where lower(u.email) = v_email
    limit 1;

  if not found or v_email_confirmed_at is null then
    raise exception using errcode = 'P0002', message = 'Account not found or email not confirmed';
  end if;
  if v_user_id = (select auth.uid()) then
    raise exception using errcode = '42501', message = 'Managers cannot provision their own account';
  end if;

  update public.profiles as p
  set role = p_role,
      is_active = true,
      display_name = coalesce(nullif(trim(coalesce(p_display_name, '')), ''), p.display_name)
  where p.id = v_user_id
    and p.role in (
      'customer'::public.chicc_account_role,
      'staff'::public.chicc_account_role,
      'delivery_worker'::public.chicc_account_role
    );

  if not found then
    raise exception using errcode = '42501', message = 'This account cannot be managed here';
  end if;

  return v_user_id;
end;
$$;

revoke all on function public.provision_internal_account(text, public.chicc_account_role, text) from public, anon;
grant execute on function public.provision_internal_account(text, public.chicc_account_role, text) to authenticated;

create function public.manage_internal_account(
  p_user_id uuid,
  p_role public.chicc_account_role,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.is_manager()) then
    raise exception using errcode = '42501', message = 'Manager access required';
  end if;
  if p_user_id is null or p_user_id = (select auth.uid())
     or p_is_active is null
     or p_role is null
     or p_role not in (
       'staff'::public.chicc_account_role,
       'delivery_worker'::public.chicc_account_role
     ) then
    raise exception using errcode = '22023', message = 'Invalid account change';
  end if;

  update public.profiles as p
  set role = p_role,
      is_active = p_is_active
  where p.id = p_user_id
    and p.role in (
      'staff'::public.chicc_account_role,
      'delivery_worker'::public.chicc_account_role
    );

  if not found then
    raise exception using errcode = 'P0002', message = 'Internal account not found';
  end if;
end;
$$;

revoke all on function public.manage_internal_account(uuid, public.chicc_account_role, boolean) from public, anon;
grant execute on function public.manage_internal_account(uuid, public.chicc_account_role, boolean) to authenticated;
