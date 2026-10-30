# Milestone 2 — staff identity and access

The staff app now supports email/password sign-in for individual accounts, refreshes and verifies Supabase sessions in the Next.js Proxy, and checks the caller's active profile role on the server before rendering the workspace. The database migration creates a profile for each Auth account, gives new accounts the customer role by default, enables Row Level Security, and prevents ordinary users from changing privileged profile fields. The sign-in and starter workspace screens support French, Arabic, and English.

The login UI does not offer public registration. A staff account must exist in Supabase Auth and its profile must be assigned `staff`, `delivery_worker`, or `manager` by a trusted project owner. Workers should each have their own account.

## Apply and configure Supabase

1. Create your Supabase project and configure the two app `.env.local` files as described in the repository README.
2. From the monorepo root, install the CLI as a project development dependency:

   ```powershell
   npm install --save-dev supabase
   ```

3. Authenticate and link this local repository to the project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --dry-run
   ```

4. Read the dry-run result. `db push` applies every unapplied migration in timestamp order. In this repository that may include both the Milestone 2 identity migration and the Milestone 3 catalog/order migration. Apply only if you are ready for every migration shown:

   ```powershell
   npx supabase db push
   ```

5. In Supabase Dashboard → Authentication → Sign In / Providers, make sure **Email** is enabled. Keep public signups disabled. In Authentication → Users, add an account for yourself. Then use the SQL Editor to grant that account the initial manager role, replacing the email with the same address you added:

   ```sql
   update public.profiles as p
   set role = 'manager'
   from auth.users as u
   where p.id = u.id
     and u.email = 'YOUR_MANAGER_EMAIL'
     and p.role = 'customer';
   ```

6. For each worker, add an individual account in Authentication → Users. Use the SQL Editor to set that account's role to `delivery_worker` (or `staff` for non-delivery staff). Change the email in the query each time:

   ```sql
   update public.profiles as p
   set role = 'delivery_worker'
   from auth.users as u
   where p.id = u.id
     and u.email = 'WORKER_EMAIL'
     and p.role = 'customer';
   ```

7. Start the staff app with `npm run dev:staff` and open <http://localhost:3001>. Sign in with the account you created.

The CLI asks for your Supabase access token and database password. Enter them directly into the CLI; do not paste them into chat or commit them. The project reference is the identifier in your Supabase project URL. The `db push` command changes the remote schema, so inspect its dry-run output first. No credentials are stored in this repository.

## Access boundary

- The Proxy verifies the Supabase token and refreshes the cookie session.
- The protected workspace layout checks the caller profile and accepts only active internal roles.
- RLS allows users to read their own profile and managers to read profiles for account administration.
- Authenticated clients can update only their own display name; role and active status are not client-writable.
- The browser receives only the project URL and publishable key. No secret/service-role key is used.

The profile and session checks protect the starter staff route. The product/order/delivery tables and their per-role RLS policies were added in later milestones. Manager account provisioning UI was added in Milestone 6. Auth invitations remain a trusted project-owner action in the Supabase Dashboard; MFA policy remains future work.

