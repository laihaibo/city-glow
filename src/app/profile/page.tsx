import type { Metadata } from "next";
import {
  Download,
  Lock,
  MapPin,
  Settings2,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/profile/theme-switcher";

export const metadata: Metadata = { title: "我的" };

/** 成就墙占位徽章，Phase 3 接入真实解锁逻辑 */
const DEMO_ACHIEVEMENTS = [
  { name: "老城 50 巷", desc: "走完老城区 50 条街巷" },
  { name: "百巷达人", desc: "累计走过 100 条街巷" },
  { name: "东区工业通", desc: "探索东区工业片区" },
  { name: "黄泛寻迹者", desc: "收集 10 张地理变迁卡片" },
];

/** 数据管理入口，Phase 5 开放导入导出与清空 */
const DATA_ACTIONS = [
  { icon: Download, label: "导出 JSON 备份", hint: "Phase 5 开放" },
  { icon: Upload, label: "导入备份恢复", hint: "Phase 5 开放" },
  { icon: Trash2, label: "清空所有数据", hint: "Phase 5 开放", danger: true },
];

export default function ProfilePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">我的</h1>

      {/* 城市档案卡 */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">徐州</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              家的位置：市中心 · 34.26, 117.19
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs">
            Phase 2 可编辑
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 text-center">
          <div>
            <p className="font-mono text-lg font-bold tabular-nums">128</p>
            <p className="mt-0.5 text-xs text-muted-foreground">街巷</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold tabular-nums">21</p>
            <p className="mt-0.5 text-xs text-muted-foreground">日记</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold tabular-nums">14</p>
            <p className="mt-0.5 text-xs text-muted-foreground">知识卡</p>
          </div>
        </div>
      </GlassCard>

      {/* 外观设置 */}
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
          <Badge variant="secondary" className="rounded-full text-xs">
            Phase 3 解锁
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_ACHIEVEMENTS.map(({ name, desc }) => (
            <GlassCard key={name} className="p-4 text-center opacity-70">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Lock className="size-4.5" aria-hidden />
              </span>
              <p className="mt-2.5 text-sm font-semibold">{name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 数据管理 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">数据管理</h2>
        <GlassCard className="p-2">
          {DATA_ACTIONS.map(({ icon: Icon, label, hint, danger }, index) => (
            <div key={label}>
              {index > 0 && <Separator className="opacity-60" />}
              <button
                type="button"
                disabled
                className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}
              >
                <Icon className="size-4.5" aria-hidden />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            </div>
          ))}
        </GlassCard>
        <p className="text-center text-xs text-muted-foreground">
          所有数据仅存于浏览器本地（localStorage），不上传任何云端 · 数据占用 -- KB
        </p>
      </section>
    </div>
  );
}
