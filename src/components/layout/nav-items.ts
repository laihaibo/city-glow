import { Footprints, Map, UserRound, type LucideIcon } from "lucide-react";

/** 三个主导航出口，底部导航与桌面导航共用 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 中间主出口（首页=地图）：底栏放大凸起显示 */
  center?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/archive", label: "足迹", icon: Footprints },
  { href: "/", label: "首页", icon: Map, center: true },
  { href: "/profile", label: "我的", icon: UserRound },
];

/** 判断当前路径是否处于该导航项（首页要求精确匹配，其余前缀匹配） */
export function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
