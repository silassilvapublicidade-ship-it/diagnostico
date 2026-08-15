-- Rollback of the profile photo feature (both the live Instagram fetch and
-- the later screenshot-crop replacement): neither approach reliably showed
-- the real photo, and a wrong/mismatched photo hurt trust more than no
-- photo at all. Replaced by a plain clickable link to the real Instagram
-- profile, which needs no stored state at all.
alter table public.analysis_requests
  drop column profile_photo_storage_path,
  drop column profile_photo_mime_type;
