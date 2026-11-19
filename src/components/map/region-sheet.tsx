"use client";

import { Check, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Street } from "@/lib/types";
import { cn } from "cn";

export interface RegionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streets: Street[];
  /** 点击街巷行：已走 ↔ 待走 切换 */
  onToggleStatus: (street: Street) => void;
  /** 重新描画该街巷（修路后更新路径） */
  onRedraw: (street: Street) => void;
}

/** 区域勾选底部抽屉：按区域分组勾选已走/待走，并可对单条街巷重新描画 */
export function RegionSheet({
  open,
  onOpenChange,
  streets,
  onToggleStatus,
  onRedraw,
}: RegionSheetProps) {
  const regions = [...new Set(streets.map((s) => s.region))].sort();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-strong max-h-[75dvh] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <SheetHeader className="px-0">
          <SheetTitle>按区域勾选街巷</SheetTitle>
          <SheetDescription>
            点击街巷在「已走 / 待走」间切换；铅笔可重新描画路径（修路改道后用）
          </SheetDescription>
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
                    <div
                      key={s.id}
                      className="flex min-h-11 items-center gap-2 rounded-2xl bg-muted/50 px-3"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleStatus(s)}
                        className="flex min-h-9 flex-1 items-center gap-2.5 py-1 text-left"
                        aria-label={`切换 ${s.name} 的已走状态`}
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
                      <button
                        type="button"
                        aria-label={`重新描画 ${s.name}`}
                        title="重新描画（修路后更新路径）"
                        onClick={() => {
                          onOpenChange(false);
                          onRedraw(s);
                        }}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
