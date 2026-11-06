import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/lib/auth";

export type { AlbumPhoto, TimelineAlbum, TimelineFolder, TimelinePost } from "./timeline-types";

export const albumsQueryOptions = queryOptions({
  queryKey: ["timeline_albums"],
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("timeline_albums")
      .select(
        "id, folder_id, title, description, cover_image_url, photos, frame_mode, fit_mode, sort_order, created_at, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((a) => ({
      ...(a as import("./timeline-types").TimelineAlbum),
      photos: ((a.photos ?? []) as import("./timeline-types").AlbumPhoto[]).sort(
        (x, y) => x.sort_order - y.sort_order,
      ),
    }));
  },
});

export const foldersQueryOptions = queryOptions({
  queryKey: ["timeline_folders"],
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("timeline_folders")
      .select("id, parent_id, time_period, name, description, image_url, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as import("./timeline-types").TimelineFolder[];
  },
});

export const postsQueryOptions = queryOptions({
  queryKey: ["timeline_posts"],
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("timeline_posts")
      .select(
        "id, folder_id, title, author_name, description, content_html, image_url, sort_order, created_at, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as import("./timeline-types").TimelinePost[];
  },
});

/** Đúng khi tài khoản đăng nhập hiện tại có vai trò admin (kiểm tra qua bảng user_roles). */
export function useIsAdmin(): boolean {
  const { session } = useAuthState();
  const userId = session?.user.id ?? "";
  const query = useQuery({
    enabled: !!userId,
    queryKey: ["is_admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin");
    },
  });
  return !!query.data;
}

/** Tải ảnh lên bucket "pictures" và trả về URL công khai. */
export async function uploadTimelineImage(file: File, prefix: string): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${prefix}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("pictures").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("pictures").getPublicUrl(path);
  return data.publicUrl;
}
