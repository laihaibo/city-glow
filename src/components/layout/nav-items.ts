import { Home, Map, NotebookPen, Route, UserRound, type LucideIcon } from "lucide-react";

/** 五个主导航出口，底部导航与桌面导航共用 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "首页", icon: Home },
  { href: "/map", label: "地图", icon: Map },
  { href: "/diary", label: "日记", icon: NotebookPen },
  { href: "/plan", label: "计划", icon: Route },
  { href: "/profile", label: "我的", icon: UserRound },
];

/** 判断当前路径是否处于该导航项（首页要求精确匹配，其余前缀匹配） */
export function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
