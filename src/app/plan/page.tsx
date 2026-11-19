"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 旧版 /plan 页 → /archive?tab=plan，保住已发出的旧链接 */
export default function PlanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/archive?tab=plan");
  }, [router]);

  return (
    <div className="glass flex h-[50dvh] items-center justify-center rounded-3xl">
      <p className="animate-pulse text-sm text-muted-foreground">计划已搬进「足迹」，正在跳转……</p>
    </div>
  );
}
