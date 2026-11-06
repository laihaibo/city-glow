import type { Metadata } from "next";
import { NotebookPen, PenLine } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "探索日记" };

/** 年度回顾条：Phase 3 起按真实日记数据统计 */
const DEMO_YEAR_REVIEW = [
  { label: "走过街巷", value: "36" },
  { label: "写下日记", value: "21" },
  { label: "点亮新区域", value: "3" },
];

/** 占位日记条目，结构对齐 Phase 3 的 records 数据模型 */
const DEMO_ENTRIES = [
  {
    date: "11月2日 · 周日",
    mood: "😄",
    companions: ["爸爸", "女儿"],
    streets: ["文亭街", "美人巷"],
    excerpt: "女儿在美人巷口数了数青砖墙上的拴马石，猜为什么叫\"美人巷\"——原来和乾隆年间的传说有关……",
  },
  {
    date: "10月26日 · 周日",
    mood: "🤩",
    companions: ["妈妈", "女儿", "朋友"],
    streets: ["彭城路"],
    excerpt: "老城商业街的招牌和开发区完全不一样，手写的字号有烟火气。数了数摊贩密度，比上周去的东区多了三倍……",
  },
  {
    date: "10月19日 · 周日",
    mood: "🌤️",
    companions: ["爸爸"],
    streets: ["少华街"],
    excerpt: "雨后走老街，青石板路反光。讨论了黄泛区为什么老城的房子地基一层层抬高……",
  },
];

export default function DiaryPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">探索日记</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            每次出走都值得记下，时间线会攒成孩子的成长档案
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full text-xs">
          Phase 3 接入
        </Badge>
      </div>

      {/* 年度回顾条 */}
      <GlassCard className="bg-gradient-to-br from-chart-3/14 to-transparent p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">2026 年度回顾</p>
          <NotebookPen className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-border/60">
          {DEMO_YEAR_REVIEW.map(({ label, value }) => (
            <div key={label} className="px-2 text-center first:pl-0 last:pr-0">
              <p className="font-mono text-xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 时间线（按月归档占位） */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">11 月</h2>
        <ol className="relative space-y-3 pl-5 before:absolute before:inset-y-1 before:left-[7px] before:w-px before:bg-border">
          {DEMO_ENTRIES.map((entry) => (
            <li key={entry.date} className="relative">
              <span
                className="absolute top-5 -left-5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary/70"
                aria-hidden
              />
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {entry.date}
                  </p>
                  <span className="text-lg" aria-label="心情">
                    {entry.mood}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.companions.map((person) => (
                    <Badge
                      key={person}
                      variant="secondary"
                      className="rounded-full px-2.5 text-xs font-normal"
                    >
                      {person}
                    </Badge>
                  ))}
                  {entry.streets.map((street) => (
                    <Badge
                      key={street}
                      className="rounded-full bg-chart-1/15 px-2.5 text-xs font-normal text-chart-1"
                    >
                      {street}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {entry.excerpt}
                </p>
              </GlassCard>
            </li>
          ))}
        </ol>
      </div>

      {/* 写日记入口占位 */}
      <button
        type="button"
        disabled
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground"
      >
        <PenLine className="size-4" aria-hidden />
        写一篇新日记（Phase 3 开放）
      </button>
    </div>
  );
}
