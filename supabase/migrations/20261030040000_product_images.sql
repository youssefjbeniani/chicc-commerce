-- Milestone 8: public product imagery in a restricted Supabase Storage bucket.

alter table public.products
  add column image_path text,
  add constraint products_image_path_shape check (
    image_path is null or (
      image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
      and split_part(image_path, '/', 1) = id::text
    )
  );

-- This public bucket is only for product catalog media. Public URLs are
-- intentionally readable by anyone; uploads and deletes remain role-gated.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chicc-product-images',
  'chicc-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "CHICC staff can list product image objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chicc-product-images'
    and (select public.has_chicc_role(array[
      'staff'::public.chicc_account_role,
      'manager'::public.chicc_account_role
    ]))
  );

create policy "CHICC staff can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chicc-product-images'
    and (select public.has_chicc_role(array[
      'staff'::public.chicc_account_role,
      'manager'::public.chicc_account_role
    ]))
  );

create policy "CHICC staff can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chicc-product-images'
    and (select public.has_chicc_role(array[
      'staff'::public.chicc_account_role,
      'manager'::public.chicc_account_role
    ]))
  );
