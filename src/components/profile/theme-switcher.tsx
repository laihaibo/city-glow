"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "cn";

const OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;

/**
 * 主题切换（浅色 / 深色 / 跟随系统），对应 settings.theme。
 * 真正持久化到 localStorage 的 cityGlow.settings 在 Phase 2 接入，
 * 当前先由 next-themes 独立管理，行为一致。
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes 需要挂载后再读主题，避免 SSR 水合不一致
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 rounded-2xl bg-muted/50" aria-hidden />;
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-muted/50 p-1.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
