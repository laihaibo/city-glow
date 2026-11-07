"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getTiandituKey,
  saveTiandituKey,
  subscribeTiandituKey,
} from "@/lib/storage";

/**
 * 天地图 Key 的响应式读取（SSR 安全：挂载后再读 localStorage）。
 * 保存后通过 storage 层的订阅即时通知本页面所有 hook 实例，
 * 地图瓦片与引导卡随之重渲染，无需刷新页面。
 */
export function useTiandituKey() {
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(getTiandituKey());
    return subscribeTiandituKey(() => setKey(getTiandituKey()));
  }, []);

  const saveKey = useCallback((next: string) => {
    saveTiandituKey(next);
  }, []);

  return { key, saveKey };
}
