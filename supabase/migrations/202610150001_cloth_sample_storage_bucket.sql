-- Cloth-sample photos move out of orders.cloth_sample_image_url (inline base64)
-- into Supabase Storage. The bucket is public so photo URLs are stable and can be
-- cached by browsers and the Supabase CDN; object names are random UUIDs.
-- Uploads and deletes happen server-side with the service role key, so no
-- storage.objects policies are needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cloth-samples',
  'cloth-samples',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
