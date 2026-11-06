/** Một tấm ảnh bên trong album. */
export type AlbumPhoto = {
  id: string;
  url: string;
  title?: string;
  description?: string;
  sort_order: number;
};

export type AlbumFrameMode = "fixed" | "natural";
export type AlbumFitMode = "contain" | "cover";

export type TimelineAlbum = {
  id: string;
  folder_id: string | null;
  title: string;
  description: string;
  cover_image_url: string | null;
  photos: AlbumPhoto[];
  frame_mode: AlbumFrameMode;
  fit_mode: AlbumFitMode;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TimelineFolder = {
  id: string;
  parent_id: string | null;
  time_period?: string | null;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TimelinePost = {
  id: string;
  folder_id: string | null;
  title: string;
  author_name: string;
  description: string;
  content_html: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
