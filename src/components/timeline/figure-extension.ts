import { Node, mergeAttributes } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";

export type FigureAlign = "left" | "center" | "right";
export type FigureWidth = "sm" | "md" | "lg" | "full";
export type FigureFloat = "left" | "right" | null;

export type FigureAttrs = {
  src: string | null;
  alt: string | null;
  align: FigureAlign;
  width: FigureWidth;
  float: FigureFloat;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      /** Chèn khối ảnh (có chú thích) ngay tại vị trí con trỏ. */
      insertFigure: (attrs: { src: string; alt?: string | null }) => ReturnType;
      /** Cập nhật ảnh đang đặt con trỏ (thay ảnh, căn lề, kích thước, xuyên chữ...). */
      updateFigure: (attrs: Partial<FigureAttrs>) => ReturnType;
      /** Xóa ảnh đang đặt con trỏ. */
      removeFigure: () => ReturnType;
    };
  }
}

/**
 * Khối ảnh của bài viết: <figure data-timeline-figure><img/><figcaption>chú thích</figcaption></figure>
 * Căn lề / kích thước / xuyên chữ lưu bằng data-attribute để HTML lưu trong DB
 * hiển thị đúng cả khi không có editor.
 */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "inline*",
  defining: true,
  isolating: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      align: { default: "center" as FigureAlign },
      width: { default: "md" as FigureWidth },
      float: { default: null as FigureFloat },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-timeline-figure]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const img = el.querySelector("img");
          return {
            src: img?.getAttribute("src") ?? null,
            alt: img?.getAttribute("alt") ?? null,
            align: (el.getAttribute("data-align") as FigureAlign) || "center",
            width: (el.getAttribute("data-width") as FigureWidth) || "md",
            float: (el.getAttribute("data-float") as FigureFloat) || null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as FigureAttrs;
    return [
      "figure",
      mergeAttributes({
        "data-timeline-figure": "",
        "data-align": attrs.align,
        "data-width": attrs.width,
        ...(attrs.float ? { "data-float": attrs.float } : {}),
      }),
      ["img", { src: attrs.src ?? "", alt: attrs.alt ?? "" }],
      ["figcaption", {}, 0],
    ];
  },

  addCommands() {
    return {
      insertFigure:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.type.name,
              attrs: {
                src: attrs.src,
                alt: attrs.alt ?? null,
                align: "center",
                width: "md",
                float: null,
              },
            })
            .run(),
      updateFigure:
        (attrs) =>
        ({ state, tr, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 1; depth--) {
            const node = $from.node(depth);
            if (node.type.name === "figure") {
              if (dispatch) {
                tr.setNodeMarkup($from.before(depth), undefined, { ...node.attrs, ...attrs });
              }
              return true;
            }
          }
          return false;
        },
      removeFigure:
        () =>
        ({ state, tr, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 1; depth--) {
            const node = $from.node(depth);
            if (node.type.name === "figure") {
              if (dispatch) tr.delete($from.before(depth), $from.after(depth));
              return true;
            }
          }
          return false;
        },
    };
  },
});

/** Tìm figure đang chứa con trỏ (nếu có). */
export function findActiveFigure(editor: Editor): { pos: number; attrs: FigureAttrs } | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth >= 1; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "figure") {
      return { pos: $from.before(depth), attrs: node.attrs as FigureAttrs };
    }
  }
  return null;
}

/**
 * Đổi chỗ khối block cấp cao nhất đang chứa con trỏ với khối liền trên/dưới.
 * Dùng để sắp xếp lại thứ tự nội dung bài viết (đoạn văn, ảnh...).
 */
export function moveActiveBlock(editor: Editor, dir: -1 | 1): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  const index = $from.index(0);
  const swapIndex = index + dir;
  if (swapIndex < 0 || swapIndex >= state.doc.childCount) return false;

  const node = state.doc.child(index);
  const other = state.doc.child(swapIndex);
  if (!node || !other) return false;

  const startOf = (i: number) => {
    let pos = 0;
    for (let k = 0; k < i; k++) pos += state.doc.child(k).nodeSize;
    return pos;
  };

  const rangeStart = startOf(Math.min(index, swapIndex));
  const lastIndex = Math.max(index, swapIndex);
  const rangeEnd = startOf(lastIndex) + (state.doc.child(lastIndex)?.nodeSize ?? 0);

  const ordered =
    dir === -1 ? Fragment.fromArray([node, other]) : Fragment.fromArray([other, node]);
  editor.view.dispatch(state.tr.replaceWith(rangeStart, rangeEnd, ordered));
  return true;
}
