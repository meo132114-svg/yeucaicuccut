import type { TimelineEvent } from "./events";

/** Ngày tháng có thể bỏ trống — sắp xếp cũ nhất → mới nhất, thiếu tháng/ngày xếp trước trong cùng năm. */
export function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  if (a.year !== b.year) return a.year - b.year;
  const am = a.month ?? 0;
  const bm = b.month ?? 0;
  if (am !== bm) return am - bm;
  const ad = a.day ?? 0;
  const bd = b.day ?? 0;
  if (ad !== bd) return ad - bd;
  return a.title.localeCompare(b.title, "vi");
}

export function formatEventDate(year: number, month?: number | null, day?: number | null): string {
  if (month && day) return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  if (month) return `Tháng ${month}/${year}`;
  return `Năm ${year}`;
}
