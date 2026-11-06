"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Settings2, Trophy } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/profile/theme-switcher";
import { useCityGlow } from "@/lib/hooks";
import { deriveStats, BADGES } from "@/lib/achievements";
import { downloadBackup, importBackupFile } from "@/lib/export";
import { loadSeedData } from "@/lib/seed";
import { estimateStorageBytes, clearAllData } from "@/lib/storage";
import { cn } from "cn";

export default function ProfilePage() {
  const { ready, data } = useCityGlow();

  const stats = useMemo(() => (data ? deriveStats(data) : null), [data]);

  /** 探索排行榜：同行人出场次数（本地、无多人） */
  const leaderboard = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const r of data.records) {
      for (const c of r.companions) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  /* ---- 数据管理 ---- */
  const [storageKb, setStorageKb] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready) setStorageKb(Math.round(estimateStorageBytes() / 1024));
  }, [ready, data]);

  function handleImportFile(file: File) {
    void importBackupFile(file).then((ok) => {
      alert(ok ? "导入成功：数据已按 id 合并。" : "导入失败：不是有效的 City Glow 备份文件。");
    });
  }

  if (!ready || !data || !stats) {
    return (
      <div className="glass flex h-[50dvh] items-center justify-center rounded-3xl">
        <p className="animate-pulse text-sm text-muted-foreground">正在打开成就墙……</p>
      </div>
    );
  }

  const unlockedIds = new Set(data.achievements.unlocked.map((u) => u.id));
  const unlockedCount = BADGES.filter((b) => unlockedIds.has(b.id)).length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">我的</h1>

      {/* 城市档案卡 */}
      <GlassCard className="bg-gradient-to-br from-chart-1/14 to-transparent p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{data.settings.cityName}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              🏠 家的位置：{data.settings.homeLocation.lat.toFixed(2)},{" "}
              {data.settings.homeLocation.lng.toFixed(2)}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs">
            已点亮 {unlockedCount}/{BADGES.length} 枚徽章
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-4 divide-x divide-border/60 text-center">
          <ProfileStat label="街巷" value={stats.doneStreets} />
          <ProfileStat label="日记" value={stats.explorationCount} />
          <ProfileStat label="知识卡" value={stats.knowledgeCount} />
          <ProfileStat label="里程" value={Math.round(stats.totalKm)} unit="km" />
        </div>
      </GlassCard>

      {/* 外观 */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-semibold">外观</p>
        </div>
        <div className="mt-3">
          <ThemeSwitcher />
        </div>
      </GlassCard>

      {/* 成就墙 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">成就墙</h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {unlockedCount}/{BADGES.length}
          </span>
        </div>
        {(["数量", "区域", "内容"] as const).map((group) => (
          <div key={group} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{group}</p>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.filter((b) => b.group === group).map((badge) => {
                const unlocked = unlockedIds.has(badge.id);
                const progress = badge.progress?.(stats);
                return (
                  <GlassCard
                    key={badge.id}
                    className={cn(
                      "p-4 text-center transition-opacity",
                      !unlocked && "opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "mx-auto flex size-10 items-center justify-center rounded-full text-xl",
                        unlocked ? "bg-primary/15" : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {unlocked ? badge.emoji : <Lock className="size-4" />}
                    </span>
                    <p className="mt-2 text-sm font-semibold">{badge.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {badge.description}
                    </p>
                    {!unlocked && progress && progress.target > 1 && (
                      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/80 tabular-nums">
                        {progress.current}/{progress.target}
                      </p>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* 探索排行榜 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">🥇 探索排行榜</h2>
        <GlassCard className="p-4">
          {leaderboard.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">
              写下第一篇日记后，这里会排出来谁跟爸爸妈妈走得最多
            </p>
          ) : (
            <ol className="space-y-2.5">
              {leaderboard.map(([name, count], i) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-6 text-center text-base" aria-hidden>
                    {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}
                  </span>
                  <span className="flex-1 text-sm font-medium">{name}</span>
                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    {count}
                  </span>
                  <span className="text-xs text-muted-foreground">次</span>
                </li>
              ))}
            </ol>
          )}
        </GlassCard>
      </section>

      {/* 数据管理 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">数据管理</h2>
        <GlassCard className="p-2">
          <button
            type="button"
            onClick={() => data && downloadBackup(data)}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-muted/60"
          >
            ⬇️ <span className="flex-1 text-left">导出 JSON 备份</span>
            <span className="text-xs text-muted-foreground">全部数据打包</span>
          </button>
          <Separator className="opacity-60" />
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-muted/60"
          >
            ⬆️ <span className="flex-1 text-left">导入备份恢复</span>
            <span className="text-xs text-muted-foreground">按 id 合并不覆盖</span>
          </button>
          <Separator className="opacity-60" />
          <button
            type="button"
            onClick={() => {
              loadSeedData();
              alert("宁波示例数据已载入：12 条街巷、3 篇日记、4 张知识卡。去地图看看！");
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-muted/60"
          >
            🍊 <span className="flex-1 text-left">载入宁波示例数据</span>
            <span className="text-xs text-muted-foreground">先看看效果</span>
          </button>
          <Separator className="opacity-60" />
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            🗑️ <span className="flex-1 text-left">清空所有数据</span>
            <span className="text-xs text-muted-foreground">不可恢复</span>
          </button>
        </GlassCard>
        <p className="text-center text-xs text-muted-foreground">
          所有数据仅存于浏览器本地（localStorage），不上传任何云端
          {storageKb !== null && <> · 数据占用 {storageKb} KB</>}
        </p>
      </section>

      {/* 清空确认对话框 */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>清空所有数据？</DialogTitle>
            <DialogDescription>
              街巷、日记、知识卡片和成就都会被删除，且无法恢复。建议先「导出 JSON 备份」。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setClearOpen(false)} className="rounded-2xl">
              再想想
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAllData();
                setClearOpen(false);
                window.location.reload();
              }}
              className="rounded-2xl"
            >
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileStat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div>
      <p className="font-mono text-lg font-bold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
