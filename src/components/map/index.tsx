"use client";

import dynamic from "next/dynamic";

/** 静态导出下 leaflet 只能在客户端加载，用 dynamic 包装并带玻璃骨架 */
export const CityMapDynamic = dynamic(() => import("./city-map"), {
  ssr: false,
  loading: () => (
    <div className="glass flex h-full w-full items-center justify-center rounded-3xl">
      <p className="animate-pulse text-sm text-muted-foreground">地图加载中……</p>
    </div>
  ),
});
