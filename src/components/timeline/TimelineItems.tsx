import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ChevronRight,
  FolderOpen,
  ImageIcon,
  Images,
  Loader2,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import type { TimelineAlbum, TimelineFolder, TimelinePost } from "@/lib/timeline-tree";

export type TimelineItem =
  | { kind: "folder"; folder: TimelineFolder }
  | { kind: "post"; post: TimelinePost }
  | { kind: "album"; album: TimelineAlbum };

type Props = {
  items: TimelineItem[];
  isAdmin: boolean;
  onEditFolder?: (folder: TimelineFolder) => void;
  onDeleteFolder?: (folder: TimelineFolder) => void;
  onEditPost?: (post: TimelinePost) => void;
  onDeletePost?: (post: TimelinePost) => void;
  onEditAlbum?: (album: TimelineAlbum) => void;
  onDeleteAlbum?: (album: TimelineAlbum) => void;
  deletingId?: string | null;
};

/** Danh sách nội dung trình bày theo trục Timeline dọc — dùng cho trang gốc và trang thư mục. */
export function TimelineItems({
  items,
  isAdmin,
  onEditFolder,
  onDeleteFolder,
  onEditPost,
  onDeletePost,
  onEditAlbum,
  onDeleteAlbum,
  deletingId,
}: Props) {
  if (items.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">Chưa có nội dung nào tại đây.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute top-0 bottom-0 left-[26px] w-px bg-border md:left-[34px]" />
      <ol className="space-y-10 md:space-y-14">
        {items.map((item, index) => {
          const isFolder = item.kind === "folder";
          const isPost = item.kind === "post";
          const itemId = isFolder ? item.folder.id : isPost ? item.post.id : item.album.id;
          const itemTitle = isFolder ? item.folder.name : isPost ? item.post.title : item.album.title;
          const imageUrl = isFolder
            ? item.folder.image_url
            : isPost
              ? item.post.image_url
              : item.album.cover_image_url ?? item.album.photos[0]?.url ?? null;
          const description = isFolder
            ? item.folder.description
            : isPost
              ? item.post.description
              : item.album.description;

          return (
            <motion.li
              key={itemId}
              layout
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
              className="relative pl-14 md:pl-24"
            >
              <span className="absolute top-1 left-[19px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent bg-background md:left-[27px]">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>

              <article className="relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 md:p-5">
                {/* Lớp bấm mở toàn thẻ */}
                <Link
                  to="/hanh-trinh-30-nam/$nodeId"
                  params={{ nodeId: itemId }}
                  className="absolute inset-0 z-10 cursor-pointer rounded-2xl"
                  aria-label={
                    isFolder
                      ? `Mở thư mục ${item.folder.name}`
                      : isPost
                        ? `Mở bài viết ${item.post.title}`
                        : `Mở album ${item.album.title}`
                  }
                />

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={itemTitle}
                    loading="lazy"
                    className="aspect-video w-full rounded-xl object-cover"
                  />
                ) : isFolder ? (
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <FolderOpen className="h-10 w-10 opacity-50" />
                  </div>
                ) : null}

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <h2 className="min-w-0 font-display text-xl font-bold text-foreground md:text-2xl">
                        {itemTitle}
                      </h2>
                    </div>
                    {isPost && item.post.author_name && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {item.post.author_name}
                      </p>
                    )}
                  </div>
                  {isFolder && (
                    <span className="relative z-20 mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <ChevronRight className="h-7 w-7 stroke-[3]" aria-hidden />
                    </span>
                  )}
                </div>

                {description && (
                  <p className="mt-2 line-clamp-3 leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
                {isPost && !item.post.image_url && !item.post.description && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4 opacity-60" /> Nhấn để đọc bài viết
                  </p>
                )}
                {item.kind === "album" && !imageUrl && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Images className="h-4 w-4 opacity-60" /> {item.album.photos.length} ảnh
                  </p>
                )}
                {isAdmin && (
                  <div className="relative z-20 mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isFolder) onEditFolder?.(item.folder);
                        else if (isPost) onEditPost?.(item.post);
                        else onEditAlbum?.(item.album);
                      }}
                      aria-label={`Sửa ${itemTitle}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isFolder) onDeleteFolder?.(item.folder);
                        else if (isPost) onDeletePost?.(item.post);
                        else onDeleteAlbum?.(item.album);
                      }}
                      disabled={deletingId === itemId}
                      aria-label={`Xóa ${itemTitle}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-destructive/40 bg-card text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {deletingId === itemId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </article>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
