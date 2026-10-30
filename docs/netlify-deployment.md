# Netlify free hosting preparation

This guide prepares two independently deployed CHICC Next.js apps on Netlify Free. It does not create an account, connect a Git provider, deploy the websites, or buy a domain. The domain has not been purchased.

Netlify Free is the current $0/month option with a hard limit of 300 credits per month and no automatic credit recharge. Netlify says Free can host commercial projects. If the monthly limit is reached, sites pause until the next cycle. Treat this as a low-traffic launch or staging option, not an uptime guarantee. Review current [pricing and limits](https://www.netlify.com/pricing/) before launch. The Free plan supports personal-account Git repositories; organization-owned private repositories require an eligible paid plan. The staff accounts used by CHICC workers are application accounts and do not require Netlify seats. See [Netlify Git repository support](https://docs.netlify.com/build/git-workflows/overview/) and [Netlify monorepo setup](https://docs.netlify.com/build/configure-builds/monorepos/).

Netlify supports the Next.js App Router, Server Actions, route handlers, and image optimization with its managed Next.js adapter. CHICC has two separate sites in one npm workspaces repository. Each app has its own `netlify.toml`; both builds install from the repository root and run that app's root workspace script.

## Before creating the Netlify sites

1. Install Node.js 24 LTS and Git, then open PowerShell in the repository root.
2. Install dependencies and create the lockfile:

   ```powershell
   npm install
   ```

   Commit `package-lock.json` with the project. This repository currently has no lockfile. A committed lockfile makes Netlify installs repeatable.
3. Run the release checks before pushing the repository:

   ```powershell
   npm run typecheck
   npm run build:storefront
   npm run build:staff
   ```

4. Commit the repository and push it to a Git provider account you control. If using Netlify Free, a personal-account repository can be private or public; a private repository owned by a Git organization may require a paid Netlify plan. Do not make the source public solely to work around a plan restriction.
5. Create or identify the production Supabase project. Complete the owner-operated migration, first manager, product image bucket, and Edge Function steps in the [launch checklist](launch-checklist.md) before sending customers to the sites.

## Create two Netlify sites

In Netlify, create a site from the same CHICC Git repository twice. The UI wording may change, but set each site's package directory and keep its base directory at the repository root (unset). Netlify's monorepo workflow uses the root to install npm workspace dependencies and the package directory to locate each app's `netlify.toml`.

### Storefront site

- Site/package directory: `apps/storefront`
- Base directory: leave blank (repository root)
- Build command: `npm run build:storefront` (read from `apps/storefront/netlify.toml`)
- Publish directory: leave blank for Netlify's Next.js adapter
- Framework: Next.js, detected automatically
- Production URL: use the Netlify-provided HTTPS URL until CHICC buys a domain

### Staff site

- Site/package directory: `apps/staff`
- Base directory: leave blank (repository root)
- Build command: `npm run build:staff` (read from `apps/staff/netlify.toml`)
- Publish directory: leave blank for Netlify's Next.js adapter
- Framework: Next.js, detected automatically
- Keep staff routes protected by CHICC login and role checks. Do not rely on a private Netlify preview/project setting as the staff authorization boundary.

When prompted to make the sites public, publish the storefront so customers can access it. Publish the staff site URL as needed for workers to sign in; its application login and Supabase authorization remain required. Netlify project visibility controls provider-level access and is separate from CHICC user accounts.

## Set app environment variables

In each site's environment variable settings, add the same two public values from the production Supabase project:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (legacy `anon` key is also a public client key) |

Set them for the Production deploy context on both sites, then trigger production builds. Do not add `sb_secret_...`, `service_role`, database passwords, or any other Supabase secret to Netlify app variables. Never name a secret with the `NEXT_PUBLIC_` prefix.

For Deploy Previews and branch deploys, use a separate staging Supabase project and staging values. Do not configure preview builds with production credentials. The order function checks exact browser origins; preview orders will be rejected unless their exact origin is allowed in the staging function. Avoid broad wildcard origins.

## Configure Supabase for the deployed URLs

After the first production builds, copy the HTTPS origins Netlify assigned to each site (origin only, with no path).

1. In Supabase **Authentication → URL Configuration**, set **Site URL** to the staff site's HTTPS origin. Add the exact staff site's production URL to the redirect allow list. Keep localhost entries only for local development. Test invitation and recovery links.
2. In Supabase **Edge Functions → Secrets**, set `CHICC_SUPABASE_SECRET_KEY` to the server-only Supabase secret key. Set `CHICC_STOREFRONT_ORIGIN` to the storefront's exact HTTPS origin, for example `https://chicc-storefront.netlify.app`.
3. If using a separate staging project, deploy the function there too and set only staging origins/secrets in that project.
4. Deploy `place-website-order` to the confirmed Supabase project from the repository root:

   ```powershell
   npx supabase@latest functions deploy place-website-order --project-ref YOUR_PROJECT_REF
   ```

   Confirm `YOUR_PROJECT_REF` before running this command. Cloud migrations and function deployment change the selected Supabase project.
5. Submit a staging order and confirm it reaches the staff dashboard. Check browser network requests and source to confirm no Supabase secret is exposed.

The detailed migration, Auth, order, inventory, and security preparation is in [Milestone 10](launch-checklist.md). Supabase production URLs and Edge Function secrets must be updated after changing the Netlify site URL or adding a final custom domain.

## When the custom domain is purchased

Pick two distinct hostnames, such as `shop.example.com` and `team.example.com`. Add each hostname to its matching Netlify site and follow the DNS/HTTPS instructions shown by Netlify. Then update:

- Supabase Auth Site URL and exact redirect allow-list entries to the staff hostname.
- `CHICC_STOREFRONT_ORIGIN` in Supabase Edge Function secrets to the storefront hostname.
- Any preview/staging origin configuration, if applicable.

Do not purchase a domain as part of this preparation.

## Owner actions still required

Netlify/Git/Supabase account access, repository push, environment variable entry, Supabase migrations and secrets, first manager provisioning, and the actual deploy all require the project owner's credentials and deliberate project selection. No accounts, credentials, paid services, cloud resources, or deployments were changed while preparing these files.
