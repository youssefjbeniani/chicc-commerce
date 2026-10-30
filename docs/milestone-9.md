# Milestone 9 — inventory and stock

This milestone adds optional per-product stock tracking. A blank quantity means stock is not tracked, so the product remains orderable without a stock limit. A value of `0` means tracked and unavailable. A positive value is the current available quantity.

## Included

- Staff and managers can set or clear a product's available quantity when creating or editing it.
- Website and manually entered WhatsApp orders reserve tracked quantities in the same database transaction that creates the order. A simultaneous request cannot reserve the same final unit twice.
- Orders reserve stock while pending or in preparation. A staff member or manager who cancels an eligible order returns the reserved units. Existing orders from before this migration are not treated as having reservations.
- The customer storefront shows an out-of-stock label and disables quantity selection for unavailable products. It shows availability only; exact quantities are limited to signed-in staff and managers.
- The staff WhatsApp order form shows current counts and disables products with zero available.

## Apply and use

1. Install dependencies at the monorepo root with `npm install` if needed.
2. Link the Supabase CLI to the intended project and check its project reference, as described in the [README](../README.md).
3. Review pending migrations, then run `npx supabase@latest db push`. This applies all pending migrations, including `20261030050000_inventory_tracking.sql`.
4. Keep both apps configured for the same Supabase URL and publishable key. No new secret is required.
5. Start the staff app and open **Manage catalog**. In a product's create or edit form, leave **Available stock** blank to skip tracking or enter a whole number (zero is allowed). Save the product.
6. Review the storefront and staff order screen. Orders reserve stock as soon as they are submitted, including WhatsApp orders entered by staff. If staff cancel a pending, confirmed, preparing, or ready-for-delivery order, its reserved units are returned.

The product API grants public storefront visitors only the computed `is_in_stock` value, not the exact `stock_quantity`. Exact counts are available only to authenticated internal accounts. Stock changes are manual inventory adjustments; there is no warehouse integration, barcode scanning, product variants, or purchase-order workflow.

The migration is local until the project owner applies it. No cloud migration, domain purchase, paid service, or deployment was performed here.
