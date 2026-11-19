"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 旧版 /diary 页 → /archive?tab=diary（知识卡片 ?tab=knowledge 亦保留），保住已发出的旧链接 */
export default function DiaryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    const target = param === "knowledge" ? "/archive?tab=knowledge" : "/archive?tab=diary";
    router.replace(target);
  }, [router]);

  return (
    <div className="glass flex h-[50dvh] items-center justify-center rounded-3xl">
      <p className="animate-pulse text-sm text-muted-foreground">日记已搬进「足迹」，正在跳转……</p>
    </div>
  );
}
