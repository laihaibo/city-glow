"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  Check,
  Flame,
  Home,
  ListChecks,
  Maximize2,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { CityMapDynamic, } from "@/components/map";
import type { MapMode } from "@/components/map/city-map";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCityGlow } from "@/lib/hooks";
import { pathLengthKm } from "@/lib/geo";
import type { Street, StreetStatus } from "@/lib/types";
import { cn } from "cn";

const STATUS_LABEL: Record<StreetStatus, string> = {
  done: "已走",
  doing: "在走",
  todo: "待走",
};

const STATUS_STYLE: Record<StreetStatus, string> = {
  done: "bg-chart-1 text-white",
  doing: "bg-chart-3 text-foreground",
  todo: "bg-muted text-muted-foreground",
};

export default function MapPage() {
  const { ready, data, updateStreets } = useCityGlow();
  const [mode, setMode] = useState<MapMode>("browse");
  const [heatmap, setHeatmap] = useState(false);
  const [drawPath, setDrawPath] = useState<[number, number][]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [goHomeSignal, setGoHomeSignal] = useState(0);

  // 新街巷表单
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState<StreetStatus>("done");

  const streets = useMemo(() => data?.streets ?? [], [data]);
  const records = useMemo(() => data?.records ?? [], [data]);
  const regions = useMemo(
    () => [...new Set(streets.map((s) => s.region))].sort(),
    [streets],
  );

  const stats = useMemo(() => {
    const done = streets.filter((s) => s.status === "done");
    const doneRegions = new Set(done.map((s) => s.region));
    return {
      doneCount: done.length,
      totalKm: done.reduce((sum, s) => sum + s.lengthKm, 0),
      coverage: regions.length > 0 ? Math.round((doneRegions.size / regions.length) * 100) : 0,
      explorations: records.length,
    };
  }, [streets, records, regions]);

  const drawKm = drawPath.length >= 2 ? pathLengthKm(drawPath) : 0;

  const resetDraw = () => {
    setDrawPath([]);
    setMode("browse");
  };

  const handleSaveStreet = () => {
    if (!data || !name.trim() || drawPath.length < 2) return;
    const today = new Date().toISOString().slice(0, 10);
    const street: Street = {
      id: nanoid(10),
      name: name.trim(),
      region: region.trim() || "未分区",
      path: drawPath,
      status,
      lengthKm: pathLengthKm(drawPath),
      lastWalkedAt: status === "done" ? today : undefined,
      priority: "medium",
    };
    updateStreets([street, ...data.streets]);
    setSaveOpen(false);
    setName("");
    setRegion("");
    setStatus("done");
    resetDraw();
  };

  /** 区域勾选：点击街巷行在 已走 ↔ 待走 间切换 */
  const toggleStreetStatus = (street: Street) => {
    if (!data) return;
    const nextStatus: StreetStatus = street.status === "done" ? "todo" : "done";
    updateStreets(
      streets.map((s) =>
        s.id === street.id
          ? {
              ...s,
              status: nextStatus,
              lastWalkedAt: nextStatus === "done" ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : s,
      ),
    );
  };

  if (!ready || !data) {
    return (
      <div className="glass flex h-[60dvh] items-center justify-center rounded-3xl">
        <p className="animate-pulse text-sm text-muted-foreground">正在点亮城市……</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 + 统计 */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">足迹地图</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.settings.cityName} · 在底图上划线标注街巷，点亮走过的路
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
          {regions.length} 个区域
        </Badge>
      </div>

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

      {/* 地图画布 */}
      <GlassCard className="relative overflow-hidden p-1.5">
        <div className="h-[58dvh] overflow-hidden rounded-[calc(1.25rem-6px)]">
          <CityMapDynamic
            streets={streets}
            records={records}
            home={[data.settings.homeLocation.lat, data.settings.homeLocation.lng]}
            mode={mode}
            heatmap={heatmap}
            drawPath={drawPath}
            onDrawPathChange={setDrawPath}
            fitAllSignal={fitAllSignal}
            goHomeSignal={goHomeSignal}
          />
        </div>

        {/* 右上角工具组 */}
        <div className="glass absolute right-4 top-4 z-[1000] flex flex-col gap-1.5 rounded-2xl p-1.5">
          <ToolButton
            label="回到家"
            onClick={() => setGoHomeSignal((n) => n + 1)}
            icon={<Home className="size-4" />}
          />
          <ToolButton
            label="全览街巷"
            onClick={() => setFitAllSignal((n) => n + 1)}
            icon={<Maximize2 className="size-4" />}
          />
          <ToolButton
            label="热力图"
            active={heatmap}
            onClick={() => setHeatmap((v) => !v)}
            icon={<Flame className="size-4" />}
          />
        </div>

        {/* 绘制中提示条 */}
        {mode === "draw" && (
          <div className="glass-strong absolute inset-x-4 bottom-4 z-[1000] flex items-center gap-2 rounded-2xl px-3 py-2">
            <Pencil className="size-4 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {drawPath.length < 2
                ? "沿街巷走向点击地图加点"
                : `已画 ${drawPath.length} 点 · 约 ${drawKm} km`}
            </p>
            <Button size="icon-xs" variant="ghost" aria-label="撤销上一点" onClick={() => setDrawPath((p) => p.slice(0, -1))}>
              <RotateCcw className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="ghost" aria-label="取消绘制" onClick={resetDraw}>
              <X className="size-3.5" />
            </Button>
            <Button
              size="xs"
              disabled={drawPath.length < 2}
              onClick={() => setSaveOpen(true)}
              className="rounded-xl"
            >
              <Check className="size-3.5" />
              完成
            </Button>
          </div>
        )}
      </GlassCard>

      {/* 模式切换 + 区域勾选 */}
      <div className="grid grid-cols-3 gap-2">
        <ModeButton
          active={mode === "browse"}
          onClick={() => {
            setMode("browse");
            setDrawPath([]);
          }}
          icon={<MapPinIcon />}
          label="浏览"
        />
        <ModeButton
          active={mode === "draw"}
          onClick={() => setMode("draw")}
          icon={<Pencil className="size-4" />}
          label="画街巷"
        />
        <ModeButton
          active={false}
          onClick={() => setRegionSheetOpen(true)}
          icon={<ListChecks className="size-4" />}
          label="勾选区域"
        />
      </div>

      {streets.length === 0 && (
        <GlassCard className="border-dashed p-5 text-center">
          <p className="text-sm font-medium">还没有任何街巷</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            点「画街巷」沿家门口的小路点几个点，保存后地图就会亮起第一缕光 ✨
          </p>
        </GlassCard>
      )}

      {/* 保存街巷对话框 */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>保存这条街巷</DialogTitle>
            <DialogDescription>
              画了 {drawPath.length} 个点，约 {drawKm} km
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="street-name" className="text-sm font-medium">
                名称
              </label>
              <Input
                id="street-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：中山路"
                className="mt-1.5 rounded-2xl"
                autoFocus
              />
            </div>
            <div>
              <p className="text-sm font-medium">区域</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    className={cn(
                      "min-h-8 rounded-full px-3 text-xs font-medium transition-colors",
                      region === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="选上方或输入新区域，如：海曙老城"
                className="mt-2 rounded-2xl"
              />
            </div>
            <div>
              <p className="text-sm font-medium">状态</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-2xl bg-muted/60 p-1.5">
                {(Object.keys(STATUS_LABEL) as StreetStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "min-h-9 rounded-xl text-xs font-semibold transition-all",
                      status === s ? STATUS_STYLE[s] : "text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSaveOpen(false)} className="rounded-2xl">
              取消
            </Button>
            <Button onClick={handleSaveStreet} disabled={!name.trim()} className="rounded-2xl">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 区域勾选 Sheet */}
      <Sheet open={regionSheetOpen} onOpenChange={setRegionSheetOpen}>
        <SheetContent side="bottom" className="glass-strong max-h-[75dvh] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          <SheetHeader className="px-0">
            <SheetTitle>按区域勾选街巷</SheetTitle>
            <SheetDescription>点击街巷在「已走 / 待走」间切换，长清单会记得每个区域还剩多少没走</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-4">
            {regions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                还没有街巷，先去「画街巷」标注吧
              </p>
            )}
            {regions.map((r) => {
              const regionStreets = streets.filter((s) => s.region === r);
              const doneCount = regionStreets.filter((s) => s.status === "done").length;
              return (
                <div key={r}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {r}
                    <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                      {doneCount}/{regionStreets.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {regionStreets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStreetStatus(s)}
                        className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl bg-muted/50 px-3 text-left transition-colors active:bg-muted"
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            s.status === "done"
                              ? "border-chart-1 bg-chart-1 text-white"
                              : "border-border bg-background",
                          )}
                          aria-hidden
                        >
                          {s.status === "done" && <Check className="size-3.5" />}
                        </span>
                        <span
                          className={cn(
                            "flex-1 truncate text-sm",
                            s.status === "done" && "text-muted-foreground line-through",
                          )}
                        >
                          {s.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {s.lengthKm} km
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ToolButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted/70",
      )}
    >
      {icon}
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]",
        active && "ring-2 ring-primary/60",
      )}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"} aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
