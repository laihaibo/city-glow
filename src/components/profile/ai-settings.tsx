"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
  getAiConfig,
  saveAiConfig,
  AI_DEFAULTS,
  type AiConfig,
} from "@/lib/storage";

/** AI 配置对话框：diary 页 AI 入口未配置时也会弹出 */
export function AiConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [baseUrl, setBaseUrl] = useState<string>(AI_DEFAULTS.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>(AI_DEFAULTS.model);

  // 打开时回填已保存的配置
  useEffect(() => {
    if (!open) return;
    const config = getAiConfig();
    setBaseUrl(config?.baseUrl ?? AI_DEFAULTS.baseUrl);
    setModel(config?.model ?? AI_DEFAULTS.model);
    setApiKey("");
  }, [open]);

  const handleSave = () => {
    saveAiConfig({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model: model.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>AI 助手配置</DialogTitle>
            <DialogDescription>
              兼容任何 OpenAI 风格接口，默认预填 DeepSeek（实测支持浏览器直连）
            </DialogDescription>
          </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="ai-base-url" className="text-sm font-medium">接口地址</label>
            <Input
              id="ai-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={AI_DEFAULTS.baseUrl}
              className="mt-1.5 rounded-2xl font-mono text-xs"
            />
          </div>
          <div>
            <label htmlFor="ai-key" className="text-sm font-medium">API Key</label>
            <Input
              id="ai-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={getAiConfig() ? "已保存（输入可覆盖）" : "粘贴你的 API Key"}
              className="mt-1.5 rounded-2xl font-mono text-xs"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="ai-model" className="text-sm font-medium">模型名</label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={AI_DEFAULTS.model}
              className="mt-1.5 rounded-2xl font-mono text-xs"
            />
          </div>
          <div className="space-y-1 rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            <p>· Key 仅保存在本机浏览器，不上传云端；请求从你的浏览器直接发往 AI 服务</p>
            <p>
              · 浏览器直连实测：DeepSeek / 硅基流动 / OpenRouter 可用；智谱需在中转服务后使用（preflight 不带 CORS 头）
            </p>
            <p>· 若保存后仍报网络错误，可换上表支持的服务，或填自己的中转地址</p>
            <p>· AI 生成的内容可能不准确，请和孩子一起核实后再留用</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl">
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()} className="rounded-2xl">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 「我的」页 AI 助手卡片：展示配置状态，点「配置」弹出设置 */
export function AiSettingsCard() {
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState<AiConfig | null>(null);

  useEffect(() => {
    setConfigured(getAiConfig());
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">✨ AI 助手</h2>
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              AI 写知识卡 · 润色日记
              {configured && (
                <Badge variant="secondary" className="ml-2 rounded-full text-[10px] font-normal">
                  {configured.model}
                </Badge>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              可选增强：{configured ? "已配置，去日记页试试" : "未配置，不填 Key 一切功能照常"}
            </p>
          </div>
          <Button size="sm" variant="secondary" className="shrink-0 rounded-xl" onClick={() => setOpen(true)}>
            {configured ? "修改" : "配置"}
          </Button>
        </div>
      </GlassCard>
      <AiConfigDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfigured(getAiConfig()); }} />
    </section>
  );
}
