/** 日期显示工具（全站共用） */

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** "2026-11-08" → "11月8日 · 周日" */
export function formatDateCn(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${WEEKDAYS[d.getDay()]}`;
}

/** "2026-11" → "2026 年 11 月" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

/** 今天 ISO 日期字符串 */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
