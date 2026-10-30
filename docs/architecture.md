# CHICC architecture

## Applications

`apps/storefront` is the public customer site. `apps/staff` is a separately built and deployed staff dashboard. Each owns its routes, environment file, release, and eventual hostname. Neither app imports the other. Shared contracts and UI live in `packages/`.

Both apps connect to one Supabase project using the project URL and a publishable key. Supabase Auth identifies users; Postgres RLS policies decide which records each signed-in user can access. The staff app requires an active internal account for its workspace route. Staff accounts are individual accounts with roles assigned by a trusted project owner, never by public signup. Catalog reads are public only for published entries. Order data is private: staff/managers can read all orders and delivery workers can read only assigned orders. Direct client writes to order tables stay disabled. Staff writes use role-checked database functions. Guest website requests use a server-side Edge Function that holds the Supabase secret and calls a service-role-only RPC.

## Languages and layout

The product languages are French (`fr`), Arabic (`ar`), and English (`en`). The staff login and starter workspace offer all three. Catalog name fields require all three translations. Arabic pages set the document direction to right-to-left (`rtl`); French and English use left-to-right (`ltr`). Keep user-facing strings ready for translation instead of embedding language-specific copy in business logic.

## Orders and delivery

The order intake channels are website requests and WhatsApp. During the initial release, staff manually enter WhatsApp orders through the staff app; no WhatsApp platform/API integration is assumed. Delivery is handled by internal workers. Orders can be requested on the storefront or entered manually by staff after a WhatsApp conversation. Orders start pending, then move through confirmation, preparation, ready for delivery, out for delivery, and delivered; staff can cancel before dispatch. Active delivery workers have individual accounts and only read assigned orders.

Prices use integer minor units paired with a three-letter currency code. Currency is entered per product. Optional inventory tracking reserves units when a website or WhatsApp order is created and returns them if the order is cancelled before dispatch. No payment provider, tax, discount, or product-variant behavior has been selected. Order items keep a multilingual product-name and price snapshot so later catalog edits do not change the record of an existing order.

## Secrets and environments

Each app has its own `.env.local`, excluded from Git. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public configuration and may be used by browser code. A legacy anon key may be used as the publishable-key equivalent. A Supabase secret/service-role key must never use a `NEXT_PUBLIC_` name, enter client code, or be committed. Prefer user-scoped clients plus RLS; reserve privileged server operations for a carefully scoped server-only implementation.

Development and production should use separate Supabase projects once production data exists. The Milestone 2–5 migrations and website-order Edge Function are local only until the project owner applies/deploys them. The Edge Function secret must be configured in Supabase Function secrets and must never be copied into an app `.env.local` file.

## Catalog browsing and staff creation

The storefront reads only published categories/products. Staff and managers can create category/product records through server actions using their signed-in Supabase client; Row Level Security grants the final authority. The login, starter dashboard, catalog creation forms, and storefront currently offer French, Arabic, and English. Product entries can be published when they are created, and their names are required in all three languages.

Staff and managers can edit catalog entries; only managers can delete them. Optional product images use the public `chicc-product-images` Storage bucket. Staff and managers upload and remove images through their signed-in sessions; public URLs are readable by anyone. Product stock uses nullable quantities, atomic order-time reservations, and cancellation restocking; exact quantities are not exposed to anonymous storefront visitors. Variants, payment, tax, automated WhatsApp integration, and customer tracking remain future work. Website order requests and manual WhatsApp entry are implemented through server-side validation; order-table client writes remain revoked.

## Team access management

The first manager role is assigned by a trusted project owner. Managers can use the staff app to promote confirmed Auth accounts to `staff` or `delivery_worker`, change between those roles, and deactivate/reactivate access. Account invitations remain in the Supabase Dashboard. A manager cannot create another manager from the app. Database RPCs enforce these limits and the profiles table continues to reject direct client changes to role and active status.