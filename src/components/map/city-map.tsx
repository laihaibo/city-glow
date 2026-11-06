"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { ExplorationRecord, Street } from "@/lib/types";

/** 街巷状态 → 糖果色（与 globals.css 的 chart 令牌保持一致观感） */
export const STREET_COLORS: Record<Street["status"], string> = {
  done: "#f0489c", // 糖果粉
  doing: "#f5c518", // 柠檬黄
  todo: "#9ca3af", // 待走灰
};

const REPLAY_COLOR = "#38bdf8"; // 历史回放高亮（天空蓝）
const DRAW_PREVIEW_COLOR = "#f0489c";

export type MapMode = "browse" | "draw";

export interface CityMapProps {
  streets: Street[];
  records: ExplorationRecord[];
  /** [lat, lng] 家的位置 */
  home: [number, number];
  mode: MapMode;
  heatmap: boolean;
  /** 绘制中的路径点（受控） */
  drawPath: [number, number][];
  onDrawPathChange: (path: [number, number][]) => void;
  /** 历史回放：本次要高亮的街巷 id */
  replayStreetIds?: string[];
  /** 递增信号：触发"显示全部街巷"的视野回位 */
  fitAllSignal: number;
  /** 递增信号：触发飞回家 */
  goHomeSignal: number;
}

/* ---------- 内部控制器们 ---------- */

/** 挂载时适配全部街巷视野；goHomeSignal 变化时飞回家 */
function ViewportController({
  streets,
  home,
  fitAllSignal,
  goHomeSignal,
}: Pick<CityMapProps, "streets" | "home" | "fitAllSignal" | "goHomeSignal">) {
  const map = useMap();

  // 初始：有街巷则框住全部，否则定位到家
  useEffect(() => {
    const points = streets.flatMap((s) => s.path);
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    } else {
      map.setView(home, 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (goHomeSignal > 0) {
      map.flyTo(home, 15, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goHomeSignal]);

  useEffect(() => {
    if (fitAllSignal > 0) {
      const points = streets.flatMap((s) => s.path);
      if (points.length >= 2) {
        map.flyToBounds(L.latLngBounds(points), { padding: [36, 36], duration: 0.8 });
      } else {
        map.flyTo(home, 15, { duration: 0.8 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitAllSignal]);

  return null;
}

/** 绘制模式：点击底图加点 */
function DrawClickHandler({
  enabled,
  onPoint,
}: {
  enabled: boolean;
  onPoint: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

/** 探索热力图：已走街巷顶点密度 → 暖色光斑（Canvas GridLayer，零依赖） */
function HeatmapLayer({ streets, visible }: { streets: Street[]; visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;
    const points = streets
      .filter((s) => s.status === "done")
      .flatMap((s) => s.path)
      .map(([lat, lng]) => L.latLng(lat, lng));

    const HeatLayerClass = L.GridLayer.extend({
      createTile(this: L.GridLayer & { _heatPoints?: never }, coords: L.Coords) {
        const tile = L.DomUtil.create("canvas") as HTMLCanvasElement;
        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        const ctx = tile.getContext("2d");
        if (!ctx) return tile;

        const radius = Math.min(40, Math.max(12, (coords.z - 12) * 9));
        const origin = coords.scaleBy(size);
        ctx.globalCompositeOperation = "lighter";
        for (const latlng of points) {
          const p = map.project(latlng, coords.z).subtract(origin);
          if (p.x < -radius || p.y < -radius || p.x > size.x + radius || p.y > size.y + radius) {
            continue;
          }
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          grad.addColorStop(0, "rgba(255,120,60,0.28)");
          grad.addColorStop(0.6, "rgba(255,170,60,0.12)");
          grad.addColorStop(1, "rgba(255,200,80,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        return tile;
      },
    });

    const layer = new (HeatLayerClass as unknown as new (
      options?: L.GridLayerOptions,
    ) => L.GridLayer)({
      tileSize: 256,
      opacity: 0.9,
      className: "city-glow-heat",
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, streets, visible]);

  return null;
}

/* ---------- 弹窗内容：已走街巷的探索记录卡 ---------- */

function StreetPopup({
  street,
  records,
}: {
  street: Street;
  records: ExplorationRecord[];
}) {
  const related = records
    .filter((r) => r.streetIds.includes(street.id))
    .sort((a, b) => b.date.localeCompare(a.date));
  const companions = [...new Set(related.flatMap((r) => r.companions))];
  const latest = related[0];

  return (
    <div className="min-w-44 space-y-1.5 p-1 text-sm">
      <p className="font-semibold">
        {street.name}
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{street.region}</span>
      </p>
      {street.lastWalkedAt && (
        <p className="text-xs text-muted-foreground">
          最近走过：{street.lastWalkedAt.slice(0, 10)} · {street.lengthKm} km
        </p>
      )}
      {companions.length > 0 && (
        <p className="text-xs">同行：{companions.join("、")}</p>
      )}
      {latest && (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {latest.insights.slice(0, 80)}
          {latest.insights.length > 80 ? "……" : ""}
        </p>
      )}
      {related.length > 1 && (
        <p className="text-xs text-muted-foreground">共有 {related.length} 条相关日记</p>
      )}
      {!latest && <p className="text-xs text-muted-foreground">还没有日记记录</p>}
    </div>
  );
}

/* ---------- 主组件 ---------- */

export default function CityMap({
  streets,
  records,
  home,
  mode,
  heatmap,
  drawPath,
  onDrawPathChange,
  replayStreetIds,
  fitAllSignal,
  goHomeSignal,
}: CityMapProps) {
  const replaySet = useMemo(() => new Set(replayStreetIds ?? []), [replayStreetIds]);

  const handleDrawClick = (p: [number, number]) => {
    onDrawPathChange([...drawPath, p]);
  };

  return (
    <MapContainer
      center={home}
      zoom={15}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ViewportController
        streets={streets}
        home={home}
        fitAllSignal={fitAllSignal}
        goHomeSignal={goHomeSignal}
      />
      <DrawClickHandler enabled={mode === "draw"} onPoint={handleDrawClick} />
      <HeatmapLayer streets={streets} visible={heatmap} />

      {/* 家的位置 */}
      <CircleMarker
        center={home}
        radius={9}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#f0489c", fillOpacity: 1 }}
      >
        <Popup>
          <div className="p-1 text-sm font-semibold">🏠 家</div>
        </Popup>
      </CircleMarker>

      {/* 全部街巷 */}
      {streets.map((street) => {
        const replayed = replaySet.has(street.id);
        const color = replayed ? REPLAY_COLOR : STREET_COLORS[street.status];
        return (
          <Polyline
            key={street.id}
            positions={street.path}
            pathOptions={{
              color,
              weight: replayed ? 7 : 5,
              opacity: 0.9,
              dashArray: street.status === "todo" && !replayed ? "8 8" : undefined,
              lineCap: "round",
            }}
            eventHandlers={mode === "draw" ? {} : { click: () => undefined }}
          >
            {street.status !== "todo" && mode !== "draw" && (
              <Popup maxWidth={280}>
                <StreetPopup street={street} records={records} />
              </Popup>
            )}
          </Polyline>
        );
      })}

      {/* 绘制预览：已落点连线 + 各点圆标 */}
      {drawPath.length > 0 && (
        <>
          <Polyline
            positions={drawPath}
            pathOptions={{
              color: DRAW_PREVIEW_COLOR,
              weight: 4,
              opacity: 0.8,
              dashArray: "6 8",
            }}
          />
          {drawPath.map((p, i) => (
            <CircleMarker
              key={`${p[0]},${p[1]},${i}`}
              center={p}
              radius={5}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: DRAW_PREVIEW_COLOR, fillOpacity: 1 }}
            />
          ))}
        </>
      )}
    </MapContainer>
  );
}
