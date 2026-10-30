# Milestone boundaries

## Milestone 1 — repository foundation

- Two independent Next.js + TypeScript apps in one npm-workspaces monorepo.
- Shared types, Zod validation, and UI packages.
- Supabase configuration and empty migration, Edge Function, and database-test foundations.
- Architecture, setup, and security-boundary documentation.
- No ordering, authentication, payment, or delivery features.

## Milestone 2 — staff identity and access foundation (implemented locally)

- Add individual Supabase Auth accounts and profile roles for customers, staff, delivery workers, and managers.
- Enable Row Level Security and prevent ordinary users from changing privileged account fields.
- Add email/password staff login, session refresh, protected staff routes, and French/Arabic/English starter screens.
- Document account setup and manager/worker role provisioning.

The migration is local and unapplied. See [docs/milestone-2.md](milestone-2.md).

## Milestone 3 — catalog and order data foundation (implemented locally)

- Define multilingual category/product data and published-catalog access.
- Define website and WhatsApp order channels, order-item snapshots, and delivery-worker assignment.
- Restrict catalog writes to staff/manager roles and order reads to staff/managers or the assigned delivery worker.
- At this milestone, order writes were disabled until the server-side workflow was implemented in Milestone 5.

The migration is local and unapplied. See [docs/milestone-3.md](milestone-3.md).

## Later milestones

Payments, tax, variants, and production deployment remain future work until business requirements are chosen. Product images are handled in Milestone 8 and stock tracking in Milestone 9. Keep the storefront and staff app independently deployable throughout.

## Milestone 4 — catalog browsing and creation (implemented locally)

- Show published categories and products on the customer storefront in French, Arabic, or English.
- Allow staff/managers to create multilingual categories and products through server-validated forms.
- Keep order submission, editing/deleting entries, product images, inventory, and variants out of scope for this milestone.

The app requires the earlier migrations to be applied to Supabase. See [docs/milestone-4.md](milestone-4.md).

## Milestone 5 — order intake and internal delivery (implemented locally)

- Accept guest order requests from the website through a server-side Supabase Edge Function.
- Allow staff/managers to enter WhatsApp orders manually, since no WhatsApp API integration was chosen.
- Allow staff/managers to assign active individual delivery workers and move orders through the defined statuses. Workers can update only their own assigned deliveries.
- Keep payment processing and inventory out of scope.

See [docs/milestone-5.md](milestone-5.md) for setup, required owner credentials, and the end-to-end workflow. The migration and Edge Function are local and have not been deployed.
## Milestone 6 — manager team access (implemented locally)

- Let managers activate confirmed Auth accounts as staff or delivery workers.
- Let managers change staff/worker roles and deactivate/reactivate access.
- Keep Auth account creation and invitation in the trusted Supabase Dashboard; the app has no secret key and cannot create manager accounts.

See [docs/milestone-6.md](milestone-6.md) for account invitations, migration steps, and access limits. The migration is local and unapplied.
## Milestone 7 — catalog maintenance (implemented locally)

- Let staff/managers edit categories and products with server validation and existing RLS policies.
- Keep deletion manager-only; preserve order item snapshots when products are removed.
- Keep inventory and variants as future work.

See [docs/milestone-7.md](milestone-7.md) for the workflow. No migration or cloud change is required. Inventory tracking followed in Milestone 9.
## Milestone 8 — product images (implemented locally)

- Add a public storefront image bucket with staff/manager-only uploads and deletes, content limits, and path constraints.
- Let staff/managers upload, replace, preview, and remove product images; show published images on storefront product cards.
- Public image URLs are readable by anyone. Do not upload private or customer images.

See [docs/milestone-8.md](milestone-8.md). The migration is local and unapplied.

## Milestone 9 — inventory tracking (implemented locally)

- Let staff and managers set optional product stock quantities; blank means untracked.
- Reserve tracked units atomically for website and staff-entered WhatsApp orders.
- Return reserved units when an eligible order is cancelled, and show availability without exposing exact counts publicly.

See [docs/milestone-9.md](milestone-9.md). The migration is local and unapplied.

## Milestone 10 — launch preparation checklist (docs only)

See [docs/launch-checklist.md](launch-checklist.md) for provider-neutral preparation steps. The later Milestone 11 selected Netlify as the recommended free-host preparation target; no deployment or cloud change was made.

## Milestone 11 — free-host deployment preparation (local configuration and docs only)

See [docs/netlify-deployment.md](netlify-deployment.md) for two independent Netlify site settings and owner-operated deployment steps. The app-specific `netlify.toml` files set each workspace build command. No account was connected, repository pushed, cloud resource changed, domain purchased, or deployment performed.

