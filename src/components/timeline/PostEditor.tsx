import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Replace,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Figure,
  findActiveFigure,
  moveActiveBlock,
  type FigureAttrs,
} from "./figure-extension";

type Props = {
  initialContent: string;
  uploadImage: (file: File) => Promise<string>;
  onChange: (html: string) => void;
};

const toolBtn =
  "flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35";
const toolBtnActive = "bg-secondary text-secondary-foreground";

export function PostEditor({ initialContent, uploadImage, onChange }: Props) {
  const htmlRef = useRef(initialContent);
  const [, forceRender] = useState(0);
  const insertInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [busyImage, setBusyImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "figure" ? "Chú thích ảnh (không bắt buộc)…" : "Viết nội dung bài…",
      }),
      Figure,
    ],
    content: initialContent,
    editorProps: { attributes: { class: "timeline-prose timeline-editor" } },
    onUpdate: ({ editor: ed }) => {
      htmlRef.current = ed.getHTML();
      onChange(htmlRef.current);
    },
  });

  // Render lại khi selection/trạng thái thay đổi để cập nhật trạng thái nút công cụ.
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceRender((n) => n + 1);
    editor.on("transaction", handler);
    return () => {
      editor.off("transaction", handler);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-input bg-background text-sm text-muted-foreground">
        Đang mở trình soạn thảo…
      </div>
    );
  }

  const chain = () => editor.chain().focus();
  const activeFigure = findActiveFigure(editor);

  const handleUpload = async (file: File, mode: "insert" | "replace") => {
    setBusyImage(true);
    try {
      const url = await uploadImage(file);
      if (mode === "insert") chain().insertFigure({ src: url }).run();
      else chain().updateFigure({ src: url }).run();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không tải được ảnh lên.");
    } finally {
      setBusyImage(false);
    }
  };

  const figureLabel = (attrs: FigureAttrs) => {
    const widthText =
      { sm: "nhỏ", md: "vừa", lg: "lớn", full: "tràn khung" }[attrs.width] ?? attrs.width;
    const floatText = attrs.float ? ` · xuyên chữ ${attrs.float === "left" ? "trái" : "phải"}` : "";
    return `Ảnh đang chọn: căn ${
      { left: "trái", center: "giữa", right: "phải" }[attrs.align]
    }, cỡ ${widthText}${floatText}`;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
        <button type="button" title="Hoàn tác" className={toolBtn} onClick={() => chain().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" title="Làm lại" className={toolBtn} onClick={() => chain().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button type="button" title="Chữ đậm" className={cn(toolBtn, editor.isActive("bold") && toolBtnActive)} onClick={() => chain().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Chữ nghiêng" className={cn(toolBtn, editor.isActive("italic") && toolBtnActive)} onClick={() => chain().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="Tiêu đề phụ" className={cn(toolBtn, editor.isActive("heading", { level: 2 }) && toolBtnActive)} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" title="Tiêu đề phụ nhỏ" className={cn(toolBtn, editor.isActive("heading", { level: 3 }) && toolBtnActive)} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button type="button" title="Danh sách gạch đầu dòng" className={cn(toolBtn, editor.isActive("bulletList") && toolBtnActive)} onClick={() => chain().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Danh sách đánh số" className={cn(toolBtn, editor.isActive("orderedList") && toolBtnActive)} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" title="Trích dẫn" className={cn(toolBtn, editor.isActive("blockquote") && toolBtnActive)} onClick={() => chain().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" title="Đường phân cách" className={toolBtn} onClick={() => chain().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button type="button" title="Căn trái" className={cn(toolBtn, editor.isActive({ textAlign: "left" }) && toolBtnActive)} onClick={() => chain().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" title="Căn giữa" className={cn(toolBtn, editor.isActive({ textAlign: "center" }) && toolBtnActive)} onClick={() => chain().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" title="Căn phải" className={cn(toolBtn, editor.isActive({ textAlign: "right" }) && toolBtnActive)} onClick={() => chain().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button type="button" title="Di chuyển khối lên trên" className={toolBtn} onClick={() => moveActiveBlock(editor, -1)}>
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" title="Di chuyển khối xuống dưới" className={toolBtn} onClick={() => moveActiveBlock(editor, 1)}>
          <ArrowDown className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button
          type="button"
          title="Chèn ảnh tại vị trí con trỏ"
          className={cn(toolBtn, "w-auto gap-1.5 px-2 text-xs font-medium")}
          onClick={() => insertInputRef.current?.click()}
          disabled={busyImage}
        >
          <ImagePlus className="h-4 w-4" />
          Chèn ảnh
        </button>
      </div>

      {/* Bảng điều khiển cho ảnh đang chọn */}
      {activeFigure && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2 text-xs text-secondary-foreground">
          <span className="font-medium">{figureLabel(activeFigure.attrs)}</span>
          <span className="h-4 w-px bg-border" aria-hidden />
          <button type="button" className={cn(toolBtn, activeFigure.attrs.align === "left" && toolBtnActive)} title="Ảnh căn trái" onClick={() => chain().updateFigure({ align: "left", float: null }).run()}>
            <AlignLeft className="h-4 w-4" />
          </button>
          <button type="button" className={cn(toolBtn, activeFigure.attrs.align === "center" && toolBtnActive)} title="Ảnh căn giữa" onClick={() => chain().updateFigure({ align: "center", float: null }).run()}>
            <AlignCenter className="h-4 w-4" />
          </button>
          <button type="button" className={cn(toolBtn, activeFigure.attrs.align === "right" && toolBtnActive)} title="Ảnh căn phải" onClick={() => chain().updateFigure({ align: "right", float: null }).run()}>
            <AlignRight className="h-4 w-4" />
          </button>
          <span className="h-4 w-px bg-border" aria-hidden />
          {(["sm", "md", "lg", "full"] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors hover:bg-muted",
                activeFigure.attrs.width === w && "bg-secondary text-secondary-foreground",
              )}
              onClick={() => chain().updateFigure({ width: w }).run()}
            >
              {{ sm: "Nhỏ", md: "Vừa", lg: "Lớn", full: "Tràn" }[w]}
            </button>
          ))}
          <span className="h-4 w-px bg-border" aria-hidden />
          <button type="button" className={cn("rounded-md px-2 py-1 font-medium hover:bg-muted", activeFigure.attrs.float === "left" && "bg-secondary text-secondary-foreground")} onClick={() => chain().updateFigure({ float: activeFigure.attrs.float === "left" ? null : "left" }).run()}>
            Xuyên chữ trái
          </button>
          <button type="button" className={cn("rounded-md px-2 py-1 font-medium hover:bg-muted", activeFigure.attrs.float === "right" && "bg-secondary text-secondary-foreground")} onClick={() => chain().updateFigure({ float: activeFigure.attrs.float === "right" ? null : "right" }).run()}>
            Xuyên chữ phải
          </button>
          <span className="h-4 w-px bg-border" aria-hidden />
          <button type="button" className={cn(toolBtn, "w-auto gap-1.5 px-2")} title="Thay ảnh khác" onClick={() => replaceInputRef.current?.click()} disabled={busyImage}>
            <Replace className="h-4 w-4" />
            Thay ảnh
          </button>
          <button type="button" className={cn(toolBtn, "text-destructive hover:bg-destructive/10")} title="Xóa ảnh này" onClick={() => chain().removeFigure().run()}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <input
        ref={insertInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleUpload(file, "insert");
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleUpload(file, "replace");
        }}
      />
    </div>
  );
}
