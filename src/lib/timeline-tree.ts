/**
 * Tiện ích thuần cho cây thư mục Timeline — không phụ thuộc Supabase,
 * để unit test được độc lập với mạng.
 */
import type {
  AlbumPhoto,
  AlbumFitMode,
  AlbumFrameMode,
  TimelineAlbum,
  TimelineFolder,
  TimelinePost,
} from "./timeline-types";

export type {
  AlbumFitMode,
  AlbumFrameMode,
  AlbumPhoto,
  TimelineAlbum,
  TimelineFolder,
  TimelinePost,
};

export function sortFolders(list: TimelineFolder[]): TimelineFolder[] {
  return [...list].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name, "vi");
  });
}

/** Danh sách giai đoạn gốc, luôn theo thứ tự đã chọn trong quản trị. */
export function getRootTimelineStages(folders: TimelineFolder[]): TimelineFolder[] {
  return sortFolders(folders.filter((folder) => !folder.parent_id));
}

export function sortPosts(list: TimelinePost[]): TimelinePost[] {
  return [...list].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at) || a.title.localeCompare(b.title, "vi");
  });
}

/** Bản đồ con: key = parent_id (null = thư mục gốc). Danh sách đã sắp xếp. */
export function buildChildrenMap(folders: TimelineFolder[]): Map<string | null, TimelineFolder[]> {
  const map = new Map<string | null, TimelineFolder[]>();
  for (const folder of sortFolders(folders)) {
    const key = folder.parent_id;
    const arr = map.get(key);
    if (arr) arr.push(folder);
    else map.set(key, [folder]);
  }
  return map;
}

/** Chuỗi tổ tiên từ gốc đến chính thư mục đó (bao gồm cả self). Rỗng nếu không tìm thấy. */
export function getAncestorChain(folders: TimelineFolder[], id: string): TimelineFolder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const chain: TimelineFolder[] = [];
  let current = byId.get(id);
  let guard = 0;
  while (current && guard++ < 100) {
    chain.unshift(current);
    if (!current.parent_id) break;
    current = byId.get(current.parent_id);
  }
  return chain;
}

/** Giai đoạn gốc chứa một thư mục, bài viết hoặc album. */
export function getRootTimelineStageId(
  folders: TimelineFolder[],
  folderId: string | null,
): string | null {
  if (!folderId) return null;
  return getAncestorChain(folders, folderId).find((folder) => !folder.parent_id)?.id ?? null;
}

/** Tập id các thư mục con, cháu (không gồm chính nó). Chống vòng lặp parent. */
export function getDescendantIds(folders: TimelineFolder[], id: string): Set<string> {
  const children = buildChildrenMap(folders);
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop() as string;
    for (const child of children.get(current) ?? []) {
      if (out.has(child.id)) continue;
      out.add(child.id);
      stack.push(child.id);
    }
  }
  return out;
}

/** Thứ tự sắp cho mục mới: max hiện tại + 1. */
export function nextSortOrder(items: { sort_order: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
}
