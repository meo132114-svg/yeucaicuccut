import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-3 text-left">
          <img
            src="/favicon.png"
            alt="Logo Trường THPT Bà Điểm"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">Trường THPT Bà Điểm</p>
            <p className="text-sm text-primary-foreground/75">Hành trình 30 năm — 1998 · 2026</p>
            <p className="mt-1 flex items-start justify-center gap-1.5 text-sm text-primary-foreground/75 md:justify-start">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              07 Nguyễn Thị Sóc, Ấp Bắc Lân, Xã Bà Điểm, Huyện Hóc Môn, TP.HCM
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/85">
          <Link to="/" className="transition-colors hover:text-accent">
            Trang chủ
          </Link>
          <Link to="/hanh-trinh-30-nam" className="transition-colors hover:text-accent">
            Hành trình 30 năm
          </Link>
          <Link to="/nguoi-gieo-mam" className="transition-colors hover:text-accent">
            Người gieo mầm
          </Link>
          <Link to="/auth" className="transition-colors hover:text-accent">
            Đăng nhập quản trị
          </Link>
        </nav>
      </div>
      <div className="border-t border-primary-foreground/15 py-3 text-center text-xs text-primary-foreground/60">
        © 2026 Trường THPT Bà Điểm — Chặng đường 30 năm xây dựng và trưởng thành.
      </div>
    </footer>
  );
}
