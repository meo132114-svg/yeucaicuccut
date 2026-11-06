import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadTimelineImage } from "@/lib/timeline";
import { getDescendantIds, nextSortOrder, type TimelineFolder } from "@/lib/timeline-tree";
import { Button } from "@/components/ui/button";
import { ModalShell } from "./ModalShell";

type Props = {
  folders: TimelineFolder[];
  /** Thư mục chứa thư mục mới (null = tạo ở thư mục gốc). */
  parent: TimelineFolder | null;
  editing: TimelineFolder | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/** Form tạo / sửa thư mục — cùng phong cách với form sự kiện cũ. */
export function FolderForm({ folders, parent, editing, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [timePeriod, setTimePeriod] = useState(editing?.time_period ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [parentId, setParentId] = useState<string>(
    editing ? (editing.parent_id ?? "") : (parent?.id ?? ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Không cho tự chuyển vào chính nó hoặc vào nhánh con của nó.
  const excluded = editing ? getDescendantIds(folders, editing.id) : new Set<string>();
  if (editing) excluded.add(editing.id);
  const parentOptions = folders.filter((f) => !excluded.has(f.id));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên thư mục.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targetParent = parentId || null;
      const payload: {
        name: string;
        description: string;
        parent_id: string | null;
        time_period: string | null;
        image_url?: string;
        sort_order?: number;
      } = {
        name: name.trim(),
        description: description.trim(),
        parent_id: targetParent,
        time_period: targetParent === null ? timePeriod.trim() || null : null,
      };
      if (file) payload.image_url = await uploadTimelineImage(file, "folders");

      if (editing) {
        const { error: dbError } = await supabase
          .from("timeline_folders")
          .update(payload)
          .eq("id", editing.id);
        if (dbError) throw dbError;
        onSaved("Đã cập nhật thư mục.");
      } else {
        const siblings = folders.filter((f) => (f.parent_id ?? null) === targetParent);
        payload.sort_order = nextSortOrder(siblings);
        const { error: dbError } = await supabase.from("timeline_folders").insert(payload);
        if (dbError) throw dbError;
        onSaved("Đã tạo thư mục mới.");
      }
      await queryClient.invalidateQueries({ queryKey: ["timeline_folders"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được thư mục.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editing ? "Sửa thư mục" : "Tạo thư mục"}
      icon={FolderPlus}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div>
          <label className={labelClass} htmlFor="folder-name">
            Tên thư mục *
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Giai đoạn 1996 – 2006"
            className={inputClass}
          />
        </div>

        {!parentId && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="folder-time-period">
              Mốc thời gian giai đoạn
            </label>
            <input
              id="folder-time-period"
              type="text"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              placeholder="Ví dụ: 1995 – 2005 hoặc Tháng 9/1995"
              className={inputClass}
            />
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="folder-description">
            Mô tả ngắn
          </label>
          <textarea
            id="folder-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về nội dung thư mục (không bắt buộc)…"
            className={`${inputClass} resize-y`}
          />
        </div>

        {editing && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="folder-parent">
              Nằm trong thư mục
            </label>
            <select
              id="folder-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Thư mục gốc —</option>
              {parentOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="folder-image">
            Ảnh đại diện
          </label>
          <label
            htmlFor="folder-image"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
          >
            <Upload className="h-4 w-4" />
            <span className="truncate">
              {file ? file.name : "Chọn file ảnh để tải lên (JPG, PNG…)"}
            </span>
          </label>
          <input
            id="folder-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-full px-6 py-2.5 font-semibold"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Lưu thay đổi" : "Tạo thư mục"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full px-6 py-2.5"
          >
            Hủy
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
