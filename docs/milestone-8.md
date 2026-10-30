# Milestone 8 — product images

This milestone adds optional product photography through the dedicated Supabase Storage bucket `chicc-product-images`. Product images are publicly readable because they appear on the customer storefront. Only authenticated staff and managers can upload or remove files; delivery workers have no image write access. The apps use the signed-in user's Supabase client and never expose the service-role key.

## Included

- Optional `products.image_path` with a database constraint that scopes every object path to its product UUID.
- A public Storage bucket restricted to JPEG, PNG, and WebP files up to 5 MB.
- Staff/manager-only Storage list, upload, and delete policies.
- Product image upload, replacement, removal, and preview in the staff product editor.
- Public storefront rendering with a CHICC placeholder when no image is set.
- Server-side content type, file signature, and size checks; uploads use unique object names to avoid overwrites.

## Apply and use

1. Install the dependencies at the repo root with `npm install` if not already installed.
2. Sign in and link the Supabase CLI to the intended project as documented in the [README](../README.md). Check the project reference before applying migrations.
3. Review pending migrations, then run `npx supabase@latest db push`. This applies all unapplied migrations, including `20261030040000_product_images.sql`.
4. Ensure both `.env.local` files use the same Supabase project URL and publishable key. No new secret is needed.
5. Start the staff app, sign in with an active staff or manager account, open **Manage catalog**, expand **Edit** for a product, choose a JPEG, PNG, or WebP file up to 5 MB, and save. To remove an existing image, select **Remove current image** and save.
6. Open the storefront to see the published product image. A product image is publicly accessible by its URL, like other public storefront assets.

The upload request is limited to 6 MB in the staff app to allow the 5 MB file plus multipart overhead. Both Next.js apps allow the Supabase public bucket URL as an image source. Local Supabase URLs are included for local development.

If saving the product succeeds but Storage cannot remove its previous image, the staff app shows a cleanup notice; the catalog row points at the new image (or none) and the obsolete object can be removed later by an authorized account. Deleting a product also tries to remove its image after deleting the catalog row.

The migration and app changes are local only. They do not apply changes to a Supabase project, create a paid service, buy a domain, or deploy either website.
