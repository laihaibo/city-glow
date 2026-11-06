"use client";

import { useMemo, useState } from "react";
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
import { TabSkeleton } from "@/components/diary/diary-tab";
import { useCityGlow } from "@/lib/hooks";
import { renderMarkdown } from "@/lib/markdown";
import type { KnowledgeCard, KnowledgeCategory } from "@/lib/types";
import { cn } from "cn";

const CATEGORIES: { value: KnowledgeCategory; label: string; emoji: string }[] = [
  { value: "story", label: "街巷故事", emoji: "📖" },
  { value: "district", label: "商圈对比", emoji: "🏙️" },
  { value: "geology", label: "地理变迁", emoji: "🌊" },
  { value: "zone", label: "分区认知", emoji: "🏭" },
  { value: "relic", label: "文物古迹", emoji: "🏺" },
  { value: "other", label: "其他", emoji: "✨" },
];

const CATEGORY_META = new Map(CATEGORIES.map((c) => [c.value, c]));

export function KnowledgeTab() {
  const { ready, data, updateKnowledge } = useCityGlow();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeCard | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("story");
  const [streetId, setStreetId] = useState("");
  const [content, setContent] = useState("");
  const [detail, setDetail] = useState<KnowledgeCard | null>(null);
  const [filter, setFilter] = useState<KnowledgeCategory | "all">("all");

  const streets = data?.streets ?? [];
  const knowledge = data?.knowledge ?? [];

  const filtered = useMemo(
    () => (filter === "all" ? knowledge : knowledge.filter((k) => k.category === filter)),
    [knowledge, filter],
  );

  function openNew() {
    setEditing(null);
    setTitle("");
    setCategory("story");
    setStreetId("");
    setContent("");
    setOpen(true);
  }

  function openEdit(c: KnowledgeCard) {
    setEditing(c);
    setTitle(c.title);
    setCategory(c.category);
    setStreetId(c.streetId ?? "");
    setContent(c.content);
    setOpen(true);
  }

  function handleSave() {
    if (!data || !title.trim()) return;
    const card: KnowledgeCard = {
      id: editing?.id ?? nanoid(10),
      streetId: streetId || undefined,
      title: title.trim(),
      content,
      category,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    const next = editing
      ? data.knowledge.map((c) => (c.id === card.id ? card : c))
      : [card, ...data.knowledge];
    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    updateKnowledge(next);
    setOpen(false);
  }

  function handleDelete(id: string) {
    if (!data) return;
    updateKnowledge(data.knowledge.filter((c) => c.id !== id));
  }

  if (!ready || !data) {
    return <TabSkeleton text="正在整理卡片盒……" />;
  }

  return (
    <div className="space-y-4">
      <Button onClick={openNew} className="h-10 w-full rounded-2xl">
        <Plus className="size-4" />
        新建知识卡片
      </Button>

      {/* 类别筛选 */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          全部 {knowledge.length}
        </FilterChip>
        {CATEGORIES.map(({ value, label, emoji }) => {
          const count = knowledge.filter((k) => k.category === value).length;
          return (
            <FilterChip key={value} active={filter === value} onClick={() => setFilter(value)}>
              {emoji} {label} {count > 0 && count}
            </FilterChip>
          );
        })}
      </div>

      {/* 卡片列表 */}
      {filtered.length === 0 ? (
        <GlassCard className="border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {knowledge.length === 0
              ? "还没有知识卡片。走过一条老街，把它的故事记下来。"
              : "这个类别下还没有卡片。"}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((card) => {
            const meta = CATEGORY_META.get(card.category);
            const streetName = streets.find((s) => s.id === card.streetId)?.name;
            return (
              <GlassCard key={card.id} className="p-4">
                <button
                  type="button"
                  onClick={() => setDetail(card)}
                  className="w-full text-left"
                  aria-label={`查看 ${card.title}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-full px-2.5 text-xs font-normal">
                      {meta?.emoji} {meta?.label}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {card.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{card.title}</p>
                  <div
                    className="md-body mt-1.5 line-clamp-3 text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(card.content, { compact: true }),
                    }}
                  />
                  {streetName && (
                    <p className="mt-2 text-xs text-chart-1">📍 {streetName}</p>
                  )}
                </button>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label="编辑卡片"
                    onClick={() => openEdit(card)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="删除卡片"
                    onClick={() => handleDelete(card.id)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong max-h-[85dvh] max-w-sm overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑卡片" : "新建知识卡片"}</DialogTitle>
            <DialogDescription>
              地名由来、老店兴衰、文物古迹……走过的路变成见识
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="card-title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="card-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：天封塔为什么是 18 层地基"
                className="mt-1.5 rounded-2xl"
              />
            </div>
            <div>
              <p className="text-sm font-medium">类别</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      "min-h-8 rounded-full px-3 text-xs font-medium transition-colors",
                      category === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">关联街巷（可选）</p>
              <div className="mt-1.5 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setStreetId("")}
                  className={cn(
                    "min-h-8 rounded-full px-3 text-xs font-medium",
                    streetId === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  不关联
                </button>
                {streets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStreetId(s.id)}
                    className={cn(
                      "min-h-8 rounded-full px-3 text-xs font-medium",
                      streetId === s.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="card-content" className="text-sm font-medium">
                正文（Markdown）
              </label>
              <Textarea
                id="card-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="**唐天封塔** 始建于唐武后年间……&#10;- 要点一&#10;- 要点二"
                rows={6}
                className="mt-1.5 rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl">
              取消
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()} className="rounded-2xl">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情浮层 */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="glass-strong max-h-[80dvh] max-w-sm overflow-y-auto rounded-3xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.title}</DialogTitle>
                <DialogDescription>
                  {CATEGORY_META.get(detail.category)?.emoji}{" "}
                  {CATEGORY_META.get(detail.category)?.label} ·{" "}
                  {detail.createdAt.slice(0, 10)}
                  {detail.streetId &&
                    ` · 📍 ${streets.find((s) => s.id === detail.streetId)?.name ?? ""}`}
                </DialogDescription>
              </DialogHeader>
              <div
                className="md-body text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(detail.content) }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
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
