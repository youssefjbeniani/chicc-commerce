# Milestone 5 — order intake and internal delivery

This milestone adds website order requests, staff entry for WhatsApp orders, worker assignment, and delivery status changes. It does not add online payment, a WhatsApp integration, product stock, or public deployment.

## Included

- The storefront sends a guest order request to the `place-website-order` Supabase Edge Function. It accepts customer contact and delivery details plus product IDs and quantities; Postgres looks up current published product prices and creates immutable order-item snapshots. The server-calculated total is authoritative. The Edge Function has JWT verification disabled because guests do not sign in; it validates requests itself and exposes only the public order-creation path.
- The initial order status is `pending`. The customer sees that CHICC received the request and the team will contact them to confirm delivery. No payment is collected.
- Staff and managers can enter WhatsApp orders manually in the private app. They can assign an active individual delivery-worker account and manage order statuses.
- Delivery workers can read only their own assigned orders and can advance an assigned order from ready to out for delivery, then delivered.
- The Edge Function limits the payload, validates inputs, uses an origin allowlist and a honeypot field, and applies a database rate limit of 10 valid-format order attempts per IP hash per hour. The database stores an IP hash and deletes entries older than 24 hours.
- Order and order-item client writes remain revoked. App writes use role-checked database functions; only the Edge Function holds the Supabase secret needed for guest orders.

## Status path

1. New website or manually entered WhatsApp order starts as `pending`.
2. Staff/manager can confirm or cancel it.
3. A confirmed order can move to `preparing`, then `ready_for_delivery`.
4. A worker assigned to that order can move it to `out_for_delivery`, then `delivered`. Managers can also make the delivery transitions after assignment.
5. Assignments can change before the order leaves for delivery. Delivered and cancelled orders are closed.

## Connect a Supabase project

These are actions for the project owner because they require the owner’s Supabase account, project reference, and secret key. The repository does not store those credentials.

1. Install Node.js 24 LTS and Git for Windows. Open PowerShell in the monorepo folder and run `npm install`.
2. Create a Supabase project on the Free plan. In **Project Settings → API**, copy the Project URL and publishable key. Put those public values in both `apps/storefront/.env.local` and `apps/staff/.env.local` using the variable names in each `.env.example`.
3. In a PowerShell window at the repo root, authenticate and link the CLI to the new project:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   ```

   The project reference is shown in the Supabase Dashboard project URL. The CLI may ask for the database password you created when making the project; enter it in the prompt and do not add it to app environment files.

4. Inspect the pending local migrations, then apply them:

   ```powershell
   npx supabase@latest migration list
   npx supabase@latest db push
   ```

   This applies all pending local migrations in timestamp order. Read the SQL files before confirming the CLI prompt. The order-intake function and dashboard depend on these schema changes.

5. Add the Edge Function secret in the Supabase Dashboard. Open **Edge Functions → Secrets**, add a secret named `CHICC_SUPABASE_SECRET_KEY`, paste the project server-only secret key (`sb_secret_...`) as its value, and save it. A project owner/admin may be required. Do not paste the key into a terminal or either app `.env.local`; it must only be available to the Edge Function. The key lets this server function call privileged database RPCs, so treat it like a password.
6. Deploy only the website-order function:

   ```powershell
   npx supabase@latest functions deploy place-website-order
   ```

   The function accepts local storefront origins `http://localhost:3000` and `http://127.0.0.1:3000`. Before deploying the storefront to a real domain, add `CHICC_STOREFRONT_ORIGIN` in the same Supabase **Edge Functions → Secrets** page and set its value to the exact storefront origin (for example `https://shop.example.com`). Multiple origins may be separated by commas. The new domain must be purchased and configured separately; no domain is included or purchased here.
7. Start both apps in separate PowerShell windows:

   ```powershell
   npm run dev:storefront
   ```

   ```powershell
   npm run dev:staff
   ```

   Open `http://localhost:3000` for the storefront and `http://localhost:3001` for the staff app. Once the earlier migrations are applied and a manager has published products, website requests appear in **Orders**. Staff and managers can enter the first WhatsApp requests manually there.

## Staff and worker accounts

Follow [Milestone 2 account setup](milestone-2.md) to create the initial manager account. Do not enable public signup. After applying the Milestone 6 migration, the manager can assign `staff` or `delivery_worker` to confirmed Auth accounts in the [Team screen](milestone-6.md). Staff and managers can assign orders only to active profiles whose role is `delivery_worker`.

## Limitations before accepting real public orders

The storefront provides a request and confirmation flow only. There is no card payment, automated WhatsApp integration, inventory reservation, tax calculation, or customer order tracking. The order endpoint has basic abuse controls, not a CAPTCHA or a full production anti-abuse service; review operational protection and privacy requirements before promoting a public launch. Do not treat a request as paid or confirmed until staff completes the next step.

No cloud migration, function deployment, secret creation, domain purchase, or paid service was performed during this milestone. The migration and function are local files pending your Supabase account setup.
