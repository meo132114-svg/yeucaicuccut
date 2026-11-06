import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  icon?: LucideIcon;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

/** Khung form nổi dùng chung cho form thư mục / bài viết. */
export function ModalShell({ title, icon: Icon, onClose, children, wide }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "my-8 w-full rounded-2xl border border-border bg-card shadow-xl",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}
