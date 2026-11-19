"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiaryTab, TabSkeleton } from "@/components/diary/diary-tab";
import { KnowledgeTab } from "@/components/diary/knowledge-tab";
import { PlanSection } from "@/components/plan/plan-section";
import { GlassCard } from "@/components/glass/glass-card";
import { useCityGlow } from "@/lib/hooks";
import type { Street } from "@/lib/types";
import { cn } from "cn";

const TAB_VALUES = ["streets", "plan", "diary", "knowledge"] as const;
type TabValue = (typeof TAB_VALUES)[number];

/**
 * 足迹页（左侧 tab）：历史足迹 / 计划 / 日记 / 知识卡片四段汇聚。
 * 支持 ?tab= 直达（旧 /diary /plan 链接跳转到这里）。
 */
export default function ArchivePage() {
  const [tab, setTab] = useState<TabValue>("streets");

  // 支持 ?tab= 直达（旧链接兼容）
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    if (param && (TAB_VALUES as readonly string[]).includes(param)) {
      setTab(param as TabValue);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">足迹</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          走过的路、定下的计划、写下的日记、攒下的见识，都在这里
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="glass grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="streets" className="rounded-xl">
            🛣️ 足迹
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-xl">
            🧭 计划
          </TabsTrigger>
          <TabsTrigger value="diary" className="rounded-xl">
            📝 日记
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-xl">
            🏷️ 卡片
          </TabsTrigger>
        </TabsList>
        <TabsContent value="streets" className="mt-4">
          <StreetsSection />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanSection />
        </TabsContent>
        <TabsContent value="diary" className="mt-4">
          <DiaryTab />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-4">
          <KnowledgeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** 足迹段：统计总览 + 按区域分组的全部街巷（含关键点路线） */
function StreetsSection() {
  const { ready, cityData } = useCityGlow();

  const streets = useMemo(() => cityData?.streets ?? [], [cityData]);

  const stats = useMemo(() => {
    const done = streets.filter((s) => s.status === "done");
    const regions = [...new Set(streets.map((s) => s.region))];
    const litRegions = new Set(done.map((s) => s.region));
    return {
      doneCount: done.length,
      totalKm: done.reduce((sum, s) => sum + s.lengthKm, 0),
      coverage: regions.length > 0 ? Math.round((litRegions.size / regions.length) * 100) : 0,
      explorations: cityData?.records.length ?? 0,
    };
  }, [streets, cityData]);

  const byRegion = useMemo(() => {
    const groups = new Map<string, Street[]>();
    for (const s of streets) {
      const list = groups.get(s.region) ?? [];
      list.push(s);
      groups.set(s.region, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [streets]);

  if (!ready || !cityData) {
    return <TabSkeleton text="正在点亮城市……" />;
  }

  return (
    <div className="space-y-4">
      {/* 统计总览 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "已走街巷", value: `${stats.doneCount}`, unit: "条" },
          { label: "总里程", value: stats.totalKm.toFixed(1), unit: "km" },
          { label: "覆盖率", value: `${stats.coverage}`, unit: "%" },
          { label: "探索次数", value: `${stats.explorations}`, unit: "次" },
        ].map(({ label, value, unit }) => (
          <GlassCard key={label} className="px-2 py-3 text-center">
            <p className="font-mono text-lg font-bold tabular-nums">
              {value}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* 按区域分组的街巷清单 */}
      {byRegion.length === 0 ? (
        <GlassCard className="border-dashed p-6 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            还没有街巷记录。回首页点「画街巷」标下第一条路，或先在设置页「载入宁波示例数据」看看效果。
          </p>
        </GlassCard>
      ) : (
        byRegion.map(([region, regionStreets]) => {
          const doneCount = regionStreets.filter((s) => s.status === "done").length;
          return (
            <GlassCard key={region} className="p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {region}
                <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                  {doneCount}/{regionStreets.length}
                </span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {regionStreets.map((s) => {
                  const namedWaypoints = (s.waypoints ?? []).filter((wp) => wp.name?.trim());
                  return (
                    <li
                      key={s.id}
                      className="flex min-h-11 items-center gap-2.5 rounded-2xl bg-muted/50 px-3 py-1.5"
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          s.status === "done" && "bg-chart-1",
                          s.status === "doing" && "bg-chart-3",
                          s.status === "todo" && "border border-border bg-background",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            s.status === "todo" && "text-muted-foreground",
                          )}
                        >
                          {s.name}
                        </span>
                        {namedWaypoints.length > 0 && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            🚩 {namedWaypoints.map((wp) => wp.name?.trim()).join(" → ")}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
                        {s.lengthKm} km
                        {s.lastWalkedAt && (
                          <span className="block">{s.lastWalkedAt.slice(5).replace("-", "/")}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          );
        })
      )}
    </div>
  );
}
