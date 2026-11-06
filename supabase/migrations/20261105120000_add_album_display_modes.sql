ALTER TABLE public.timeline_albums
  ADD COLUMN IF NOT EXISTS frame_mode text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS fit_mode text NOT NULL DEFAULT 'contain';