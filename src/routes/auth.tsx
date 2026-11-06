import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập quản trị — Trường THPT Bà Điểm" },
      {
        name: "description",
        content: "Đăng nhập quản trị viên trang kỷ niệm 30 năm Trường THPT Bà Điểm.",
      },
      { property: "og:title", content: "Đăng nhập quản trị — Trường THPT Bà Điểm" },
      {
        property: "og:description",
        content: "Đăng nhập quản trị viên trang kỷ niệm 30 năm Trường THPT Bà Điểm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(
            err.message === "Invalid login credentials"
              ? "Email hoặc mật khẩu không đúng."
              : err.message,
          );
          return;
        }
        navigate({ to: "/hanh-trinh-30-nam" });
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          navigate({ to: "/hanh-trinh-30-nam" });
        } else {
          setInfo(
            "Đã đăng ký. Hãy kiểm tra hộp email để xác nhận tài khoản trước khi đăng nhập.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="bg-secondary/50">
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:py-24">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-accent">
            <LockKeyhole className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-center font-display text-2xl font-bold text-foreground">
            {mode === "signin" ? "Đăng nhập quản trị" : "Đăng ký tài khoản"}
          </h1>

          <div className="mt-5 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`rounded-full py-2 transition-colors ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={inputClass}
            />
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{info}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Tài khoản đầu tiên đăng ký sẽ tự động là quản trị viên. Các tài khoản sau chỉ có quyền
            xem.
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
