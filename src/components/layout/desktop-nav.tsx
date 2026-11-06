"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "cn";
import { isNavItemActive, NAV_ITEMS } from "@/components/layout/nav-items";

/** 桌面端顶部导航（≥lg 显示），居中 max-w-3xl 与内容容器对齐 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden lg:block">
      <div className="glass-strong mx-auto mt-4 flex w-full max-w-3xl items-center justify-between rounded-3xl px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          City Glow
          <span className="text-sm font-normal text-muted-foreground">点亮城市</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
