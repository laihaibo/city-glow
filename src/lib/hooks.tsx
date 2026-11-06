"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Achievements,
  CityGlowData,
  ExplorationRecord,
  KnowledgeCard,
  Street,
} from "@/lib/types";
import {
  loadAllData,
  saveAchievements,
  saveKnowledge,
  saveRecords,
  saveSettings,
  saveStreets,
} from "@/lib/storage";
import { evaluateAchievements } from "@/lib/achievements";

export interface NewlyUnlocked {
  id: string;
  name: string;
  description: string;
}

interface CityGlowContextValue {
  /** null 表示尚未完成客户端装载（首次渲染骨架时用） */
  ready: boolean;
  data: CityGlowData | null;
  updateStreets: (streets: Street[]) => void;
  updateRecords: (records: ExplorationRecord[]) => void;
  updateKnowledge: (knowledge: KnowledgeCard[]) => void;
  updateSettings: (patch: Partial<CityGlowData["settings"]>) => void;
  /** 新解锁徽章队列（庆祝浮层逐个消费） */
  newlyUnlocked: NewlyUnlocked[];
  popCelebration: () => void;
}

const CityGlowContext = createContext<CityGlowContextValue | null>(null);

/**
 * 全站数据源 Provider：根布局挂载一次，所有页面共享同一份状态。
 * 每次数据变更自动重算成就，新解锁徽章进入庆祝队列。
 */
export function CityGlowProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CityGlowData | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlocked[]>([]);
  const firstLoad = useRef(true);

  const recomputeAchievements = useCallback((next: CityGlowData): CityGlowData => {
    const result = evaluateAchievements(next);
    const knownIds = new Set(next.achievements.unlocked.map((u) => u.id));
    const fresh = result.unlockedIds.filter((id) => !knownIds.has(id));

    const achievements: Achievements = {
      unlocked: [
        ...next.achievements.unlocked,
        ...fresh.map((id) => ({ id, unlockedAt: new Date().toISOString() })),
      ],
      stats: result.stats,
    };

    // 首次装载只回填记录不弹庆祝，避免老用户首开连弹历史徽章
    if (fresh.length > 0 && !firstLoad.current) {
      const freshBadges = result.badges.filter((b) => fresh.includes(b.id));
      setNewlyUnlocked((queue) => [
        ...queue,
        ...freshBadges.map((b) => ({ id: b.id, name: b.name, description: b.description })),
      ]);
    }
    if (
      fresh.length > 0 ||
      JSON.stringify(result.stats) !== JSON.stringify(next.achievements.stats)
    ) {
      saveAchievements(achievements);
    }
    return { ...next, achievements };
  }, []);

  // 挂载后装载本地数据（SSR 安全：仅在客户端 effect 中执行）
  useEffect(() => {
    setData(recomputeAchievements(loadAllData()));
    firstLoad.current = false;
  }, [recomputeAchievements]);

  const updateStreets = useCallback(
    (streets: Street[]) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = recomputeAchievements({ ...prev, streets });
        saveStreets(next.streets);
        saveAchievements(next.achievements);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const updateRecords = useCallback(
    (records: ExplorationRecord[]) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = recomputeAchievements({ ...prev, records });
        saveRecords(next.records);
        saveAchievements(next.achievements);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const updateKnowledge = useCallback(
    (knowledge: KnowledgeCard[]) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = recomputeAchievements({ ...prev, knowledge });
        saveKnowledge(next.knowledge);
        saveAchievements(next.achievements);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const updateSettings = useCallback(
    (patch: Partial<CityGlowData["settings"]>) => {
      setData((prev) => {
        if (!prev) return prev;
        const settings = { ...prev.settings, ...patch };
        saveSettings(settings);
        return { ...prev, settings };
      });
    },
    [],
  );

  const popCelebration = useCallback(() => {
    setNewlyUnlocked((queue) => queue.slice(1));
  }, []);

  return (
    <CityGlowContext.Provider
      value={{
        ready: data !== null,
        data,
        updateStreets,
        updateRecords,
        updateKnowledge,
        updateSettings,
        newlyUnlocked,
        popCelebration,
      }}
    >
      {children}
    </CityGlowContext.Provider>
  );
}

/** 页面组件获取共享数据的唯一入口 */
export function useCityGlow(): CityGlowContextValue {
  const ctx = useContext(CityGlowContext);
  if (!ctx) {
    throw new Error("useCityGlow 必须在 <CityGlowProvider> 内使用");
  }
  return ctx;
}
