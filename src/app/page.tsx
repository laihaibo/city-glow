"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Footprints, MapPinned, NotebookPen, Route, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { TabSkeleton } from "@/components/diary/diary-tab";
import { useCityGlow } from "@/lib/hooks";

export default function HomePage() {
  const { ready, data } = useCityGlow();

  const stats = useMemo(() => {
    if (!data) return null;
    const done = data.streets.filter((s) => s.status === "done");
    const regions = [...new Set(data.streets.map((s) => s.region))];
    const litRegions = new Set(done.map((s) => s.region));
    return {
      doneCount: done.length,
      totalKm: done.reduce((sum, s) => sum + s.lengthKm, 0),
      coverage: regions.length > 0 ? Math.round((litRegions.size / regions.length) * 100) : 0,
      explorations: data.records.length,
      recent: [...done]
        .filter((s) => s.lastWalkedAt)
        .sort((a, b) => (b.lastWalkedAt ?? "").localeCompare(a.lastWalkedAt ?? ""))
        .slice(0, 5),
    };
  }, [data]);

  if (!ready || !data || !stats) {
    return <TabSkeleton text="正在点亮城市……" />;
  }

  const hasAnyData = data.streets.length > 0 || data.records.length > 0;

  return (
    <div className="space-y-5">
      {/* 品牌英雄区 */}
      <GlassCard className="overflow-hidden bg-gradient-to-br from-primary/16 via-primary/6 to-transparent p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {data.settings.cityName} · 周末亲子探索
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">点亮城市之光</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          从家门口出发，把走过的每条街划线点亮。走过几百条街巷，孩子自会发现认识一座城市的范式。
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/map"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Footprints className="size-4" aria-hidden />
            {stats.doneCount === 0 ? "开始探索" : "继续探索"}
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

      {/* 统计卡片（真实数据） */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">探索足迹</h2>
          {hasAnyData && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {data.settings.cityName}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "累计街巷", value: `${stats.doneCount}`, unit: "条" },
            { label: "总里程", value: stats.totalKm.toFixed(1), unit: "km" },
            { label: "区域覆盖率", value: `${stats.coverage}`, unit: "%" },
            { label: "探索次数", value: `${stats.explorations}`, unit: "次" },
          ].map(({ label, value, unit }) => (
            <GlassCard key={label} className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight tabular-nums">
                {value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 快速入口 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">快速开始</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { href: "/map", title: "去地图划街巷", desc: "标注走过的路，点亮城区", icon: MapPinned },
            { href: "/diary", title: "写探索日记", desc: "见闻、心情、同行人", icon: NotebookPen },
            { href: "/plan", title: "本周末计划", desc: "自动串起 3-5 条待走街巷", icon: Route },
            { href: "/diary?tab=knowledge", title: "知识卡片", desc: "地名由来、文物古迹、商圈对比", icon: Sparkles },
          ].map(({ href, title, desc, icon: Icon }) => (
            <Link key={title} href={href} className="group">
              <GlassCard className="flex min-h-20 items-center gap-3 p-4 transition-transform group-active:scale-[0.98]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{desc}</span>
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
        {stats.recent.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              还没有点亮任何街巷。去地图画下第一条，或先「载入宁波示例数据」看看效果（在「我的」页）。
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="p-4">
            <ul className="divide-y divide-border/60">
              {stats.recent.map((street, index) => (
                <li key={street.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-1/15 font-mono text-xs font-bold text-chart-1 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{street.name}</span>
                    <span className="block text-xs text-muted-foreground">{street.region}</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {street.lastWalkedAt?.slice(5).replace("-", "/")}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </section>
    </div>
  );
}
