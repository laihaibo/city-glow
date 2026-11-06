import type { Metadata } from "next";
import { Map as MapIcon, Pencil, SquareCheck } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "足迹地图" };

/** 街巷三种状态的图例配色，Phase 2 绘制 polyline 时沿用 */
const LEGEND = [
  { label: "已走", className: "bg-chart-1" },
  { label: "在走", className: "bg-chart-3" },
  { label: "待走", className: "bg-muted-foreground/40" },
];

export default function MapPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">足迹地图</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            在城市底图上划线标注街巷，点亮走过的路
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full text-xs">
          Phase 2 接入
        </Badge>
      </div>

      {/* 地图画布占位：Phase 2 换成 react-leaflet 动态加载的交互地图 */}
      <GlassCard className="flex min-h-[46dvh] flex-col items-center justify-center gap-4 border-dashed p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
          <MapIcon className="size-8 text-primary" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">地图画布</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Phase 2 将在此嵌入 react-leaflet + OpenStreetMap，支持双指缩放、点击标注街巷与探索热力图
          </p>
        </div>
      </GlassCard>

      {/* 图例与模式预览 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GlassCard className="p-4">
          <p className="text-sm font-semibold">街巷状态图例</p>
          <div className="mt-3 space-y-2.5">
            {LEGEND.map(({ label, className }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className={`h-1.5 w-8 rounded-full ${className}`} aria-hidden />
                {label}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm font-semibold">操作模式</p>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Pencil className="size-4 text-primary" aria-hidden />
              沿路径点击划街巷
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <SquareCheck className="size-4 text-primary" aria-hidden />
              按区域勾选待走清单
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
