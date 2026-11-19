"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 旧版 /map 页 → 首页（首页现在直接是地图），保住已发出的旧链接 */
export default function MapRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="glass flex h-[50dvh] items-center justify-center rounded-3xl">
      <p className="animate-pulse text-sm text-muted-foreground">地图已在首页，正在跳转……</p>
    </div>
  );
}
