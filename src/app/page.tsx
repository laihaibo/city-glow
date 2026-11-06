import Link from "next/link";
import {
  ChevronRight,
  Footprints,
  MapPinned,
  NotebookPen,
  Route,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";

/** 以下均为 Phase 1 视觉占位数据，Phase 2 起接入 localStorage 真实统计 */
const DEMO_STATS = [
  { label: "累计街巷", value: "128", unit: "条" },
  { label: "总里程", value: "86.4", unit: "km" },
  { label: "区域覆盖率", value: "42", unit: "%" },
  { label: "探索次数", value: "57", unit: "次" },
];

const QUICK_ENTRIES = [
  { href: "/map", title: "去地图划街巷", desc: "标注走过的路，点亮城区", icon: MapPinned },
  { href: "/diary", title: "写探索日记", desc: "见闻、心情、同行人", icon: NotebookPen },
  { href: "/plan", title: "本周末计划", desc: "自动串起 3-5 条待走街巷", icon: Route },
  { href: "/diary", title: "知识卡片", desc: "地名由来、文物古迹、商圈对比", icon: Sparkles },
];

const DEMO_RECENT_STREETS = ["文亭街", "美人巷", "彭城路", "少华街"];

export default function HomePage() {
  return (
    <div className="space-y-5">
      {/* 品牌英雄区 */}
      <GlassCard className="overflow-hidden bg-gradient-to-br from-primary/16 via-primary/6 to-transparent p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          徐州 · 周末亲子探索
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          点亮城市之光
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          从家门口出发，把走过的每条街划线点亮。走过几百条街巷，孩子自会发现认识一座城市的范式。
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/map"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Footprints className="size-4" aria-hidden />
            开始探索
          </Link>
          <Link
            href="/diary"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-4 text-sm font-semibold transition-transform active:scale-[0.98] dark:bg-white/10"
          >
            <NotebookPen className="size-4" aria-hidden />
            记一笔
          </Link>
        </div>
      </GlassCard>

      {/* 统计卡片 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">探索足迹</h2>
          <Badge variant="secondary" className="rounded-full text-xs">
            示例数据 · Phase 2 接入
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_STATS.map((stat) => (
            <GlassCard key={stat.label} className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight tabular-nums">
                {stat.value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {stat.unit}
                </span>
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 快速入口 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">快速开始</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ENTRIES.map(({ href, title, desc, icon: Icon }) => (
            <Link key={title} href={href} className="group">
              <GlassCard className="flex min-h-20 items-center gap-3 p-4 transition-transform group-active:scale-[0.98]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {desc}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-active:translate-x-0.5"
                  aria-hidden
                />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近点亮 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">最近点亮</h2>
        <GlassCard className="p-4">
          <ul className="divide-y divide-border/60">
            {DEMO_RECENT_STREETS.map((street, index) => (
              <li key={street} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-1/15 font-mono text-xs font-bold text-chart-1 tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{street}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  11 月 {4 + index * 3} 日
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
