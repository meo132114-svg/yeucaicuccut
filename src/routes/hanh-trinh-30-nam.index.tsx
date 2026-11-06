import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TimelinePending } from "@/components/timeline/TimelinePending";
import { FolderTimeline } from "@/components/timeline/TimelineWorkspace";
import { albumsQueryOptions, foldersQueryOptions, postsQueryOptions } from "@/lib/timeline";

export const Route = createFileRoute("/hanh-trinh-30-nam/")({
  pendingComponent: TimelinePending,
  component: TimelineIndexPage,
  head: () => ({
    meta: [
      { title: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        name: "description",
        content: "Kho lưu trữ thư mục, bài viết và album ảnh kỷ niệm 30 năm Trường THPT Bà Điểm.",
      },
      { property: "og:title", content: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Kho lưu trữ thư mục, bài viết và album ảnh kỷ niệm 30 năm Trường THPT Bà Điểm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TimelineIndexPage() {
  const { data: folders } = useSuspenseQuery(foldersQueryOptions);
  const { data: posts } = useSuspenseQuery(postsQueryOptions);
  const { data: albums } = useSuspenseQuery(albumsQueryOptions);

  return <FolderTimeline folders={folders} posts={posts} albums={albums} folder={null} />;
}
