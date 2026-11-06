import * as React from "react";
import { cn } from "cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 使用更强的玻璃层（底栏 / 浮层级别），默认为普通卡片强度 */
  strong?: boolean;
}

/**
 * 液态玻璃卡片：全站卡片的基础容器。
 * 强度由 CSS 变量 --glass-blur / --glass-opacity 全局控制。
 */
export function GlassCard({ className, strong = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-3xl text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}
