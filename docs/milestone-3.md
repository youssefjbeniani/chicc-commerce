# Milestone 3 — catalog and order data foundation

This milestone adds versioned database structures for the multilingual catalog, order intake sources, item snapshots, and internal delivery assignment. It does not implement customer checkout or staff order-entry screens.

## Data model

- Categories and products hold French, Arabic, and English display names. Products have a price in minor currency units and an explicit three-letter currency code; no business currency has been assumed.
- Orders record `website` or `whatsapp` as the intake channel. WhatsApp orders can later be entered by staff.
- Order items keep a multilingual product-name snapshot and price at order time, so later catalog edits do not rewrite order history.
- Orders can be assigned to one internal delivery worker. Staff and managers can read all orders; a delivery worker can read only orders assigned to that account.
- Product and category records are public only after publication. Staff and managers can create/update catalog records; deletion is manager-only.

## Deliberately not enabled

At Milestone 3, the migration granted no client insert/update/delete access to orders or order items. Milestone 5 adds validated website requests and staff-entered WhatsApp orders through restricted server-side database functions. Anonymous visitors and customer-role accounts cannot read orders. Staff/managers can read all orders; delivery workers can read only assigned orders. Payment, inventory, variants, tax, discounts, and currency choice remain undecided and are not modeled here.

## Apply after review

The migration is local and unapplied. Review the SQL, then from the monorepo root run. The CLI applies all migrations that are still pending, in timestamp order; at this repository state that can include both Milestone 2 and Milestone 3:

```powershell
npx supabase db push --dry-run
npx supabase db push
```

The first command previews schema changes. The second changes your cloud database and requires your linked project credentials. Do not run the second command until the preview shows the intended CHICC migrations.


