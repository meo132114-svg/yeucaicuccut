import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Images, Loader2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadTimelineImage } from "@/lib/timeline";
import {
  nextSortOrder,
  type AlbumFitMode,
  type AlbumFrameMode,
  type AlbumPhoto,
  type TimelineAlbum,
} from "@/lib/timeline-tree";
import { ModalShell } from "./ModalShell";

type Props = {
  /** Thư mục chứa album (null = thư mục gốc). */
  folderId: string | null;
  editing: TimelineAlbum | null;
  /** Album cùng thư mục — dùng để tính thứ tự sắp xếp cho album mới. */
  siblings: TimelineAlbum[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

function imageHasNon16x9Aspect(source: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ratio = image.naturalWidth / image.naturalHeight;
      resolve(Math.abs(ratio - 16 / 9) / (16 / 9) > 0.05);
    };
    image.onerror = () => reject(new Error("Không đọc được kích thước ảnh."));
    image.src = source;
  });
}

/** Form tạo / sửa album ảnh — tải nhiều ảnh lên bucket "pictures" trong một lần chọn. */
export function AlbumForm({ folderId, editing, siblings, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [photos, setPhotos] = useState<AlbumPhoto[]>(
    editing ? [...editing.photos].sort((a, b) => a.sort_order - b.sort_order) : [],
  );
  const [frameMode, setFrameMode] = useState<AlbumFrameMode>(editing?.frame_mode ?? "fixed");
  const [fitMode, setFitMode] = useState<AlbumFitMode>(editing?.fit_mode ?? "contain");
  const [mismatchedPhotoIds, setMismatchedPhotoIds] = useState<Set<string>>(new Set());
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    Promise.all(
      editing.photos.map(async (photo) => ({
        id: photo.id,
        mismatch: await imageHasNon16x9Aspect(photo.url).catch(() => false),
      })),
    ).then((results) => {
      if (!cancelled) {
        setMismatchedPhotoIds(
          new Set(results.filter((result) => result.mismatch).map((result) => result.id)),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const updatePhoto = (id: string, patch: Partial<AlbumPhoto>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setMismatchedPhotoIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /** Tải toàn bộ ảnh được chọn lên Storage rồi thêm vào danh sách. */
  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: AlbumPhoto[] = [];
      const mismatchedIds: string[] = [];
      let order = photos.reduce((max, p) => Math.max(max, p.sort_order), 0);
      for (const file of files) {
        const objectUrl = URL.createObjectURL(file);
        let mismatch: boolean;
        try {
          mismatch = await imageHasNon16x9Aspect(objectUrl);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
        const url = await uploadTimelineImage(file, "albums");
        const id = crypto.randomUUID();
        uploaded.push({ id, url, sort_order: ++order });
        if (mismatch) mismatchedIds.push(id);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
      setMismatchedPhotoIds((prev) => new Set([...prev, ...mismatchedIds]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tên album.");
      return;
    }
    if (photos.length === 0) {
      setError("Album cần ít nhất một tấm ảnh.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Ảnh đại diện: ảnh vừa chọn > ảnh bìa cũ > ảnh đầu tiên trong album.
      const cover = coverFile
        ? await uploadTimelineImage(coverFile, "albums")
        : (editing?.cover_image_url ?? photos[0]?.url ?? null);

      const payload: {
        title: string;
        description: string;
        cover_image_url: string | null;
        photos: AlbumPhoto[];
        frame_mode: AlbumFrameMode;
        fit_mode: AlbumFitMode;
        folder_id: string | null;
        sort_order?: number;
      } = {
        title: title.trim(),
        description: description.trim(),
        cover_image_url: cover,
        photos: photos.map((p, i) => ({ ...p, sort_order: i })),
        frame_mode: frameMode,
        fit_mode: fitMode,
        folder_id: folderId,
      };

      if (editing) {
        const { error: dbError } = await supabase
          .from("timeline_albums")
          .update(payload)
          .eq("id", editing.id);
        if (dbError) throw dbError;
        onSaved("Đã cập nhật album ảnh.");
      } else {
        payload.sort_order = nextSortOrder(siblings);
        const { error: dbError } = await supabase.from("timeline_albums").insert(payload);
        if (dbError) throw dbError;
        onSaved("Đã tạo album ảnh mới.");
      }
      await queryClient.invalidateQueries({ queryKey: ["timeline_albums"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được album.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editing ? "Sửa album ảnh" : "Tạo album ảnh"}
      icon={Images}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div>
          <label className={labelClass} htmlFor="album-title">
            Tên album *
          </label>
          <input
            id="album-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Ngày đầu tiên nhập trường"
            className={inputClass}
          />
        </div>

        <div className="mt-4">
          <label className={labelClass} htmlFor="album-description">
            Mô tả ngắn
          </label>
          <textarea
            id="album-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về album (không bắt buộc)…"
            className={`${inputClass} resize-y`}
          />
        </div>

        <fieldset className="mt-5">
          <legend className={labelClass}>Kiểu khung ảnh</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
              <input
                type="radio"
                name="album-frame-mode"
                value="fixed"
                checked={frameMode === "fixed"}
                onChange={() => setFrameMode("fixed")}
              />
              Khung cố định (16:9)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
              <input
                type="radio"
                name="album-frame-mode"
                value="natural"
                checked={frameMode === "natural"}
                onChange={() => setFrameMode("natural")}
              />
              Khung tự do theo từng ảnh
            </label>
          </div>
        </fieldset>

        {frameMode === "fixed" && mismatchedPhotoIds.size > 0 && (
          <fieldset className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Một số ảnh không khớp tỷ lệ khung cố định. Vui lòng chọn cách hiển thị:
            </legend>
            <div className="mt-1 space-y-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="album-fit-mode"
                  value="contain"
                  checked={fitMode === "contain"}
                  onChange={() => setFitMode("contain")}
                  className="mt-0.5"
                />
                <span>Thu phóng ảnh để vừa khung (không bị cắt ảnh, hiển thị trọn vẹn)</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="album-fit-mode"
                  value="cover"
                  checked={fitMode === "cover"}
                  onChange={() => setFitMode("cover")}
                  className="mt-0.5"
                />
                <span>Crop ảnh cho vừa khung (phủ kín khung, có thể bị cắt bớt viền)</span>
              </label>
            </div>
          </fieldset>
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="album-photos">
            Ảnh trong album *
          </label>
          <label
            htmlFor="album-photos"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>
              {uploading ? "Đang tải ảnh lên…" : "Chọn nhiều ảnh cùng lúc để tải lên (JPG, PNG…)"}
            </span>
          </label>
          <input
            id="album-photos"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFiles}
            disabled={uploading}
          />
        </div>

        {photos.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="overflow-hidden rounded-xl border border-border bg-background"
              >
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.title || `Ảnh ${index + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Xóa ảnh ${index + 1} khỏi album`}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-white shadow-md transition-colors hover:bg-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 p-2.5">
                  <input
                    type="text"
                    value={photo.title ?? ""}
                    onChange={(e) => updatePhoto(photo.id, { title: e.target.value })}
                    placeholder="Tên ảnh (không bắt buộc)"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={photo.description ?? ""}
                    onChange={(e) => updatePhoto(photo.id, { description: e.target.value })}
                    placeholder="Mô tả ngắn của ảnh (không bắt buộc)"
                    className={inputClass}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {photos.length > 0 && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="album-cover">
              Ảnh đại diện album
            </label>
            <label
              htmlFor="album-cover"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
            >
              <Upload className="h-4 w-4" />
              <span className="truncate">
                {coverFile
                  ? coverFile.name
                  : "Chọn ảnh bìa riêng — bỏ trống sẽ lấy ảnh đầu tiên làm bìa"}
              </span>
            </label>
            <input
              id="album-cover"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Lưu thay đổi" : "Tạo album"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Hủy
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
