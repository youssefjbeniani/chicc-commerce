# CHICC Commerce Monorepo

Two independently deployable Next.js + TypeScript websites share one Supabase project:

- `apps/storefront` is the public customer website.
- `apps/staff` is the private staff dashboard for individual staff, managers, and delivery workers.
- `packages/` contains shared TypeScript contracts, validation, and UI styles.
- `supabase/` contains ordered SQL migrations and the website-order Edge Function.

The project currently includes staff authentication and role checks, multilingual catalog management and browsing, product image uploads, website and manually entered WhatsApp order intake, worker assignment, delivery status updates, and optional stock tracking. Online payment, a WhatsApp API connection, production deployment, and domain setup are not included. See the [launch checklist](docs/launch-checklist.md) before preparing a public release, and the [Netlify free-host preparation](docs/netlify-deployment.md) for the two-site deployment configuration. Review [the architecture](docs/architecture.md) and [milestone status](docs/milestones.md).

## Prerequisites

1. Install Node.js 24 LTS (or Node.js 20.9 or newer) from [nodejs.org](https://nodejs.org/). The installer includes npm.
2. Install Git for Windows from [git-scm.com](https://git-scm.com/download/win).
3. Use PowerShell and an editor such as Visual Studio Code.
4. To connect the apps, create a Supabase account and project. Start on the Free plan; do not enable paid resources for this setup.

Open PowerShell in the `chicc` repository folder and confirm installation:

```powershell
node --version
npm --version
git --version
```

Node should report at least `v20.9.0`. If `npm` is not recognized after installing Node, close and reopen PowerShell.

## Install and run locally

Install dependencies once from the monorepo root:

```powershell
npm install
```

Create an environment file for each app:

```powershell
Copy-Item apps/storefront/.env.example apps/storefront/.env.local
Copy-Item apps/staff/.env.example apps/staff/.env.local
```

Copy the same Supabase Project URL and public publishable key into both files, using each example’s variable names. Find those values in **Supabase Dashboard → Project Settings → API Keys**. A legacy `anon` key is also a public client key. Do not use an `sb_secret_...` or `service_role` key in either app.

Start the storefront in one PowerShell window:

```powershell
npm run dev:storefront
```

Open <http://localhost:3000>. Start staff in another PowerShell window:

```powershell
npm run dev:staff
```

Open <http://localhost:3001>. Stop either app with **Ctrl+C** in its window. The staff login and database-backed features need a configured Supabase project and migrations.

## Configure Supabase and apply migrations

These steps require the project owner’s Supabase login and project credentials. The repository does not contain them.

1. Create a Supabase project and save its database password in a password manager. Copy the Project URL and publishable key to both `.env.local` files.
2. From PowerShell at the repository root, authenticate the Supabase CLI and link this local repo to the project:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   ```

3. Review the SQL migrations, then apply all pending migrations in timestamp order (Milestones 2–9):

   ```powershell
   npx supabase@latest migration list
   npx supabase@latest db push
   ```

4. Create or activate the first manager account by following [Milestone 2 setup](docs/milestone-2.md). Keep public sign-up disabled. A trusted project owner assigns the initial manager role in `public.profiles`; the manager can later provision staff and delivery workers in the Team screen.
5. Follow [Milestone 5 setup](docs/milestone-5.md) to add the server-only Edge Function secret, deploy `place-website-order`, and run through the order workflow. After applying Milestone 6, managers can assign roles to confirmed accounts in the [Team screen](docs/milestone-6.md). Apply Milestone 8 for the product image bucket and staff uploads, and Milestone 9 for inventory tracking. Never put a secret key in an app environment file or a `NEXT_PUBLIC_` variable.

Supabase migration and function commands change the connected cloud project. Check the linked project reference before running them. No migration has been applied and no Edge Function has been deployed by this repository setup.

## Project map

```text
apps/
  storefront/       Customer website (development port 3000)
  staff/            Private staff website (development port 3001)
packages/
  types/            Shared TypeScript contracts
  validation/       Shared Zod schemas
  ui/               Shared UI styles
supabase/
  migrations/       Ordered database migrations
  functions/        Edge Functions
  tests/            Database-test directory
  config.toml       Local Supabase configuration
docs/                Architecture and milestone guides
```

## Security and service boundaries

The storefront and staff dashboard are separate apps, routes, environments, and deployments. They share a Supabase project. Browser code may contain only the project URL and publishable/legacy anon key. RLS restricts data access by the signed-in user and role. Delivery workers can read only orders assigned to their individual account. Guest website requests pass through a server-side Edge Function that holds the Supabase secret and calls narrowly granted database functions. Do not expose service-role/secret credentials to browser code or commit them.

The customer and staff sites can later use different hostnames. The CHICC domain has not been purchased. Local development uses `localhost`; domain registration and production deployment are separate steps and may incur costs.

## Useful commands

```powershell
npm run typecheck
npm run build:storefront
npm run build:staff
```

Run these after installing dependencies. The current environment may need Node.js/npm installed before they can run.

## Milestones

- [Milestone 1](docs/milestones.md#milestone-1--repository-foundation): monorepo and app scaffolding.
- [Milestone 2](docs/milestone-2.md): staff identity and access foundation.
- [Milestone 3](docs/milestone-3.md): catalog, orders, and RLS data model.
- [Milestone 4](docs/milestone-4.md): catalog browsing and staff creation.
- [Milestone 5](docs/milestone-5.md): order intake, manual WhatsApp entry, worker assignment, and delivery statuses.
- [Milestone 6](docs/milestone-6.md): manager-only team role and account access management.
- [Milestone 7](docs/milestone-7.md): catalog editing and manager-only deletion.
- [Milestone 8](docs/milestone-8.md): optional product images with restricted staff uploads.
- [Milestone 9](docs/milestone-9.md): optional inventory tracking and transactional stock reservations.
- [Milestone 10 launch checklist](docs/launch-checklist.md): provider-neutral release preparation; no services or domains are created.

Milestones 2, 3, 5, 6, 8, and 9 have local migrations; Milestones 4 and 7 use the existing schema and policies. Supabase account actions, project changes, secret setup, domain purchase, and deployment remain for the owner to perform. Product images in the public bucket can be viewed by anyone with their URL.
