import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, FileText, FolderOpen, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildChildrenMap,
  getAncestorChain,
  sortPosts,
  type TimelineAlbum,
  type TimelineFolder,
  type TimelinePost,
} from "@/lib/timeline-tree";

type Props = {
  folders: TimelineFolder[];
  posts: TimelinePost[];
  albums: TimelineAlbum[];
  activeId: string;
  activeKind: "folder" | "post" | "album";
  mobile?: boolean;
};

/**
 * Thanh điều hướng thư mục mẹ (cây thư mục bên trái):
 * đầy đủ đường dẫn cha, bấm được để quay lại, mở rộng/thu gọn nhánh,
 * đánh dấu thư mục/bài viết đang xem. Trên điện thoại thu thành menu gọn.
 */
export function FolderSidebar({ folders, posts, albums, activeId, activeKind, mobile }: Props) {
  const activeAlbumFolderId =
    activeKind === "album" ? albums.find((album) => album.id === activeId)?.folder_id : null;
  const chain =
    activeKind === "folder"
      ? getAncestorChain(folders, activeId)
      : activeAlbumFolderId
        ? getAncestorChain(folders, activeAlbumFolderId)
        : [];
  const chainIds = new Set(chain.map((f) => f.id));
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const f of chain) {
      initial.add(f.id);
      if (f.parent_id) initial.add(f.parent_id);
    }
    return initial;
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const childrenMap = buildChildrenMap(folders);
  const postsByFolder = new Map<string | null, TimelinePost[]>();
  for (const post of sortPosts(posts)) {
    const arr = postsByFolder.get(post.folder_id) ?? [];
    arr.push(post);
    postsByFolder.set(post.folder_id, arr);
  }
  const albumsByFolder = new Map<string | null, TimelineAlbum[]>();
  for (const album of albums) {
    const list = albumsByFolder.get(album.folder_id) ?? [];
    list.push(album);
    albumsByFolder.set(album.folder_id, list);
  }

  const rowClass = (active: boolean, highlight: boolean) =>
    cn(
      "min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
      active && "bg-secondary font-semibold text-secondary-foreground",
      !active && highlight && "font-medium text-foreground",
      !active && !highlight && "text-muted-foreground",
    );

  const renderFolder = (folder: TimelineFolder, depth: number): ReactNode => {
    const childFolders = childrenMap.get(folder.id) ?? [];
    const childPosts = postsByFolder.get(folder.id) ?? [];
    const childAlbums = albumsByFolder.get(folder.id) ?? [];
    const hasChildren = childFolders.length > 0 || childPosts.length > 0 || childAlbums.length > 0;
    const isOpen = expanded.has(folder.id) || chainIds.has(folder.id);
    const isActive = activeKind === "folder" && folder.id === activeId;

    return (
      <li key={folder.id}>
        <div className={cn("flex items-center", isActive && "rounded-lg")}>
          <button
            type="button"
            onClick={() => toggle(folder.id)}
            aria-label={isOpen ? `Thu gọn ${folder.name}` : `Mở rộng ${folder.name}`}
            className={cn(
              "flex h-7 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted",
              !hasChildren && "invisible",
            )}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          <Link
            to="/hanh-trinh-30-nam/$nodeId"
            params={{ nodeId: folder.id }}
            className={cn("flex items-center gap-1.5", rowClass(isActive, chainIds.has(folder.id)))}
          >
            <FolderOpen className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">{folder.name}</span>
          </Link>
        </div>
        {isOpen && hasChildren && (
          <ul className="ml-3 border-l border-border pl-1">
            {childFolders.map((f) => renderFolder(f, depth + 1))}
            {childPosts.map((p) => renderPost(p))}
            {childAlbums.map((album) => renderAlbum(album))}
          </ul>
        )}
      </li>
    );
  };

  const renderAlbum = (album: TimelineAlbum): ReactNode => {
    const isActive = activeKind === "album" && album.id === activeId;
    return (
      <li key={album.id}>
        <Link
          to="/hanh-trinh-30-nam/$nodeId"
          params={{ nodeId: album.id }}
          className={cn("flex items-center gap-1.5", rowClass(isActive, false))}
        >
          <Images className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{album.title}</span>
        </Link>
      </li>
    );
  };

  const renderPost = (post: TimelinePost): ReactNode => {
    const isActive = activeKind === "post" && post.id === activeId;
    return (
      <li key={post.id}>
        <Link
          to="/hanh-trinh-30-nam/$nodeId"
          params={{ nodeId: post.id }}
          className={cn("flex items-center gap-1.5", rowClass(isActive, false))}
        >
          <FileText className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{post.title}</span>
        </Link>
      </li>
    );
  };

  const tree = (
    <nav aria-label="Cây thư mục">
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Nhánh thư mục
      </p>
      <ul className="space-y-0.5">
        {(childrenMap.get(null) ?? []).map((f) => renderFolder(f, 0))}
        {(postsByFolder.get(null) ?? []).map((p) => renderPost(p))}
        {(albumsByFolder.get(null) ?? []).map((album) => renderAlbum(album))}
      </ul>
    </nav>
  );

  if (mobile) {
    return (
      <details className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <summary className="cursor-pointer select-none text-sm font-semibold text-foreground">
          Nội dung trong thư mục
        </summary>
        <div className="mt-3">{tree}</div>
      </details>
    );
  }

  return (
    <aside className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-sm">
      {tree}
    </aside>
  );
}
