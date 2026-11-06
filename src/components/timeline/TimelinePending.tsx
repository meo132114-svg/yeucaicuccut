import { LoaderCircle } from "lucide-react";

export function TimelinePending() {
  return (
    <div
      role="status"
      aria-label="Đang tải hành trình"
      className="flex min-h-64 items-center justify-center"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
