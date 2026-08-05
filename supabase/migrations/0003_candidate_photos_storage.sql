insert into storage.buckets (id, name, public)
values ('candidate-photos', 'candidate-photos', true)
on conflict (id) do update set public = excluded.public;

create policy candidate_photos_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'candidate-photos'
  and exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy candidate_photos_admin_update on storage.objects
for update to authenticated
using (
  bucket_id = 'candidate-photos'
  and exists (select 1 from public.admin_users where id = auth.uid() and active = true)
)
with check (
  bucket_id = 'candidate-photos'
  and exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy candidate_photos_admin_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'candidate-photos'
  and exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy candidate_photos_admin_select on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-photos'
  and exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);
