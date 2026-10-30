# Milestone 7 — catalog maintenance

This milestone completes the staff catalog maintenance workflow using the existing RLS policies from Milestone 3. Staff and managers can edit category and product details. Managers alone can delete catalog records.

## Included

- Edit category URL slug, French/Arabic/English name, and publication state.
- Edit product URL slug, SKU, category, multilingual name and description, price, currency, and publication state.
- Validate all submitted data on the server and keep Supabase RLS as the final access check.
- Confirm destructive actions in the browser before submission. A manager-only database policy still enforces deletion.
- Deleting a category leaves its products in the catalog without a category. Deleting a product clears its product reference from older order items, while the saved name, price, SKU, and quantity snapshot remains.
- Optional translated product descriptions may be left blank in any of the three languages.

## Use it

1. Apply the Milestone 2 and 3 migrations as documented in [Milestone 4](milestone-4.md). This milestone adds no SQL migration or cloud resources.
2. Put the same Supabase URL and publishable key in both app `.env.local` files.
3. Sign in at `http://localhost:3001` with an active `staff` or `manager` account and open **Manage catalog**.
4. Expand **Edit** under a category or product to update its fields. Set the publication checkbox off to hide an item without deleting it.
5. A manager can select **Delete** to remove a category or product after confirming. Staff accounts do not receive delete buttons, and the database rejects their direct delete requests as well.
6. Visit `http://localhost:3000` to see published changes. Product image support was added separately in [Milestone 8](milestone-8.md).

No database migration, Supabase account change, domain, or paid service is required for this milestone.
