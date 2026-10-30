# Milestone 10 — launch checklist

This is a provider-neutral preparation guide for the two CHICC websites and the shared Supabase project. It does not select a host, buy a domain, create a paid service, or deploy anything. The CHICC domain has not been purchased.

Complete the staging steps before accepting real customer orders. Use a separate test Supabase project for order and inventory walkthroughs; do not create test orders in a live database.

## 1. Prepare a clean release

- [ ] Install the supported Node.js version and npm on the computer or CI runner used to build the apps.
- [ ] At the repository root, run `npm install`. Commit the generated `package-lock.json` so later releases use the same dependency versions.
- [ ] Confirm the two apps still run locally on ports 3000 and 3001.
- [ ] Run the release checks from the repository root:

  ```powershell
  npm run typecheck
  npm run build:storefront
  npm run build:staff
  ```

- [ ] Fix any errors before uploading the code to a hosting provider.
- [ ] Confirm `.env.local`, `.env`, and other secret files are absent from the commit. The repository `.gitignore` excludes them.
- [ ] Choose two independent Next.js deployments that support npm workspaces. Configure each deployment to install from the monorepo root and build its own app with `npm run build:storefront` or `npm run build:staff`.

## 2. Prepare Supabase

- [ ] Decide which Supabase project is for staging and which is for production. Keep production customer data out of staging.
- [ ] Sign in to the Supabase CLI and link it to the intended project. Check the project reference before every migration or function command:

  ```powershell
  npx supabase@latest login
  npx supabase@latest link --project-ref YOUR_PROJECT_REF
  npx supabase@latest migration list
  npx supabase@latest db push --dry-run
  ```

- [ ] Review the dry-run list and the SQL for every pending migration. Only after confirming the project and migration list, apply them:

  ```powershell
  npx supabase@latest db push
  ```

  `db push` applies migrations that are still pending. Do not run `db reset` against production or use seed data there. See the [Supabase migration workflow](https://supabase.com/docs/guides/local-development/cli-workflows).

- [ ] Keep public sign-up disabled. Create the first manager through the documented owner setup, then use **Team** to activate confirmed staff and delivery-worker accounts. Remove access promptly when a worker leaves.
- [ ] Review Supabase Security Advisor and the RLS policies. Confirm anonymous users can see published catalog information and submit website orders only through the order function; they must not read orders or change catalog data.
- [ ] Confirm the product image bucket is public by design. Upload only product photos intended for public viewing; do not put customer or staff images there.
- [ ] Decide how backups and recovery will work for the selected Supabase plan. Check its current backup, restore, inactivity, and resource limits before accepting real orders. Supabase's [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) explains the project checks to review.

## 3. Configure Auth, the order function, and secrets

- [ ] In each website deployment's production environment settings, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using values from the same Supabase project. These are public client settings and Next.js includes `NEXT_PUBLIC_` values in the browser bundle; see the [Next.js environment-variable guide](https://nextjs.org/docs/pages/guides/environment-variables).
- [ ] Do not add an `sb_secret_...` or service-role key to either website, source code, a `NEXT_PUBLIC_` variable, or a committed environment file.
- [ ] In **Supabase Dashboard → Edge Functions → Secrets**, set `CHICC_SUPABASE_SECRET_KEY` to the project's server-only secret key. Set it only as an Edge Function secret. Supabase documents production function secrets [here](https://supabase.com/docs/guides/functions/secrets).
- [ ] Set `CHICC_STOREFRONT_ORIGIN` to the exact storefront origin, including `https://` and no path, for example `https://shop.example.com`. For staging and production origins, separate the exact origins with commas.
- [ ] Deploy the website order function to the confirmed project:

  ```powershell
  npx supabase@latest functions deploy place-website-order --project-ref YOUR_PROJECT_REF
  ```

  This function intentionally accepts guest requests. Its origin allowlist, request validation, database rate limit, and secret storage are important launch controls. They are basic abuse protection; CORS alone does not prevent direct non-browser requests. Review the endpoint's exposure before promoting a public launch.
- [ ] In **Supabase Dashboard → Authentication → URL Configuration**, set the Site URL to the staff site's production origin. Add only the exact staff and necessary preview redirect URLs. Keep localhost URLs for development only where needed. Supabase recommends exact production redirect URLs in its [Auth redirect guide](https://supabase.com/docs/guides/auth/redirect-urls).
- [ ] Check that email invitation and recovery links open the staff site, and that an unauthenticated visitor to the staff site is redirected to its login page.

## 4. Deploy the two apps separately

- [ ] Create one hosting project for `apps/storefront` and another for `apps/staff`. Use a hosting provider that supports the repository's Next.js version and npm-workspace dependencies.
- [ ] Set the two public Supabase variables in each project's production environment settings before building. Build the storefront with `npm run build:storefront` and the dashboard with `npm run build:staff` from the monorepo root.
- [ ] Use the host-provided HTTPS URLs first. Domain registration and DNS can be configured later after the domain is purchased.
- [ ] Set the final storefront origin in the Supabase Edge Function secret `CHICC_STOREFRONT_ORIGIN`. If the origin changes, update the secret and verify the function's CORS response.
- [ ] Keep preview deployments pointed at staging data. Do not let preview builds use production credentials by default.

## 5. Walk through the release in staging

- [ ] Open the storefront in French, Arabic, and English. Check that Arabic uses right-to-left layout.
- [ ] Confirm only published catalog products appear. Confirm out-of-stock products cannot be selected.
- [ ] Submit an order for a tracked product in staging. Confirm its available stock decreases once. Cancel the order and confirm the stock is returned once.
- [ ] With one tracked unit remaining, submit two staging orders at nearly the same time. Confirm only one order reserves the unit.
- [ ] Submit an order for an untracked product. Confirm it remains orderable and does not change a stock count.
- [ ] Enter a WhatsApp order from the staff site. Confirm tracked stock is reserved and cancellation returns it.
- [ ] Sign in separately as manager, staff, and delivery worker. Confirm managers can manage team access, staff can manage orders and catalog, and a worker sees only deliveries assigned to that worker.
- [ ] Confirm delivery workers cannot access catalog management or delete catalog entries. Confirm staff cannot use manager-only deletion or team-role controls.
- [ ] Confirm public storefront pages load product images and that no service key appears in browser source, browser storage, or network requests.
- [ ] Verify an order is described to customers as a request that CHICC must confirm. The system does not take payments and does not connect to the WhatsApp API.

## 6. Before accepting real orders

- [ ] Choose who monitors new orders, confirms availability and delivery details, assigns workers, handles cancellation, and responds when the system is unavailable.
- [ ] Decide the business's accepted currencies, delivery areas, customer contact process, and how staff keep stock quantities accurate.
- [ ] Review customer-data handling and applicable privacy requirements for names, phone numbers, addresses, and order history.
- [ ] Confirm an owner can access the Supabase account, website hosting accounts, and recovery credentials. Store credentials in a password manager.
- [ ] Check the current costs and limits for each chosen host and Supabase plan. Free tiers can have limits that affect production availability; this checklist does not promise zero-cost hosting.
- [ ] After purchasing the domain, decide the two hostnames (for example, `shop.<your-domain>` and `team.<your-domain>`), configure DNS and HTTPS at the providers, and update the Supabase Auth URLs and `CHICC_STOREFRONT_ORIGIN` to match.

The user or project owner must perform account creation, project selection, secret entry, migrations, deployment, and any domain purchase. No external accounts, secrets, paid services, or cloud resources were changed for this milestone.
