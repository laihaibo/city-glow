"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Flag, Milestone, Play } from "lucide-react";
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
import { useCityGlow } from "@/lib/hooks";
import { deriveWaypoints, pathLengthKm } from "@/lib/geo";
import type { Street, StreetStatus, StreetWaypoint } from "@/lib/types";
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

const KIND_META: Record<StreetWaypoint["kind"], { label: string; icon: typeof Play }> = {
  start: { label: "起点", icon: Play },
  turn: { label: "转弯点", icon: Milestone },
  end: { label: "终点", icon: Flag },
};

export interface SaveStreetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 已画好的路径（保存后即街巷的全部坐标） */
  drawPath: [number, number][];
  /** 已有区域供快捷选择 */
  regions: string[];
  /** 编辑模式：重新描画已有街巷（修路后更新路径） */
  editing: Street | null;
  onSave: (street: Street) => void;
}

/**
 * 保存/更新街巷对话框：名称、区域、状态，以及关键点命名。
 * 起点与终点由路径自动确定，中间点记为转弯点；关键点可留空或命名（如"鼓楼口"）。
 */
export function SaveStreetDialog({
  open,
  onOpenChange,
  drawPath,
  regions,
  editing,
  onSave,
}: SaveStreetDialogProps) {
  const { cityData } = useCityGlow();

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState<StreetStatus>("done");
  /** 关键点命名：索引 → 名称 */
  const [waypointNames, setWaypointNames] = useState<Record<number, string>>({});

  const allRegions = useMemo(() => {
    const own = cityData?.streets.map((s) => s.region) ?? [];
    return [...new Set([...own, ...regions])].sort();
  }, [cityData, regions]);

  const waypoints = useMemo(() => deriveWaypoints(drawPath), [drawPath]);
  const drawKm = drawPath.length >= 2 ? pathLengthKm(drawPath) : 0;

  // 打开时按编辑/新建初始化表单
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setRegion(editing.region);
      setStatus(editing.status);
      const names: Record<number, string> = {};
      editing.waypoints?.forEach((wp, i) => {
        if (wp.name) names[i] = wp.name;
      });
      setWaypointNames(names);
    } else {
      setName("");
      setRegion("");
      setStatus("done");
      setWaypointNames({});
    }
  }, [open, editing]);

  function handleSave() {
    if (!name.trim() || drawPath.length < 2) return;
    const today = new Date().toISOString().slice(0, 10);
    const withNames: StreetWaypoint[] = waypoints.map((wp, i) => {
      const named = waypointNames[i]?.trim();
      return named ? { ...wp, name: named } : wp;
    });
    const street: Street = editing
      ? {
          ...editing,
          name: name.trim(),
          region: region.trim() || editing.region,
          status,
          path: drawPath,
          waypoints: withNames,
          lengthKm: drawKm,
          lastWalkedAt: status === "done" ? today : editing.lastWalkedAt,
        }
      : {
          id: nanoid(10),
          cityId: "",
          name: name.trim(),
          region: region.trim() || "未分区",
          path: drawPath,
          waypoints: withNames,
          status,
          lengthKm: drawKm,
          lastWalkedAt: status === "done" ? today : undefined,
          priority: "medium",
        };
    onSave(street);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[88dvh] max-w-sm overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "更新这条街巷" : "保存这条街巷"}</DialogTitle>
          <DialogDescription>
            {editing ? "新路径会覆盖旧线（如修路改道后的最新走法）· " : ""}
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
              {allRegions.map((r) => (
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
              placeholder="选上方或输入新区域"
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

          {/* 关键点命名：修路改道后，凭起点/转弯点/终点名字就能找回路 */}
          <div>
            <p className="text-sm font-medium">
              关键点 <span className="text-xs font-normal text-muted-foreground">可命名，帮助修路改道后找回路</span>
            </p>
            <div className="mt-1.5 max-h-44 space-y-1.5 overflow-y-auto rounded-2xl bg-muted/50 p-2">
              {waypoints.map((wp, i) => {
                const meta = KIND_META[wp.kind];
                const Icon = meta.icon;
                return (
                  <div key={wp.id} className="flex items-center gap-2">
                    <span className="flex w-20 shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Icon
                        className={cn(
                          "size-3",
                          wp.kind === "start" && "text-chart-1",
                          wp.kind === "end" && "text-chart-2",
                        )}
                        aria-hidden
                      />
                      {meta.label}
                    </span>
                    <Input
                      value={waypointNames[i] ?? ""}
                      onChange={(e) =>
                        setWaypointNames((prev) => ({ ...prev, [i]: e.target.value }))
                      }
                      placeholder={wp.kind === "turn" ? `转点 ${i}（可命名）` : "可命名，如：鼓楼口"}
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl">
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="rounded-2xl">
            {editing ? "更新" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
