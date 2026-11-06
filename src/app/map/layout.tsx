import type { Metadata } from "next";

export const metadata: Metadata = { title: "足迹地图" };

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
