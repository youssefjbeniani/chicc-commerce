# Milestone 6 — manager team access

This milestone adds a manager-only screen to activate, change, and disable staff and delivery-worker roles. It does not create Auth users or send invitations from CHICC. A trusted project owner creates or invites the person in Supabase Auth; the manager then assigns access after the invited user confirms their email.

## Included

- Managers can see only the email, display name, role, active state, and creation date of internal staff and delivery-worker profiles.
- A manager can promote an existing, email-confirmed Auth user to `staff` or `delivery_worker`, or change the role of an existing staff/worker account.
- Managers can deactivate or reactivate staff and delivery-worker accounts.
- Staff and delivery workers cannot access the Team page or its database functions.
- Managers cannot use this screen to create or promote another manager, modify a manager account, or change their own account. The initial manager still requires a trusted owner to assign the role in Supabase.
- Account creation and email invitations stay in the Supabase Dashboard. No service-role or secret key is added to the staff app.

## Setup in Supabase

The repository migration is `supabase/migrations/20261030030000_manager_team_provisioning.sql`. It is local and unapplied.

1. Follow the repository README to create/link a Supabase project. Confirm the project reference before using the CLI.
2. Review all pending migrations. Then apply them if you are ready for every listed schema change:

   ```powershell
   npx supabase@latest migration list
   npx supabase@latest db push --dry-run
   npx supabase@latest db push
   ```

   The push applies every pending migration in timestamp order, including the identity, catalog/order, order-workflow, and team-management migrations.

3. If there is no manager yet, create or invite your own Auth user in **Authentication → Users**, then use the trusted owner SQL Editor to grant the first manager role as documented in [Milestone 2](milestone-2.md). Do not give yourself or anyone else the manager role from the Team screen; that path intentionally is not available.
4. For each employee, in **Authentication → Users**, choose **Add user → Send invitation**, enter their individual work email, and send the invitation. The invitee must open the message and confirm the email before a manager can activate the staff role. Supabase’s invitation flow is an Auth admin action, so it stays in the Dashboard. Add the staff app origin (for local work, `http://localhost:3001/**`) to **Authentication → URL Configuration → Redirect URLs**, and set the project Site URL to the staff app origin so invitation links return to the sign-in site. For production, use the staff dashboard hostname. If a confirmation link lands elsewhere, open the staff URL after confirming. See the current [Supabase user and invitation guide](https://supabase.com/docs/guides/auth/users).
5. Sign in as a manager at `http://localhost:3001`, open **Manage team**, enter the confirmed email, optional display name, and role, then select **Activate account**. The employee can sign in after activation. The role and active state are checked again by database functions, so the interface is not the security boundary.
6. To change an employee’s role or remove access, update that person in the Team list. Disabling the profile blocks staff access immediately. Existing Auth accounts remain in Supabase; this app does not delete them.

## Access limits

The migration exposes three authenticated RPC functions. Each checks the caller’s active manager profile. The list function reads only internal account columns and emails. Provisioning accepts only `staff` or `delivery_worker` and requires a confirmed email. Account updates can change only those two roles and active status. Direct profile role and active-status updates remain unavailable to authenticated clients.

No Auth accounts were invited or created, no database migration was applied, and no cloud project was changed for this milestone.
