"use client";

import { useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCityGlow } from "@/lib/hooks";
import { renderMarkdown } from "@/lib/markdown";
import type { ExplorationRecord } from "@/lib/types";
import { cn } from "cn";

const MOODS = ["😄", "🤩", "😊", "🌤️", "😴", "🥱", "😢", "🤔"];
const COMPANION_PRESETS = ["爸爸", "妈妈", "女儿", "朋友"];
const PHOTO_MAX_BYTES = 600 * 1024;
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatDateCn(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${WEEKDAYS[d.getDay()]}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DiaryTab() {
  const { ready, data, updateRecords } = useCityGlow();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExplorationRecord | null>(null);
  const [fDate, setFDate] = useState(todayStr());
  const [fCompanions, setFCompanions] = useState<string[]>([]);
  const [fStreetIds, setFStreetIds] = useState<string[]>([]);
  const [fInsights, setFInsights] = useState("");
  const [fMood, setFMood] = useState("😄");
  const [fPhotos, setFPhotos] = useState<string[]>([]);
  const [customCompanion, setCustomCompanion] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const streets = data?.streets ?? [];
  const records = data?.records ?? [];

  const year = new Date().getFullYear().toString();
  const yearReview = useMemo(() => {
    const doneStreets = streets.filter(
      (s) => s.status === "done" && (s.lastWalkedAt ?? "").startsWith(year),
    );
    const regions = new Set(
      streets.filter((s) => s.status === "done").map((s) => s.region),
    );
    return {
      streets: doneStreets.length,
      records: records.filter((r) => r.date.startsWith(year)).length,
      regions: regions.size,
    };
  }, [streets, records, year]);

  const byMonth = useMemo(() => {
    const groups = new Map<string, ExplorationRecord[]>();
    for (const r of records) {
      const key = r.date.slice(0, 7);
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  const streetNameOf = (id: string) =>
    streets.find((s) => s.id === id)?.name ?? "（已删除的街巷）";

  function openNew() {
    setEditing(null);
    setFDate(todayStr());
    setFCompanions([]);
    setFStreetIds([]);
    setFInsights("");
    setFMood("😄");
    setFPhotos([]);
    setOpen(true);
  }

  function openEdit(r: ExplorationRecord) {
    setEditing(r);
    setFDate(r.date);
    setFCompanions(r.companions);
    setFStreetIds(r.streetIds);
    setFInsights(r.insights);
    setFMood(r.mood);
    setFPhotos(r.photos ?? []);
    setOpen(true);
  }

  function handleSave() {
    if (!data) return;
    const record: ExplorationRecord = {
      id: editing?.id ?? nanoid(10),
      date: fDate,
      companions: fCompanions,
      streetIds: fStreetIds,
      insights: fInsights,
      mood: fMood,
      photos: fPhotos.length > 0 ? fPhotos : undefined,
    };
    const next = editing
      ? data.records.map((r) => (r.id === record.id ? record : r))
      : [record, ...data.records];
    next.sort((a, b) => b.date.localeCompare(a.date));
    updateRecords(next);
    setOpen(false);
  }

  function handleDelete(id: string) {
    if (!data) return;
    updateRecords(data.records.filter((r) => r.id !== id));
  }

  function handlePhotoFile(file: File) {
    if (file.size > PHOTO_MAX_BYTES) {
      alert(
        `照片约 ${Math.round(file.size / 1024)}KB，超过 ${Math.round(
          PHOTO_MAX_BYTES / 1024,
        )}KB 上限。先在相册里裁剪或压缩一下再添加吧。`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFPhotos((prev) => [...prev, String(reader.result)]);
    };
    reader.readAsDataURL(file);
  }

  function toggleCompanion(name: string) {
    setFCompanions((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  function toggleStreet(id: string) {
    setFStreetIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  if (!ready || !data) {
    return <TabSkeleton text="正在翻开日记本……" />;
  }

  return (
    <div className="space-y-4">
      {/* 年度回顾条 */}
      <GlassCard className="bg-gradient-to-br from-chart-4/16 to-transparent p-4">
        <p className="text-sm font-semibold">{year} 年度回顾</p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-border/60">
          <ReviewStat label="走过街巷" value={yearReview.streets} />
          <ReviewStat label="写下日记" value={yearReview.records} />
          <ReviewStat label="点亮区域" value={yearReview.regions} />
        </div>
        <Button onClick={openNew} className="mt-4 h-10 w-full rounded-2xl">
          <Plus className="size-4" />
          写一篇新日记
        </Button>
      </GlassCard>

      {/* 时间线 */}
      {records.length === 0 ? (
        <EmptyHint text="还没有日记。从家门口的第一条街开始记录吧。" />
      ) : (
        byMonth.map(([month, entries]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-base font-semibold">{monthLabel(month)}</h2>
            <ol className="relative space-y-3 pl-5 before:absolute before:inset-y-1 before:left-[7px] before:w-px before:bg-border">
              {entries.map((r) => (
                <li key={r.id} className="relative">
                  <span
                    className="absolute top-5 -left-5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary/70"
                    aria-hidden
                  />
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatDateCn(r.date)}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="编辑日记"
                          onClick={() => openEdit(r)}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="删除日记"
                          onClick={() => handleDelete(r.id)}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-lg" aria-label="心情">
                        {r.mood}
                      </span>
                      {r.companions.map((c) => (
                        <Badge key={c} variant="secondary" className="rounded-full px-2.5 text-xs font-normal">
                          {c}
                        </Badge>
                      ))}
                      {r.streetIds.map((id) => (
                        <Badge
                          key={id}
                          className="rounded-full bg-chart-1/15 px-2.5 text-xs font-normal text-chart-1"
                        >
                          {streetNameOf(id)}
                        </Badge>
                      ))}
                    </div>
                    <div
                      className="md-body mt-2.5 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(r.insights, { compact: true }),
                      }}
                    />
                    {r.photos && r.photos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.photos.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={src}
                            alt={`日记照片 ${i + 1}`}
                            className="size-20 rounded-2xl border border-white/40 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </li>
              ))}
            </ol>
          </div>
        ))
      )}

      {/* 日记编辑对话框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong max-h-[85dvh] max-w-sm overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑日记" : "新日记"}</DialogTitle>
            <DialogDescription>见闻支持 Markdown：**加粗**、- 列表</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="record-date" className="text-sm font-medium">
                日期
              </label>
              <Input
                id="record-date"
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="mt-1.5 rounded-2xl"
              />
            </div>

            <div>
              <p className="text-sm font-medium">同行人</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {COMPANION_PRESETS.map((c) => (
                  <Chip key={c} active={fCompanions.includes(c)} onClick={() => toggleCompanion(c)}>
                    {c}
                  </Chip>
                ))}
                {fCompanions
                  .filter((c) => !COMPANION_PRESETS.includes(c))
                  .map((c) => (
                    <Chip key={c} active onClick={() => toggleCompanion(c)}>
                      {c} ✕
                    </Chip>
                  ))}
              </div>
              <Input
                value={customCompanion}
                onChange={(e) => setCustomCompanion(e.target.value)}
                placeholder="自定义同行人，回车添加"
                className="mt-2 rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customCompanion.trim()) {
                    e.preventDefault();
                    toggleCompanion(customCompanion.trim());
                    setCustomCompanion("");
                  }
                }}
              />
            </div>

            <div>
              <p className="text-sm font-medium">本次走过的街巷</p>
              {streets.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  还没有街巷，先去地图上画几条吧
                </p>
              ) : (
                <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {streets.map((s) => (
                    <Chip
                      key={s.id}
                      active={fStreetIds.includes(s.id)}
                      onClick={() => toggleStreet(s.id)}
                    >
                      {s.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">心情</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-label={`心情 ${m}`}
                    onClick={() => setFMood(m)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-2xl text-xl transition-all",
                      fMood === m
                        ? "bg-primary/15 ring-2 ring-primary/60"
                        : "bg-muted/60 hover:bg-muted",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="record-insights" className="text-sm font-medium">
                见闻心得
              </label>
              <Textarea
                id="record-insights"
                value={fInsights}
                onChange={(e) => setFInsights(e.target.value)}
                placeholder="今天发现了什么？孩子问了什么问题？"
                rows={4}
                className="mt-1.5 rounded-2xl"
              />
            </div>

            <div>
              <p className="text-sm font-medium">照片（可选）</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                  e.target.value = "";
                }}
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {fPhotos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label="移除照片"
                    onClick={() => setFPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`待添加照片 ${i + 1}`}
                      className="size-16 rounded-2xl border border-white/40 object-cover"
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground"
                >
                  <Plus className="size-5" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                单张不超过 {Math.round(PHOTO_MAX_BYTES / 1024)}KB，存浏览器本地
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl">
              取消
            </Button>
            <Button onClick={handleSave} className="rounded-2xl">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- 小组件 ---------------- */

function ReviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 text-center">
      <p className="font-mono text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-8 rounded-full px-3 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <GlassCard className="border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </GlassCard>
  );
}

export function TabSkeleton({ text }: { text: string }) {
  return (
    <div className="glass flex h-[40dvh] items-center justify-center rounded-3xl">
      <p className="animate-pulse text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
