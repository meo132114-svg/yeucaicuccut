import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";

function Crest({ isOverlay }: { isOverlay: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img
        src="/favicon.png"
        alt="Logo Trường THPT Bà Điểm"
        className="h-11 w-11 rounded-full object-cover shadow-sm"
      />
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display text-base font-bold tracking-wide",
            isOverlay ? "text-white" : "text-foreground",
          )}
        >
          THPT Bà Điểm
        </span>
        <span
          className={cn(
            "text-[11px] font-medium tracking-[0.18em] uppercase",
            isOverlay ? "text-white/75" : "text-muted-foreground",
          )}
        >
          Kỷ niệm 30 năm
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { session, ready } = useAuthState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isOverlay = isHome && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const linkClass = (to: string) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
      isOverlay
        ? pathname === to
          ? "bg-white/15 text-white"
          : "text-white/85 hover:bg-white/10 hover:text-white"
        : pathname === to
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header
      className={cn(
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-40 border-b transition-colors duration-300",
        isOverlay
          ? "border-transparent bg-transparent"
          : isHome
            ? "border-border bg-background/95 shadow-sm backdrop-blur-md"
            : "border-border bg-background",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Crest isOverlay={isOverlay} />
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className={linkClass("/")}>
            Trang chủ
          </Link>
          <Link to="/hanh-trinh-30-nam" className={linkClass("/hanh-trinh-30-nam")}>
            Hành trình 30 năm
          </Link>
          <Link to="/nguoi-gieo-mam" className={linkClass("/nguoi-gieo-mam")}>
            Người gieo mầm
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {ready && session ? (
            <button
              onClick={handleSignOut}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                isOverlay
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-border text-foreground hover:bg-muted",
              )}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <nav
        className={cn(
          "flex items-center gap-1 border-t px-4 py-2 md:hidden",
          isOverlay ? "border-white/20" : "border-border",
        )}
      >
        <Link to="/" className={linkClass("/")}>
          Trang chủ
        </Link>
        <Link to="/hanh-trinh-30-nam" className={linkClass("/hanh-trinh-30-nam")}>
          Hành trình 30 năm
        </Link>
        <Link to="/nguoi-gieo-mam" className={linkClass("/nguoi-gieo-mam")}>
          Người gieo mầm
        </Link>
        {session && null}
      </nav>
    </header>
  );
}
