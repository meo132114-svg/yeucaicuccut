import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FolderTree, PencilLine } from "lucide-react";
import { useIsAdmin } from "@/lib/timeline";
import {
  getRootTimelineStageId,
  type TimelineAlbum,
  type TimelineFolder,
  type TimelinePost,
} from "@/lib/timeline-tree";
import { FolderSidebar } from "./FolderSidebar";
import { AlbumForm } from "./AlbumForm";

const ghostButtonClass =
  "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted";

type Props = {
  folders: TimelineFolder[];
  posts: TimelinePost[];
  albums: TimelineAlbum[];
  album: TimelineAlbum;
};

/** Trang xem album với một ảnh lớn và điều hướng ngay trong nội dung. */
export function AlbumViewer({ folders, posts, albums, album }: Props) {
  const photos = [...album.photos].sort((a, b) => a.sort_order - b.sort_order);
  const [current, setCurrent] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingOpen, setEditingOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const siblings = albums.filter((item) => (item.folder_id ?? null) === (album.folder_id ?? null));
  const stageId = getRootTimelineStageId(folders, album.folder_id);

  const prev = () => setCurrent((index) => (index - 1 + photos.length) % photos.length);
  const next = () => setCurrent((index) => (index + 1) % photos.length);

  useEffect(() => {
    if (editingOpen || photos.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrent((index) => (index - 1 + photos.length) % photos.length);
      else if (e.key === "ArrowRight") setCurrent((index) => (index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingOpen, photos.length]);

  const photoIndex = photos.length ? current % photos.length : 0;
  const photo = photos[photoIndex];
  const hasPhotoText = Boolean(photo?.title?.trim() || photo?.description?.trim());

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const distanceX = touch.clientX - start.x;
    const distanceY = touch.clientY - start.y;

    if (start.x <= 32 && distanceX > 70) {
      setTreeOpen(true);
      return;
    }
    if (treeOpen && distanceX < -70) {
      setTreeOpen(false);
      return;
    }
    const target = event.target;
    const onImage = target instanceof Element && target.closest("[data-album-stage]");
    if (onImage && Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX < 0) next();
      else prev();
    }
  };

  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target === event.currentTarget || (target instanceof Element && target.matches("main"))) {
      setTreeOpen(true);
    }
  };

  return (
    <div
      className="min-h-[calc(100dvh-5rem)] flex flex-col justify-between bg-background text-foreground px-2 sm:px-6 md:px-8 py-2 sm:py-4 select-none"
      onClick={handleBackgroundClick}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Link
          to="/hanh-trinh-30-nam"
          hash={stageId ? `stage-${stageId}` : undefined}
          className={ghostButtonClass}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Về Hành trình 30 năm</span>
          <span className="sm:hidden">Quay lại</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${ghostButtonClass} px-3 sm:px-4`}
            aria-label="Mở sơ đồ cây"
            title="Mở sơ đồ cây"
            onClick={() => setTreeOpen(true)}
          >
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Sơ đồ cây</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`${ghostButtonClass} px-3 sm:px-5`}
              onClick={() => setEditingOpen(true)}
            >
              <PencilLine className="h-4 w-4" />
              <span className="hidden sm:inline">Sửa album</span>
            </button>
          )}
        </div>
      </div>

      <header className="mx-auto w-full max-w-5xl shrink-0 px-2 py-2 text-center sm:py-3">
        <h1 className="font-display text-lg font-bold text-foreground sm:text-2xl">
          {album.title}
        </h1>
        {album.description && (
          <p className="mx-auto mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
            {album.description}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mx-auto mt-3 w-fit rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary"
          >
            {notice}
          </p>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-2 sm:gap-4 sm:py-3">
        {photo ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center xl:max-w-6xl">
            {photos.length > 0 && (
              <div className="mb-3 flex w-full gap-1.5" aria-label="Chọn ảnh">
                {photos.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Xem ảnh ${index + 1}`}
                    aria-current={index === photoIndex ? "step" : undefined}
                    onClick={() => setCurrent(index)}
                    className={`h-1 min-w-0 flex-1 rounded-full transition-colors ${index <= photoIndex ? "bg-primary" : "bg-border"}`}
                  />
                ))}
              </div>
            )}

            <div
              data-album-stage
              className={`relative mx-auto h-[52vh] max-h-[min(75vh,calc(100dvh-12rem))] w-full overflow-hidden rounded-xl border border-border shadow-lg sm:h-[65vh] sm:rounded-2xl lg:h-[72vh] ${album.frame_mode === "fixed" && album.fit_mode === "cover" ? "bg-foreground" : "bg-muted"}`}
            >
              <img
                src={photo.url}
                alt={photo.title || `Ảnh ${photoIndex + 1}`}
                className={
                  album.frame_mode === "fixed" && album.fit_mode === "cover"
                    ? "h-full w-full object-cover"
                    : "mx-auto h-full w-full object-contain"
                }
              />
              {hasPhotoText && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-4 py-3 text-white sm:px-6 sm:py-4">
                  {photo.title && <h2 className="text-base font-semibold">{photo.title}</h2>}
                  {photo.description && (
                    <p className="mt-1 text-sm text-white/90">{photo.description}</p>
                  )}
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Ảnh trước"
                    onClick={prev}
                    className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-w-resize bg-transparent focus-visible:outline-2 focus-visible:outline-white"
                  />
                  <button
                    type="button"
                    aria-label="Ảnh sau"
                    onClick={next}
                    className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-e-resize bg-transparent focus-visible:outline-2 focus-visible:outline-white"
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Album chưa có ảnh.</p>
        )}

        {photos.length > 1 && (
          <div className="flex shrink-0 items-center justify-center gap-4 text-sm">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={prev}
            >
              Ảnh trước
            </button>
            <span aria-live="polite" className="min-w-16 text-center font-medium text-foreground">
              {photoIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={next}
            >
              Ảnh sau
            </button>
          </div>
        )}
      </main>

      {treeOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng sơ đồ cây"
            onClick={() => setTreeOpen(false)}
            className="fixed inset-0 z-50 cursor-default bg-foreground/30"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(88vw,340px)] overflow-y-auto border-r border-border bg-background p-4 text-foreground shadow-2xl">
            <FolderSidebar
              folders={folders}
              posts={posts}
              albums={albums}
              activeId={album.id}
              activeKind="album"
            />
          </aside>
        </>
      )}

      {editingOpen && (
        <AlbumForm
          folderId={album.folder_id}
          editing={album}
          siblings={siblings}
          onClose={() => setEditingOpen(false)}
          onSaved={(message) => setNotice(message)}
        />
      )}
    </div>
  );
}
