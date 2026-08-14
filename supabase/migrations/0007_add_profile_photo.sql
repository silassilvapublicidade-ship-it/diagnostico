-- Best-effort profile photo fetched from the public Instagram page (og:image)
-- at diagnosis-creation time. Deliberately not part of analysis_assets: it is
-- never evidence sent to the AI, only a trust decoration shown on the report
-- page ("yes, this is really your profile"). Null whenever the fetch failed
-- (private account, blocked, timeout, etc.) -- the UI treats null as "no
-- photo to show", never an error.
alter table public.analysis_requests
  add column profile_photo_storage_path text,
  add column profile_photo_mime_type text;
