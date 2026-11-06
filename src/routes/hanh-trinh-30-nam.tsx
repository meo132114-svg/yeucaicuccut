import { createFileRoute, Outlet } from "@tanstack/react-router";
import { albumsQueryOptions, foldersQueryOptions, postsQueryOptions } from "@/lib/timeline";
import { TimelinePending } from "@/components/timeline/TimelinePending";

export const Route = createFileRoute("/hanh-trinh-30-nam")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(foldersQueryOptions),
      context.queryClient.ensureQueryData(postsQueryOptions),
      context.queryClient.ensureQueryData(albumsQueryOptions),
    ]),
  head: () => ({
    meta: [
      { title: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        name: "description",
        content:
          "Chuyến tàu thời gian: kho lưu trữ ký ức 30 năm thành lập Trường THPT Bà Điểm theo thư mục và bài viết.",
      },
      { property: "og:title", content: "Hành trình 30 năm — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Kho lưu trữ ký ức 30 năm thành lập Trường THPT Bà Điểm theo thư mục và bài viết.",
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
  component: TimelineLayout,
});

function TimelineLayout() {
  return <Outlet />;
}
