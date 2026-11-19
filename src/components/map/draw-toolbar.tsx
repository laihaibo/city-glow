"use client";

import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DrawToolbarProps {
  /** 已落点数量 */
  pointCount: number;
  /** 已画路径长度（km） */
  drawKm: number;
  /** 编辑模式提示（重新描画已有街巷） */
  editingName?: string;
  onUndo: () => void;
  onCancel: () => void;
  onFinish: () => void;
}

/** 绘制模式下的悬浮工具条：撤销 / 取消 / 完成 */
export function DrawToolbar({
  pointCount,
  drawKm,
  editingName,
  onUndo,
  onCancel,
  onFinish,
}: DrawToolbarProps) {
  return (
    <div className="glass-strong absolute inset-x-4 bottom-4 z-[1000] flex items-center gap-2 rounded-2xl px-3 py-2">
      <Pencil className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {pointCount < 2
          ? editingName
            ? `重新描画「${editingName}」：点击地图沿新路径加点`
            : "沿街巷走向点击地图加点"
          : `已画 ${pointCount} 点 · 约 ${drawKm} km`}
      </p>
      <Button size="icon-xs" variant="ghost" aria-label="撤销上一点" onClick={onUndo}>
        <RotateCcw className="size-3.5" />
      </Button>
      <Button size="icon-xs" variant="ghost" aria-label="取消绘制" onClick={onCancel}>
        <X className="size-3.5" />
      </Button>
      <Button
        size="xs"
        disabled={pointCount < 2}
        onClick={onFinish}
        className="rounded-xl"
      >
        <Check className="size-3.5" />
        完成
      </Button>
    </div>
  );
}
