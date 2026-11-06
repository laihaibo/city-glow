"use client";

import { useMemo, useState } from "react";
import { CityMapDynamic } from "@/components/map";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { TabSkeleton } from "@/components/diary/diary-tab";
import { useCityGlow } from "@/lib/hooks";
import { formatDateCn } from "@/lib/format";
import { cn } from "cn";

/** 历史回放：选择一篇过往日记，在地图上叠加高亮那次走过的街巷 */
export function ReplaySection() {
  const { ready, data } = useCityGlow();
  const [recordId, setRecordId] = useState<string>("");

  const records = useMemo(() => data?.records ?? [], [data]);
  const streets = useMemo(() => data?.streets ?? [], [data]);

  const selected = records.find((r) => r.id === recordId) ?? null;
  const replayIds = useMemo(() => (selected ? selected.streetIds : []), [selected]);

  if (!ready || !data) {
    return <TabSkeleton text="正在加载回放……" />;
  }

  return (
    <div className="space-y-3">
      {records.length === 0 ? (
        <GlassCard className="border-dashed p-5 text-center">
          <p className="text-sm text-muted-foreground">
            还没有日记记录。走完街巷后写一篇日记，就能在这里回放那天的轨迹。
          </p>
        </GlassCard>
      ) : (
        <>
          {/* 日记选择器：最近的 12 篇 */}
          <div className="flex flex-wrap gap-1.5">
            {records.slice(0, 12).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecordId(r.id)}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors",
                  recordId === r.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {formatDateCn(r.date)}
                {r.mood}
              </button>
            ))}
          </div>

          {selected ? (
            <>
              <GlassCard className="p-4">
                <p className="text-sm font-semibold">
                  {selected.mood} {formatDateCn(selected.date)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.companions.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="rounded-full px-2.5 text-xs font-normal"
                    >
                      {c}
                    </Badge>
                  ))}
                  {selected.streetIds.map((id) => (
                    <Badge
                      key={id}
                      className="rounded-full bg-chart-4/20 px-2.5 text-xs font-normal text-chart-4"
                    >
                      {streets.find((s) => s.id === id)?.name ?? "已删除"}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {selected.insights}
                </p>
              </GlassCard>
              <GlassCard className="p-1.5">
                <div className="h-[46dvh] overflow-hidden">
                  <CityMapDynamic
                    streets={streets}
                    records={records}
                    home={[
                      data.settings.homeLocation.lat,
                      data.settings.homeLocation.lng,
                    ]}
                    mode="browse"
                    heatmap={false}
                    drawPath={[]}
                    onDrawPathChange={() => {}}
                    replayStreetIds={replayIds}
                    fitAllSignal={0}
                    goHomeSignal={0}
                  />
                </div>
              </GlassCard>
            </>
          ) : (
            <p className="py-2 text-center text-sm text-muted-foreground">
              选一篇日记，看看那天走过的路 🎬
            </p>
          )}
        </>
      )}
    </div>
  );
}
