"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { cn } from "cn";
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
import { GlassCard } from "@/components/glass/glass-card";
import { useTiandituKey } from "@/lib/use-map-key";

/**
 * 天地图 Key 配置对话框：底图来自国家天地图服务，需要（免费的）Key 才能显示；
 * 无 Key 时应用以线稿模式运行，画街巷/热力图照常可用。
 */
export function TiandituKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { key, saveKey } = useTiandituKey();
  const [keyInput, setKeyInput] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>配置天地图 Key</DialogTitle>
          <DialogDescription>
            底图来自国家天地图服务，需要（免费的）Key 才能显示。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={key ? "留空则保持现有 Key 不变" : "粘贴天地图 Key（32 位字母数字）"}
            className="rounded-2xl font-mono"
            autoFocus
          />
          <div className="space-y-1.5 rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              1. 访问{" "}
              <a
                href="https://console.tianditu.gov.cn/api/key"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                天地图控制台
              </a>{" "}
              注册并「创建应用」，类型选 <b>浏览器端</b>
            </p>
            <p>2. 复制 Key 粘贴到上方，仅保存在本机浏览器，不会上传</p>
            <p>3. 填了 Key 底图仍不显示？检查应用类型是否为浏览器端，或在天地图后台把域名绑定到 laihaibo.github.io</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl">
            取消
          </Button>
          <Button
            onClick={() => {
              if (!keyInput.trim()) return;
              saveKey(keyInput);
              setKeyInput("");
              onOpenChange(false);
            }}
            disabled={!keyInput.trim()}
            className="rounded-2xl"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 设置页里的 Key 配置卡片 */
export function TiandituKeyCard() {
  const { key } = useTiandituKey();
  const [open, setOpen] = useState(false);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-primary" aria-hidden />
        <p className="text-sm font-semibold">地图底图（天地图 Key）</p>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
            key ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground",
          )}
        >
          {key ? "已配置" : "未配置"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {key
          ? "底图已生效。更换设备后需重新填写（Key 不随备份传播）。"
          : "未配置时地图为线稿模式，画街巷、热力图照常可用；填入免费 Key 即可看到真实地图。"}
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="mt-3 rounded-xl"
        onClick={() => setOpen(true)}
      >
        {key ? "更换 Key" : "配置 Key"}
      </Button>
      <TiandituKeyDialog open={open} onOpenChange={setOpen} />
    </GlassCard>
  );
}

/** 地图页的未配置提示条：引导去设置页（位于顶部悬浮条下方，避免与统计 chip 重叠） */
export function TiandituKeyHint() {
  const { key } = useTiandituKey();
  if (key) return null;
  return (
    <Link
      href="/profile/settings"
      className="glass absolute left-1/2 top-14 z-[1000] flex max-w-[calc(100%-140px)] -translate-x-1/2 items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden>🗺️</span>
      <span className="truncate">线稿模式 · 点此配置免费底图 Key</span>
    </Link>
  );
}
