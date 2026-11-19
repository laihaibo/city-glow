"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GlassCard } from "@/components/glass/glass-card";
import { ThemeSwitcher } from "@/components/profile/theme-switcher";
import { CityManager } from "@/components/profile/city-manager";
import { AiSettingsCard } from "@/components/profile/ai-settings";
import { TiandituKeyCard } from "@/components/map/tianditu-key-card";
import { useCityGlow } from "@/lib/hooks";
import { downloadBackup, importBackupFile } from "@/lib/export";
import { loadSeedData } from "@/lib/seed";
import { estimateStorageBytes, clearAllData } from "@/lib/storage";

/** 设置（独立页面）：外观 / 城市管理 / 地图 Key / AI 助手 / 数据管理，一处收敛 */
export default function SettingsPage() {
  const { ready, data, activeCity } = useCityGlow();

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

  if (!ready || !data || !activeCity) {
    return (
      <div className="glass flex h-[50dvh] items-center justify-center rounded-3xl">
        <p className="animate-pulse text-sm text-muted-foreground">正在打开设置……</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">设置</h1>

      {/* 外观 */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">🎨 外观</p>
        </div>
        <div className="mt-3">
          <ThemeSwitcher />
        </div>
      </GlassCard>

      {/* 城市管理：多城市切换 / 添加 / 删除 */}
      <div id="cities">
        <CityManager />
      </div>

      {/* 地图底图 Key */}
      <TiandituKeyCard />

      {/* AI 助手（可选增强） */}
      <AiSettingsCard />

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
          {activeCity.name === "宁波" && (
            <>
              <Separator className="opacity-60" />
              <button
                type="button"
                onClick={() => {
                  loadSeedData();
                  alert("宁波示例数据已载入：12 条街巷、3 篇日记、4 张知识卡。去首页地图看看！");
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-muted/60"
              >
                🍊 <span className="flex-1 text-left">载入宁波示例数据</span>
                <span className="text-xs text-muted-foreground">先看看效果</span>
              </button>
            </>
          )}
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
