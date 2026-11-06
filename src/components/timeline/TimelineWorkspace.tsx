import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  FolderOpen,
  FolderPlus,
  Images,
  Pencil,
  PencilLine,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/timeline";
import {
  getRootTimelineStages,
  getRootTimelineStageId,
  type TimelineAlbum,
  type TimelineFolder,
  type TimelinePost,
} from "@/lib/timeline-tree";
import { FolderSidebar } from "./FolderSidebar";
import { TimelineItems, type TimelineItem } from "./TimelineItems";
import { FolderForm } from "./FolderForm";
import { PostForm } from "./PostForm";
import { AlbumForm } from "./AlbumForm";

const noticeClass = "rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary";
const errorClass = "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive";
const adminButtonClass =
  "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";
const ghostButtonClass =
  "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted";

/** Xóa nội dung Timeline (chỉ admin — RLS chặn phần còn lại), kèm trạng thái đang xóa. */
function useDeleteTimeline() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (
    kind: "folder" | "post" | "album",
    node: TimelineFolder | TimelinePost | TimelineAlbum,
  ) => {
    const label = "name" in node ? node.name : node.title;
    const message =
      kind === "folder"
        ? `Xóa thư mục "${label}" cùng toàn bộ nội dung bên trong?`
        : kind === "album"
          ? `Xóa album ảnh "${label}"?`
          : `Xóa bài viết "${label}"?`;
    if (!window.confirm(message)) return;
    setDeletingId(node.id);
    setError(null);
    try {
      const table =
        kind === "folder"
          ? "timeline_folders"
          : kind === "post"
            ? "timeline_posts"
            : "timeline_albums";
      const { error: dbError } = await supabase.from(table).delete().eq("id", node.id);
      if (dbError) throw dbError;
      await queryClient.invalidateQueries({ queryKey: ["timeline_folders"] });
      await queryClient.invalidateQueries({ queryKey: ["timeline_posts"] });
      await queryClient.invalidateQueries({ queryKey: ["timeline_albums"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xóa được nội dung.");
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, error, setError, remove };
}

type Props = {
  folders: TimelineFolder[];
  posts: TimelinePost[];
  albums: TimelineAlbum[];
};

type FolderViewProps = Props & { folder: TimelineFolder | null };

/** Trang thư mục (folder = null là thư mục gốc): trục Timeline + nút tạo/sửa/xóa cho Admin. */
export function FolderTimeline({ folders, posts, albums, folder }: FolderViewProps) {
  const isAdmin = useIsAdmin();
  const isRoot = folder === null;
  const parentId = folder?.id ?? null;

  useEffect(() => {
    if (!isRoot) return;
    const hash = window.location.hash;
    const stageId = hash.startsWith("#stage-")
      ? hash.slice("#stage-".length)
      : new URLSearchParams(window.location.search).get("stage");
    if (!stageId) return;

    window.requestAnimationFrame(() => {
      document.getElementById(`stage-${stageId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [isRoot, folders]);

  const childFolders = folders.filter((f) => (f.parent_id ?? null) === parentId);
  const childPosts = posts.filter((p) => (p.folder_id ?? null) === parentId);
  const childAlbums = albums.filter((album) => (album.folder_id ?? null) === parentId);
  const items: TimelineItem[] = [
    ...childFolders.map((f) => ({ kind: "folder" as const, folder: f })),
    ...childPosts.map((p) => ({ kind: "post" as const, post: p })),
    ...childAlbums.map((album) => ({ kind: "album" as const, album })),
  ];

  const [folderModal, setFolderModal] = useState<{
    parent: TimelineFolder | null;
    editing: TimelineFolder | null;
  } | null>(null);
  const [postModal, setPostModal] = useState<{ editing: TimelinePost | null } | null>(null);
  const [albumModal, setAlbumModal] = useState<{ editing: TimelineAlbum | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { deletingId, error, setError, remove } = useDeleteTimeline();

  const header = isRoot ? null : (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground md:text-4xl">{folder.name}</h1>
      {folder.description && (
        <p className="mt-3 max-w-2xl text-muted-foreground">{folder.description}</p>
      )}
    </div>
  );

  const content = (
    <>
      {isRoot ? <TimelineIntro /> : null}
      {header}

      {isAdmin && (
        <div
          className={
            isRoot
              ? "mx-auto mt-10 flex max-w-6xl flex-wrap justify-center gap-3 px-4"
              : "mt-6 flex flex-wrap gap-3"
          }
        >
          <button
            type="button"
            className={adminButtonClass}
            onClick={() => setFolderModal({ parent: folder, editing: null })}
          >
            <FolderPlus className="h-4 w-4" />
            {isRoot ? "Tạo thư mục" : "Tạo thư mục con"}
          </button>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => setPostModal({ editing: null })}
          >
            <Plus className="h-4 w-4" />
            Tạo bài viết
          </button>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => setAlbumModal({ editing: null })}
          >
            <Images className="h-4 w-4" />
            Tạo album ảnh
          </button>
        </div>
      )}

      {error && <p className={`mt-4 ${errorClass}`}>{error}</p>}
      {notice && <p className={`mt-4 ${noticeClass}`}>{notice}</p>}

      {isRoot ? (
        <>
          <RootStageTimeline
            folders={folders}
            posts={posts}
            albums={albums}
            stages={getRootTimelineStages(folders)}
            isAdmin={isAdmin}
            deletingId={deletingId}
            onEdit={(stage) => setFolderModal({ parent: null, editing: stage })}
            onDelete={(stage) => remove("folder", stage)}
          />
          {(childPosts.length > 0 || childAlbums.length > 0) && (
            <section className="mx-auto mt-16 max-w-6xl px-4" aria-label="Nội dung khác">
              <h2 className="mb-8 font-display text-2xl font-bold text-foreground">
                Nội dung khác
              </h2>
              <TimelineItems
                items={[
                  ...childPosts.map((post) => ({ kind: "post" as const, post })),
                  ...childAlbums.map((album) => ({ kind: "album" as const, album })),
                ]}
                isAdmin={isAdmin}
                deletingId={deletingId}
                onEditPost={(post) => setPostModal({ editing: post })}
                onEditAlbum={(album) => setAlbumModal({ editing: album })}
                onDeletePost={(post) => remove("post", post)}
                onDeleteAlbum={(album) => remove("album", album)}
              />
            </section>
          )}
        </>
      ) : (
        <div className="mt-10">
          <TimelineItems
            items={items}
            isAdmin={isAdmin}
            deletingId={deletingId}
            onEditFolder={(f) => setFolderModal({ parent: null, editing: f })}
            onEditPost={(p) => setPostModal({ editing: p })}
            onEditAlbum={(album) => setAlbumModal({ editing: album })}
            onDeleteFolder={(f) => remove("folder", f)}
            onDeletePost={(p) => remove("post", p)}
            onDeleteAlbum={(album) => remove("album", album)}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="bg-background pb-20">
      {isRoot ? (
        content
      ) : (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <FolderSidebar
              folders={folders}
              posts={posts}
              albums={albums}
              activeId={folder.id}
              activeKind="folder"
            />
          </div>
          <div className="min-w-0">
            <div className="mb-6 lg:hidden">
              <FolderSidebar
                folders={folders}
                posts={posts}
                albums={albums}
                activeId={folder.id}
                activeKind="folder"
                mobile
              />
            </div>
            {content}
          </div>
        </div>
      )}

      {folderModal && (
        <FolderForm
          folders={folders}
          parent={folderModal.parent}
          editing={folderModal.editing}
          onClose={() => setFolderModal(null)}
          onSaved={(message: string) => {
            setNotice(message);
            setError(null);
          }}
        />
      )}
      {postModal && (
        <PostForm
          folderId={parentId}
          editing={postModal.editing}
          siblings={childPosts}
          onClose={() => setPostModal(null)}
          onSaved={(message: string) => {
            setNotice(message);
            setError(null);
          }}
        />
      )}
      {albumModal && (
        <AlbumForm
          folderId={parentId}
          editing={albumModal.editing}
          siblings={childAlbums}
          onClose={() => setAlbumModal(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

function TimelineIntro() {
  const scrollToTimeline = () => {
    document
      .getElementById("timeline-stages")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative flex h-[100dvh] min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
        Trường THPT Bà Điểm
      </p>
      <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold text-foreground sm:text-6xl md:text-7xl">
        HÀNH TRÌNH 30 NĂM
      </h1>
      <p className="mt-5 text-lg font-medium text-muted-foreground sm:text-xl">
        Trường THPT Bà Điểm (1995 – 2025)
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={scrollToTimeline}
        className="mt-14 h-auto flex-col gap-2 py-3 text-muted-foreground hover:text-foreground"
        aria-label="Cuộn xuống dòng thời gian"
      >
        <span className="text-sm">Khám phá hành trình</span>
        <ArrowDown
          className="h-5 w-5 animate-bounce motion-reduce:animate-none"
          aria-hidden="true"
        />
      </Button>
    </section>
  );
}

type StageTimelineProps = {
  folders: TimelineFolder[];
  posts: TimelinePost[];
  albums: TimelineAlbum[];
  stages: TimelineFolder[];
  isAdmin: boolean;
  deletingId: string | null;
  onEdit: (stage: TimelineFolder) => void;
  onDelete: (stage: TimelineFolder) => void;
};

function RootStageTimeline({
  folders,
  posts,
  albums,
  stages,
  isAdmin,
  deletingId,
  onEdit,
  onDelete,
}: StageTimelineProps) {
  const [expandedStageIds, setExpandedStageIds] = useState<Set<string>>(() => new Set());

  const toggleStage = (id: string) => {
    setExpandedStageIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section
      id="timeline-stages"
      className="scroll-mt-24 px-4 pt-16 md:pt-24"
      aria-label="Các giai đoạn"
    >
      {stages.length === 0 ? (
        <p className="mx-auto max-w-3xl py-12 text-center text-muted-foreground">
          Chưa có giai đoạn nào được đăng tải.
        </p>
      ) : (
        <div className="relative mx-auto max-w-6xl">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-border md:left-1/2 md:-translate-x-1/2" />
          <ol className="space-y-16 md:space-y-28">
            {stages.map((stage, index) => {
              const expanded = expandedStageIds.has(stage.id);
              const stagePosts = posts.filter((post) => post.folder_id === stage.id);
              const stageAlbums = albums.filter((album) => album.folder_id === stage.id);
              const stageFolders = folders.filter((folder) => folder.parent_id === stage.id);
              const contents: TimelineItem[] = [
                ...stageFolders.map((folder) => ({ kind: "folder" as const, folder })),
                ...stagePosts.map((post) => ({ kind: "post" as const, post })),
                ...stageAlbums.map((album) => ({ kind: "album" as const, album })),
              ];
              const imageOnLeft = index % 2 === 0;

              return (
                <li
                  id={`stage-${stage.id}`}
                  key={stage.id}
                  className="relative scroll-mt-28 pl-10 md:pl-0"
                >
                  <span className="absolute left-[9px] top-5 z-10 h-3 w-3 rounded-full border-2 border-accent bg-background md:left-1/2 md:-translate-x-1/2" />
                  <div className="grid items-start gap-6 md:grid-cols-2 md:gap-14">
                    <div className={imageOnLeft ? "md:order-1" : "md:order-2"}>
                      <div className="sticky top-28 self-start">
                        {stage.time_period && (
                          <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold tracking-wider text-primary md:text-base">
                            {stage.time_period}
                          </p>
                        )}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          viewport={{ once: false, amount: 0.3 }}
                          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted shadow-sm"
                        >
                          {stage.image_url ? (
                            <img
                              src={stage.image_url}
                              alt={stage.name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <FolderOpen className="h-12 w-12 opacity-50" aria-hidden="true" />
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </div>
                    <motion.article
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      viewport={{ once: false, amount: 0.25 }}
                      className={`rounded-lg border border-border bg-card p-5 shadow-sm md:p-7 ${imageOnLeft ? "md:order-2" : "md:order-1"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                            {stage.name}
                          </h2>
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Sửa ${stage.name}`}
                              title={`Sửa ${stage.name}`}
                              onClick={() => onEdit(stage)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Xóa ${stage.name}`}
                              title={`Xóa ${stage.name}`}
                              disabled={deletingId === stage.id}
                              onClick={() => onDelete(stage)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {!expanded ? (
                        <>
                          {stage.description && (
                            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
                              {stage.description}
                            </p>
                          )}
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => toggleStage(stage.id)}
                            className="mt-5 h-auto p-0 font-semibold"
                          >
                            Xem thêm <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <div className="mt-5">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                              Nội dung giai đoạn
                            </h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStage(stage.id)}
                              className="shrink-0"
                            >
                              Thu gọn ↑
                            </Button>
                          </div>
                          {contents.length ? (
                            <ul className="mt-3 flex w-full flex-col gap-3.5">
                              {contents.map((item) => (
                                <StageContentLink key={getTimelineItemId(item)} item={item} />
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-4 rounded-md bg-muted px-3 py-4 text-sm text-muted-foreground">
                              Giai đoạn này chưa có bài viết, album ảnh hoặc thư mục con.
                            </p>
                          )}
                        </div>
                      )}
                    </motion.article>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function getTimelineItemId(item: TimelineItem): string {
  if (item.kind === "folder") return item.folder.id;
  if (item.kind === "post") return item.post.id;
  return item.album.id;
}

function StageContentLink({ item }: { item: TimelineItem }) {
  const isFolder = item.kind === "folder";
  const isPost = item.kind === "post";
  const title = isFolder ? item.folder.name : isPost ? item.post.title : item.album.title;
  const imageUrl = isFolder
    ? item.folder.image_url
    : isPost
      ? item.post.image_url
      : (item.album.cover_image_url ?? item.album.photos[0]?.url ?? null);
  const kindLabel = isFolder ? "Thư mục" : isPost ? "Bài viết" : "Album ảnh";
  const description = isFolder
    ? item.folder.description
    : isPost
      ? item.post.description
      : item.album.description;
  const Icon = isFolder ? FolderOpen : isPost ? FileText : Images;

  return (
    <li>
      <Link
        to="/hanh-trinh-30-nam/$nodeId"
        params={{ nodeId: getTimelineItemId(item) }}
        className="group flex w-full min-w-0 items-center gap-3 rounded-md border border-border bg-background p-2 transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-sm bg-muted sm:h-16 sm:w-24">
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium text-muted-foreground">{kindLabel}</span>
          <span className="mt-1 block line-clamp-2 text-sm font-semibold text-foreground">
            {title}
          </span>
          {description && (
            <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

type PostViewProps = Props & { post: TimelinePost };

/** Trang đọc bài viết: nội dung Tiptap + thanh thư mục mẹ bên trái. */
export function PostTimeline({ folders, posts, albums, post }: PostViewProps) {
  const isAdmin = useIsAdmin();
  const stageId = getRootTimelineStageId(folders, post.folder_id);
  const [editingOpen, setEditingOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const siblings = posts.filter((p) => (p.folder_id ?? null) === (post.folder_id ?? null));

  return (
    <div className="bg-background pb-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[270px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <FolderSidebar
            folders={folders}
            posts={posts}
            albums={albums}
            activeId={post.id}
            activeKind="post"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-6 lg:hidden">
            <FolderSidebar
              folders={folders}
              posts={posts}
              albums={albums}
              activeId={post.id}
              activeKind="post"
              mobile
            />
          </div>

          {notice && <p className={`mb-4 ${noticeClass}`}>{notice}</p>}

          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-secondary-foreground uppercase">
              Bài viết
            </p>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-4xl">
              {post.title}
            </h1>
            {post.author_name && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Viết bởi {post.author_name}
              </p>
            )}
            {post.description && (
              <p className="mt-4 border-l-2 border-accent pl-3 text-sm text-muted-foreground italic">
                {post.description}
              </p>
            )}
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                loading="lazy"
                className="mt-6 aspect-video w-full rounded-xl object-cover"
              />
            )}

            {isAdmin && (
              <div className="mt-6">
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => setEditingOpen(true)}
                >
                  <PencilLine className="h-4 w-4" />
                  Sửa bài viết
                </button>
              </div>
            )}

            <div
              className="timeline-prose mt-6"
              dangerouslySetInnerHTML={{
                __html: post.content_html || "<p><em>Chưa có nội dung.</em></p>",
              }}
            />
          </article>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              to="/hanh-trinh-30-nam"
              hash={stageId ? `stage-${stageId}` : undefined}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              ← Về trang Hành trình 30 năm
            </Link>
          </p>
        </div>
      </div>

      {editingOpen && (
        <PostForm
          folderId={post.folder_id}
          editing={post}
          siblings={siblings}
          onClose={() => setEditingOpen(false)}
          onSaved={(message: string) => setNotice(message)}
        />
      )}
    </div>
  );
}
