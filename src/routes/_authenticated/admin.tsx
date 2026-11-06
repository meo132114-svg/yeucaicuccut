import { createFileRoute, redirect } from "@tanstack/react-router";

/** Trang quản trị cũ đã gộp vào trang "Hành trình 30 năm" — giữ lại đường dẫn cũ và chuyển hướng. */
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/hanh-trinh-30-nam" });
  },
  component: () => null,
});
