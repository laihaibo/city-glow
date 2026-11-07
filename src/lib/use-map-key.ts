"use client";

import { useCallback, useEffect, useState } from "react";
import { getTiandituKey, saveTiandituKey } from "@/lib/storage";

/**
 * 天地图 Key 的响应式读取（SSR 安全：挂载后再读 localStorage）。
 * 保存后立即更新状态，地图与引导卡随之重渲染，无需刷新页面。
 */
export function useTiandituKey() {
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(getTiandituKey());
  }, []);

  const saveKey = useCallback((next: string) => {
    saveTiandituKey(next);
    setKey(next.trim());
  }, []);

  return { key, saveKey };
}
