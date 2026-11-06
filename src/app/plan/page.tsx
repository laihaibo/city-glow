"use client";

import { useMemo, useState } from "react";
import { Footprints, MapPin, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ReplaySection } from "@/components/plan/replay-section";
import { TabSkeleton } from "@/components/diary/diary-tab";
import { useCityGlow } from "@/lib/hooks";
import { planNearestRoute, walkMinutes, type RouteStop } from "@/lib/geo";
import type { Street, StreetDifficulty, StreetPriority } from "@/lib/types";
import { cn } from "cn";

const PRIORITY_LABEL: Record<StreetPriority, string> = {
  high: "高优先",
  medium: "中优先",
  low: "低优先",
};

const PRIORITY_STYLE: Record<StreetPriority, string> = {
  high: "bg-chart-1/15 text-chart-1",
  medium: "bg-chart-3/20 text-chart-3",
  low: "bg-muted text-muted-foreground",
};

const DIFFICULTY_LABEL: Record<StreetDifficulty, string> = {
  easy: "轻松",
  medium: "适中",
  hard: "挑战",
};

const PRIORITY_CYCLE: StreetPriority[] = ["high", "medium", "low"];

export default function PlanPage() {
  const { ready, data, updateStreets } = useCityGlow();
  const [route, setRoute] = useState<RouteStop[] | null>(null);
  const [noteEditing, setNoteEditing] = useState<Street | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const streets = useMemo(() => data?.streets ?? [], [data]);
  const todoStreets = useMemo(
    () => streets.filter((s) => s.status === "todo" || s.status === "doing"),
    [streets],
  );

  const byRegion = useMemo(() => {
    const groups = new Map<string, Street[]>();
    for (const s of todoStreets) {
      const list = groups.get(s.region) ?? [];
      list.push(s);
      groups.set(s.region, list);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [todoStreets]);

  /** 优先级循环切换：高 → 中 → 低 → 高 */
  function cyclePriority(street: Street) {
    if (!data) return;
    const next: StreetPriority =
      PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(street.priority ?? "medium") + 1) % 3];
    updateStreets(
      data.streets.map((s) =>
        s.id === street.id ? { ...s, priority: next } : s,
      ),
    );
  }

  function saveNote() {
    if (!data || !noteEditing) return;
    updateStreets(
      data.streets.map((s) =>
        s.id === noteEditing.id ? { ...s, notes: noteDraft || undefined } : s,
      ),
    );
    setNoteEditing(null);
  }

  /** 一键把路线上的街巷标为「在走」 */
  function startRoute() {
    if (!data || !route) return;
    const ids = new Set(route.map((stop) => stop.streetId));
    updateStreets(
      data.streets.map((s) =>
        ids.has(s.id) && s.status === "todo" ? { ...s, status: "doing" } : s,
      ),
    );
    setRoute(null);
  }

  if (!ready || !data) {
    return <TabSkeleton text="正在整理待走清单……" />;
  }

  const home = [data.settings.homeLocation.lat, data.settings.homeLocation.lng] as [number, number];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">路线与计划</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          待走街巷池 + 周末自动拼路线，让每个周末都有目的地
        </p>
      </div>

      {/* ---------- 周末路线生成 ---------- */}
      <GlassCard className="overflow-hidden bg-gradient-to-br from-chart-2/14 to-transparent p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden />
            本周末建议路线
          </p>
          {todoStreets.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs"
              onClick={() =>
                setRoute(planNearestRoute(home, todoStreets, 5))
              }
            >
              🎲 生成
            </Button>
          )}
        </div>

        {route ? (
          <>
            <ol className="mt-3 space-y-2.5">
              {route.map((stop, i) => (
                <li key={stop.streetId} className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold">{stop.name}</span>
                  {i > 0 && (
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      +{stop.legKm} km
                    </span>
                  )}
                </li>
                ))}
            </ol>
            {(() => {
              const totalKm = route.reduce((sum, s) => sum + s.legKm, 0);
              const minutes = walkMinutes(totalKm);
              return (
                <p className="mt-3 font-mono text-xs text-muted-foreground tabular-nums">
                  合计步行约 {totalKm.toFixed(1)} km · 约 {minutes} 分钟（4 km/h）
                </p>
              );
            })()}
            <div className="mt-3 flex gap-2">
              <Button onClick={startRoute} className="h-10 flex-1 rounded-2xl">
                <Footprints className="size-4" />
                就走这条线（标为在走）
              </Button>
              <Button variant="ghost" onClick={() => setRoute(null)} className="h-10 rounded-2xl">
                收起
                </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {todoStreets.length === 0
              ? "待走清单空空如也——去地图上把想走的街巷标成「待走」，再回来生成周末路线。"
              : `从家出发，自动串联 ${Math.min(5, todoStreets.length)} 条顺路的待走街巷。点「生成」试试。`}
          </p>
        )}
      </GlassCard>

      {/* ---------- 待走街巷池 ---------- */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          待走街巷池
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground tabular-nums">
            {todoStreets.length} 条
          </span>
        </h2>

        {byRegion.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              没有待走街巷。在地图「勾选区域」里把走过的打勾，或画新街巷时选「待走」状态。
            </p>
          </GlassCard>
        ) : (
          byRegion.map(([region, regionStreets]) => (
            <GlassCard key={region} className="p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin className="size-3.5 text-primary" aria-hidden />
                  {region}
                </p>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {regionStreets.length} 条
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {regionStreets.map((s) => (
                  <li
                    key={s.id}
                    className="flex min-h-11 items-center gap-2 rounded-2xl bg-muted/50 px-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {s.name}
                      {s.status === "doing" && (
                        <span className="ml-1.5 text-xs text-chart-3">进行中</span>
                      )}
                      {s.notes && <span className="ml-1.5 text-xs">📌</span>}
                    </span>
                    {s.difficulty && s.difficulty !== "medium" && (
                      <span className="text-[10px] text-muted-foreground">
                        {DIFFICULTY_LABEL[s.difficulty]}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`调整 ${s.name} 优先级`}
                      onClick={() => cyclePriority(s)}
                      className={cn(
                        "min-h-7 rounded-full px-2.5 text-xs font-semibold transition-colors",
                        PRIORITY_STYLE[s.priority ?? "medium"],
                      )}
                    >
                      {PRIORITY_LABEL[s.priority ?? "medium"]}
                    </button>
                    <button
                      type="button"
                      aria-label={`编辑 ${s.name} 备注`}
                      onClick={() => {
                        setNoteEditing(s);
                        setNoteDraft(s.notes ?? "");
                      }}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    >
                      ✏️
                    </button>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))
        )}
      </section>

      {/* ---------- 历史回放 ---------- */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">🎬 历史回放</h2>
        <ReplaySection />
      </section>

      {/* 备注编辑对话框 */}
      <Dialog open={noteEditing !== null} onOpenChange={(o) => !o && setNoteEditing(null)}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{noteEditing?.name} 的备注</DialogTitle>
            <DialogDescription>提醒自己：要带相机？想拍老房子门头？</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            placeholder="如：要带相机，想拍老房子"
            className="rounded-2xl"
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setNoteEditing(null)} className="rounded-2xl">
              取消
            </Button>
            <Button onClick={saveNote} className="rounded-2xl">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
