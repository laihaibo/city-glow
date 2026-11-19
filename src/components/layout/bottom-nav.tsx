"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { isNavItemActive, NAV_ITEMS } from "@/components/layout/nav-items";

/**
 * 移动端底部三标签导航：液态玻璃底栏 + ≥44px 触摸目标 + iOS safe-area 留白。
 * 中间「首页」（地图）放大凸起，是应用的主出口。
 * 桌面端（≥lg）隐藏，由 DesktopNav 接管。
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="mx-auto w-full max-w-3xl px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="glass-strong grid grid-cols-3 items-end rounded-3xl px-1.5 py-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, center }) => {
            const active = isNavItemActive(pathname, href);
            if (center) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mt-9 flex min-h-[56px] flex-col items-center justify-start gap-1 px-1",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform duration-200",
                      "bg-gradient-to-br from-primary to-chart-2",
                      active ? "scale-100" : "scale-95",
                    )}
                  >
                    <Icon className="size-6" strokeWidth={2.2} aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground active:bg-muted/70",
                )}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
