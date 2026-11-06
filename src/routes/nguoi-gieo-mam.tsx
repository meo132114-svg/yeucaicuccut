import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/nguoi-gieo-mam")({
  head: () => ({
    meta: [
      { title: "Người gieo mầm — Trường THPT Bà Điểm" },
      {
        name: "description",
        content: "Tri ân các thế hệ thầy cô — người gieo mầm của Trường THPT Bà Điểm. Nội dung sẽ sớm được cập nhật.",
      },
      { property: "og:title", content: "Người gieo mầm — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Tri ân các thế hệ thầy cô — người gieo mầm của Trường THPT Bà Điểm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NguoiGieoMam,
});

function NguoiGieoMam() {
  return (
    <div className="bg-secondary/50">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:py-32">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-accent">
          <Sprout className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-5xl">
          Người gieo mầm
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Trang tri ân các thế hệ thầy cô đang được chuẩn bị — nội dung sẽ sớm được cập nhật.
        </p>
        <Link
          to="/hanh-trinh-30-nam"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Xem hành trình 30 năm
        </Link>
      </div>
    </div>
  );
}
