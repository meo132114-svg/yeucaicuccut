import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Loader2, PencilLine, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadTimelineImage } from "@/lib/timeline";
import { nextSortOrder, type TimelinePost } from "@/lib/timeline-tree";
import { PostEditor } from "./PostEditor";
import { ModalShell } from "./ModalShell";

type Props = {
  /** Thư mục chứa bài viết mới (null = thư mục gốc). */
  folderId: string | null;
  editing: TimelinePost | null;
  siblings: { sort_order: number }[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/**
 * Form tạo / sửa bài viết: phần thông tin thống nhất (tiêu đề, người viết, mô tả, ảnh bìa),
 * phần nội dung dùng trình soạn thảo Tiptap cho phép tự do bố cục và chèn ảnh xen kẽ.
 */
export function PostForm({ folderId, editing, siblings, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [author, setAuthor] = useState(editing?.author_name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const htmlRef = useRef<string>(editing?.content_html ?? "");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: {
        title: string;
        author_name: string;
        description: string;
        content_html: string;
        image_url?: string;
        folder_id?: string | null;
        sort_order?: number;
      } = {
        title: title.trim(),
        author_name: author.trim(),
        description: description.trim(),
        content_html: htmlRef.current || "<p></p>",
      };
      if (file) payload.image_url = await uploadTimelineImage(file, "posts");

      if (editing) {
        const { error: dbError } = await supabase
          .from("timeline_posts")
          .update(payload)
          .eq("id", editing.id);
        if (dbError) throw dbError;
        onSaved("Đã cập nhật bài viết.");
      } else {
        payload.folder_id = folderId;
        payload.sort_order = nextSortOrder(siblings);
        const { error: dbError } = await supabase.from("timeline_posts").insert(payload);
        if (dbError) throw dbError;
        onSaved("Đã tạo bài viết mới.");
      }
      await queryClient.invalidateQueries({ queryKey: ["timeline_posts"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bài viết.");
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = (
    <article>
      <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-secondary-foreground uppercase">
        <FileText className="h-3 w-3" /> Bài viết
      </p>
      <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
      {author.trim() && (
        <p className="mt-1 text-sm text-muted-foreground">Viết bởi {author.trim()}</p>
      )}
      {description.trim() && (
        <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-muted-foreground italic">
          {description.trim()}
        </p>
      )}
      {file ? (
        <img
          src={URL.createObjectURL(file)}
          alt="Ảnh bìa"
          className="mt-5 aspect-video w-full rounded-xl object-cover"
        />
      ) : editing?.image_url ? (
        <img
          src={editing.image_url}
          alt={title}
          className="mt-5 aspect-video w-full rounded-xl object-cover"
        />
      ) : null}
      <div
        className="timeline-prose mt-6"
        dangerouslySetInnerHTML={{ __html: htmlRef.current || "<p>Chưa có nội dung.</p>" }}
      />
    </article>
  );

  return (
    <ModalShell
      title={editing ? "Sửa bài viết" : "Tạo bài viết mới"}
      icon={PencilLine}
      onClose={onClose}
      wide
    >
      {preview ? (
        <div className="rounded-xl border border-border bg-background p-5 md:p-7">{previewHtml}</div>
      ) : (
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="post-title">
                Tiêu đề bài viết *
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ngày đầu tiên khai giảng khóa 1996"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="post-author">
                Tên người viết
              </label>
              <input
                id="post-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Không bắt buộc"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass} htmlFor="post-description">
              Mô tả ngắn
            </label>
            <textarea
              id="post-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Một vài dòng tóm tắt, hiện ở danh sách (không bắt buộc)…"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="mt-4">
            <label className={labelClass} htmlFor="post-cover">
              Ảnh bìa
            </label>
            <label
              htmlFor="post-cover"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
            >
              <Upload className="h-4 w-4" />
              <span className="truncate">
                {file ? file.name : "Chọn ảnh bìa cho bài viết (không bắt buộc)"}
              </span>
            </label>
            <input
              ref={imageInputRef}
              id="post-cover"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="mt-4">
            <p className={`${labelClass}`}>Nội dung bài viết</p>
            <PostEditor
              initialContent={editing?.content_html ?? ""}
              uploadImage={(f) => uploadTimelineImage(f, "posts")}
              onChange={(html) => {
                htmlRef.current = html;
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Bôi đen / đặt con trỏ vào ảnh để căn lề, đổi cỡ, xuyên chữ, thay hoặc xóa ảnh. Dùng
              nút mũi tên để đổi thứ tự khối nội dung.
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || preview}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Lưu thay đổi" : "Lưu bài viết"}
        </button>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Eye className="h-4 w-4" />
          {preview ? "Quay lại soạn thảo" : "Xem trước"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Hủy
        </button>
      </div>
    </ModalShell>
  );
}
