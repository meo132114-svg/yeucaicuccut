import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { albumsQueryOptions, foldersQueryOptions, postsQueryOptions } from "@/lib/timeline";
import { FolderTimeline, PostTimeline } from "@/components/timeline/TimelineWorkspace";
import { AlbumViewer } from "@/components/timeline/AlbumViewer";
import { TimelinePending } from "@/components/timeline/TimelinePending";

export const Route = createFileRoute("/hanh-trinh-30-nam/$nodeId")({
  head: () => ({
    meta: [
      { title: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        name: "description",
        content: "Thư mục và bài viết trong hành trình 30 năm thành lập Trường THPT Bà Điểm.",
      },
      { property: "og:title", content: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Thư mục và bài viết trong hành trình 30 năm thành lập Trường THPT Bà Điểm.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-destructive">
        {error instanceof Error ? error.message : "Không tải được dữ liệu."}
      </p>
    </div>
  ),
  pendingComponent: TimelinePending,
  notFoundComponent: () => (
    <div className="px-4 py-24 text-center text-muted-foreground">Không tìm thấy trang.</div>
  ),
  component: NodePage,
});

function NodePage() {
  const { nodeId } = Route.useParams();
  const { data: folders } = useSuspenseQuery(foldersQueryOptions);
  const { data: posts } = useSuspenseQuery(postsQueryOptions);
  const { data: albums } = useSuspenseQuery(albumsQueryOptions);

  const folder = folders.find((f) => f.id === nodeId);
  if (folder) return <FolderTimeline folders={folders} posts={posts} albums={albums} folder={folder} />;

  const post = posts.find((p) => p.id === nodeId);
  if (post) return <PostTimeline folders={folders} posts={posts} albums={albums} post={post} />;

  const album = albums.find((a) => a.id === nodeId);
  if (album) return <AlbumViewer folders={folders} posts={posts} albums={albums} album={album} />;

  return (
    <div className="px-4 py-24 text-center text-muted-foreground">
      <p>Không tìm thấy thư mục hoặc bài viết này.</p>
      <p className="mt-3">
        <Link
          to="/hanh-trinh-30-nam"
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Về trang Hành trình 30 năm
        </Link>
      </p>
    </div>
  );
}
