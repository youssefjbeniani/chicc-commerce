# Milestone 4 — catalog browsing and creation

This milestone connects the storefront to published catalog records and adds a protected staff screen for creating multilingual categories and products.

## Customer storefront

The storefront reads published categories and products using only the project URL and publishable key. Visitors can switch French, Arabic, or English, filter by category, and view the product name, description, and localized price. Unpublished records are filtered by Row Level Security and the published flag. The current image area is a visual placeholder; product image storage is not configured.

## Staff catalog screen

Staff and managers can add categories and products with French, Arabic, and English names. Product records include an optional SKU/description/category, a currency code, and a major-unit price that the server converts to integer minor units. Records are drafts by default and can be published during creation. Delivery workers do not get catalog access. Database policies remain the final enforcement layer for these writes.

This milestone introduced catalog creation and listing. Milestone 5 adds customer order requests and internal delivery management. Milestone 7 adds editing and manager-only deletion; image upload, stock/inventory, product variants, and payment remain future work.

## Setup requirement

Apply the Milestone 2 and 3 migrations to your Supabase project before using the screens. Put the same Project URL and publishable key in both app `.env.local` files, then run `npm run dev:storefront` and `npm run dev:staff`. The storefront shows an empty catalog until published products exist. Staff catalog creation requires a signed-in `staff` or `manager` profile.

No service-role or secret key is used by either app. Storefront reads use public RLS policies. Staff writes use the worker's Supabase session and staff-only RLS policies.
