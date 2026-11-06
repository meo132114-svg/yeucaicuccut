-- ============= Hệ thống nội dung dạng cây thư mục cho "Hành trình 30 năm" =============

-- 1) Bảng thư mục (cây không giới hạn cấp qua parent_id)
CREATE TABLE public.timeline_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES public.timeline_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Bảng bài viết (thuộc thư mục nào đó, hoặc để trống = nằm ở thư mục gốc)
CREATE TABLE public.timeline_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid REFERENCES public.timeline_folders(id) ON DELETE CASCADE,
  title text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  content_html text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Cấp quyền truy cập qua Data API
GRANT SELECT ON public.timeline_folders TO anon, authenticated;
GRANT SELECT ON public.timeline_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.timeline_folders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.timeline_posts TO authenticated;
GRANT ALL ON public.timeline_folders TO service_role;
GRANT ALL ON public.timeline_posts TO service_role;

-- 4) Bật Row Level Security
ALTER TABLE public.timeline_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_posts ENABLE ROW LEVEL SECURITY;

-- 5) Chính sách: ai cũng đọc được, chỉ admin ghi được
CREATE POLICY "Anyone can view folders"
  ON public.timeline_folders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage folders"
  ON public.timeline_folders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view posts"
  ON public.timeline_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage posts"
  ON public.timeline_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6) Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.touch_timeline_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_timeline_folders_updated_at
  BEFORE UPDATE ON public.timeline_folders
  FOR EACH ROW EXECUTE FUNCTION public.touch_timeline_row();

CREATE TRIGGER touch_timeline_posts_updated_at
  BEFORE UPDATE ON public.timeline_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_timeline_row();

-- 7) Sao chép 6 cột mốc hiện có thành bài viết ở thư mục gốc (giữ nguyên ảnh + mô tả)
INSERT INTO public.timeline_posts (title, author_name, description, content_html, image_url, sort_order, created_at, updated_at)
SELECT
  e.title,
  '',
  e.description,
  CASE
    WHEN e.image_url IS NOT NULL THEN
      '<p>' || replace(e.description, E'\n', '</p><p>') || '</p>'
      || '<img src="' || e.image_url || '" alt="" data-align="center" data-size="large">'
    ELSE
      '<p>' || replace(e.description, E'\n', '</p><p>') || '</p>'
  END,
  e.image_url,
  row_number() OVER (ORDER BY e.year, e.month NULLS LAST, e.day NULLS LAST),
  e.created_at,
  e.updated_at
FROM public.timeline_events e;
