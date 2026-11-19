"use client";

import { useMemo, useState } from "react";
import {
  Flame,
  Home,
  ListChecks,
  Maximize2,
  Pencil,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { CityMapDynamic } from "@/components/map";
import type { MapMode } from "@/components/map/city-map";
import { SaveStreetDialog } from "@/components/map/save-street-dialog";
import { DrawToolbar } from "@/components/map/draw-toolbar";
import { RegionSheet } from "@/components/map/region-sheet";
import { TiandituKeyHint } from "@/components/map/tianditu-key-card";
import { GlassCard } from "@/components/glass/glass-card";
import { CitySwitcher } from "@/components/city/city-switcher";
import { useCityGlow } from "@/lib/hooks";
import { pathLengthKm } from "@/lib/geo";
import type { Street, StreetStatus } from "@/lib/types";
import { cn } from "cn";

/**
 * 首页 = 地图。打开应用直接看到点亮成果：
 * 顶部悬浮城市/统计条，右下工具簇，左下「画街巷」主入口。
 */
export default function HomePage() {
  const { ready, data, cityData, activeCity, updateStreets } = useCityGlow();
  const [mode, setMode] = useState<MapMode>("browse");
  const [heatmap, setHeatmap] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(true);
  const [drawPath, setDrawPath] = useState<[number, number][]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editingStreet, setEditingStreet] = useState<Street | null>(null);
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [goHomeSignal, setGoHomeSignal] = useState(0);

  const streets = useMemo(() => cityData?.streets ?? [], [cityData]);
  const records = useMemo(() => cityData?.records ?? [], [cityData]);
  const knowledge = useMemo(() => cityData?.knowledge ?? [], [cityData]);
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
    };
  }, [streets, regions]);

  const drawKm = drawPath.length >= 2 ? pathLengthKm(drawPath) : 0;

  const resetDraw = () => {
    setDrawPath([]);
    setEditingStreet(null);
    setMode("browse");
  };

  const startDraw = () => {
    setEditingStreet(null);
    setDrawPath([]);
    setMode("draw");
  };

  /** 修路改道：重新描画已有街巷，保存后覆盖旧路径 */
  const handleRedraw = (street: Street) => {
    setEditingStreet(street);
    setDrawPath(street.path);
    setMode("draw");
  };

  const handleSaveStreet = (street: Street) => {
    if (!cityData) return;
    if (editingStreet) {
      updateStreets(cityData.streets.map((s) => (s.id === street.id ? street : s)));
      toast.success(`「${street.name}」路径已更新 🎉`);
    } else {
      updateStreets([street, ...cityData.streets]);
      toast.success(`「${street.name}」已点亮 ✨`);
    }
    setSaveOpen(false);
    resetDraw();
  };

  /** 区域勾选：点击街巷行在 已走 ↔ 待走 间切换 */
  const toggleStreetStatus = (street: Street) => {
    if (!cityData) return;
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

  if (!ready || !data || !cityData || !activeCity) {
    return (
      <div className="glass flex h-[60dvh] items-center justify-center rounded-3xl">
        <p className="animate-pulse text-sm text-muted-foreground">正在点亮城市……</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-6">
      <div className="relative h-[calc(100dvh-96px-env(safe-area-inset-bottom))] overflow-hidden lg:h-[calc(100dvh-8.5rem)] lg:rounded-3xl">
        <CityMapDynamic
          streets={streets}
          records={records}
          knowledge={knowledge}
          showKnowledge={showKnowledge}
          home={[activeCity.homeLocation.lat, activeCity.homeLocation.lng]}
          mode={mode}
          heatmap={heatmap}
          drawPath={drawPath}
          onDrawPathChange={setDrawPath}
          fitAllSignal={fitAllSignal}
          goHomeSignal={goHomeSignal}
          onRedrawStreet={handleRedraw}
        />

        {/* 顶部悬浮条：城市切换 + 浓缩统计 */}
        <div className="absolute inset-x-3 top-3 z-[1000] flex items-center gap-2">
          <CitySwitcher />
          <GlassCard className="ml-auto rounded-full px-3 py-1.5">
            <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
              <span className="font-bold text-primary">{stats.doneCount}</span> 条 ·{" "}
              {stats.totalKm.toFixed(1)} km · {stats.coverage}%
            </p>
          </GlassCard>
        </div>

        {/* 未配置底图 Key 的提示 */}
        <TiandituKeyHint />

        {/* 右上角工具组 */}
        <div className="glass absolute right-3 top-12 z-[1000] flex flex-col gap-1.5 rounded-2xl p-1.5">
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

        {/* 绘制中工具条 */}
        {mode === "draw" && (
          <DrawToolbar
            pointCount={drawPath.length}
            drawKm={drawKm}
            editingName={editingStreet?.name}
            onUndo={() => setDrawPath((p) => p.slice(0, -1))}
            onCancel={resetDraw}
            onFinish={() => setSaveOpen(true)}
          />
        )}

        {/* 浏览模式右下角：知识卡图层 + 勾选区域 */}
        {mode === "browse" && (
          <>
            <div className="glass absolute bottom-4 right-3 z-[1000] flex flex-col gap-1.5 rounded-2xl p-1.5">
              <ToolButton
                label="知识卡片"
                active={showKnowledge}
                onClick={() => setShowKnowledge((v) => !v)}
                icon={<Tags className="size-4" />}
              />
              <ToolButton
                label="勾选区域"
                onClick={() => setRegionSheetOpen(true)}
                icon={<ListChecks className="size-4" />}
              />
            </div>

            {/* 左下角主入口：画街巷 */}
            <button
              type="button"
              onClick={startDraw}
              className="absolute bottom-4 left-3 z-[1000] flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-chart-2 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.97]"
            >
              <Pencil className="size-4" aria-hidden />
              画街巷
            </button>

            {/* 空状态引导 */}
            {streets.length === 0 && (
              <GlassCard className="absolute inset-x-12 bottom-20 z-[1000] border-dashed p-4 text-center">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  还没有任何街巷。点「画街巷」沿家门口的小路点几个点，保存后地图就会亮起第一缕光 ✨
                </p>
              </GlassCard>
            )}
          </>
        )}
      </div>

      {/* 保存 / 更新街巷对话框（含关键点命名） */}
      <SaveStreetDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        drawPath={drawPath}
        regions={regions}
        editing={editingStreet}
        onSave={handleSaveStreet}
      />

      {/* 区域勾选抽屉 */}
      <RegionSheet
        open={regionSheetOpen}
        onOpenChange={setRegionSheetOpen}
        streets={streets}
        onToggleStatus={toggleStreetStatus}
        onRedraw={handleRedraw}
      />
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
