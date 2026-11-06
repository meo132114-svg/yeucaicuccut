CREATE TABLE public.timeline_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid REFERENCES public.timeline_folders(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  cover_image_url text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.timeline_albums TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.timeline_albums TO authenticated;
GRANT ALL ON public.timeline_albums TO service_role;

ALTER TABLE public.timeline_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view albums"
  ON public.timeline_albums FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage albums"
  ON public.timeline_albums FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_timeline_album_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER touch_timeline_albums_updated_at
  BEFORE UPDATE ON public.timeline_albums
  FOR EACH ROW EXECUTE FUNCTION public.touch_timeline_album_row();