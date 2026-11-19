"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Achievements,
  CityGlowData,
  CityInfo,
  ExplorationRecord,
  KnowledgeCard,
  Street,
} from "@/lib/types";
import { nanoid } from "nanoid";
import { loadAllData, saveAllData } from "@/lib/storage";
import { evaluateAchievements } from "@/lib/achievements";

export interface NewlyUnlocked {
  id: string;
  name: string;
  description: string;
}

/** 当前城市的分片视图：页面渲染与编辑应使用这一份数据 */
export interface CityScopedData {
  streets: Street[];
  records: ExplorationRecord[];
  knowledge: KnowledgeCard[];
}

interface CityGlowContextValue {
  /** null 表示尚未完成客户端装载（首次渲染骨架时用） */
  ready: boolean;
  /** 全量数据（含所有城市）——备份导出、跨城市统计用 */
  data: CityGlowData | null;
  /** 当前激活城市的分片视图——页面渲染/编辑入口 */
  cityData: CityScopedData | null;
  /** 当前激活城市档案（cities 里找不到时兜底第一个城市） */
  activeCity: CityInfo | null;
  updateStreets: (streets: Street[]) => void;
  updateRecords: (records: ExplorationRecord[]) => void;
  updateKnowledge: (knowledge: KnowledgeCard[]) => void;
  updateSettings: (patch: Partial<CityGlowData["settings"]>) => void;
  /** 切换当前城市 */
  setActiveCity: (id: string) => void;
  /** 添加城市（自动设为当前城市，方便立刻去画街巷） */
  addCity: (input: { name: string; homeLocation: CityInfo["homeLocation"] }) => CityInfo;
  /** 修改城市名 */
  renameCity: (id: string, name: string) => void;
  /** 删除城市（级联删除该城市的街巷/日记/知识卡；至少保留一个城市） */
  removeCity: (id: string) => void;
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
      saveAllData({ ...next, achievements });
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
        // 入参语义：当前城市的完整街巷列表。绑定 cityId 并替换该城市子集，其他城市数据原样保留
        const cityId = prev.settings.activeCityId;
        const scoped = streets.map((s) => ({ ...s, cityId }));
        const next = recomputeAchievements({
          ...prev,
          streets: [...scoped, ...prev.streets.filter((s) => s.cityId !== cityId)],
        });
        saveAllData(next);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const updateRecords = useCallback(
    (records: ExplorationRecord[]) => {
      setData((prev) => {
        if (!prev) return prev;
        const cityId = prev.settings.activeCityId;
        const scoped = records.map((r) => ({ ...r, cityId }));
        const next = recomputeAchievements({
          ...prev,
          records: [...scoped, ...prev.records.filter((r) => r.cityId !== cityId)],
        });
        saveAllData(next);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const updateKnowledge = useCallback(
    (knowledge: KnowledgeCard[]) => {
      setData((prev) => {
        if (!prev) return prev;
        const cityId = prev.settings.activeCityId;
        const scoped = knowledge.map((k) => ({ ...k, cityId }));
        const next = recomputeAchievements({
          ...prev,
          knowledge: [...scoped, ...prev.knowledge.filter((k) => k.cityId !== cityId)],
        });
        saveAllData(next);
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
        saveAllData({ ...prev, settings });
        return { ...prev, settings };
      });
    },
    [],
  );

  /* ---- 多城市档案管理 ---- */

  const setActiveCity = useCallback((id: string) => {
    updateSettings({ activeCityId: id });
  }, [updateSettings]);

  const addCity = useCallback(
    (input: { name: string; homeLocation: CityInfo["homeLocation"] }): CityInfo => {
      const city: CityInfo = {
        id: nanoid(10),
        name: input.name.trim(),
        homeLocation: input.homeLocation,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => {
        if (!prev) return prev;
        // 新城市自动设为当前城市，方便立刻去画街巷
        const settings = {
          ...prev.settings,
          cities: [...prev.settings.cities, city],
          activeCityId: city.id,
        };
        saveAllData({ ...prev, settings });
        return { ...prev, settings };
      });
      return city;
    },
    [],
  );

  const renameCity = useCallback((id: string, name: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const trimmed = name.trim();
      if (!trimmed) return prev;
        const settings = {
          ...prev.settings,
          cities: prev.settings.cities.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
        };
        saveAllData({ ...prev, settings });
        return { ...prev, settings };
    });
  }, []);

  const removeCity = useCallback(
    (id: string) => {
      setData((prev) => {
        if (!prev) return prev;
        if (prev.settings.cities.length <= 1) return prev; // 至少保留一个城市
        const cities = prev.settings.cities.filter((c) => c.id !== id);
        const settings = {
          ...prev.settings,
          cities,
          activeCityId:
            prev.settings.activeCityId === id ? cities[0].id : prev.settings.activeCityId,
        };
        const streets = prev.streets.filter((s) => s.cityId !== id);
        const records = prev.records.filter((r) => r.cityId !== id);
        const knowledge = prev.knowledge.filter((k) => k.cityId !== id);
        const next = recomputeAchievements({ ...prev, settings, streets, records, knowledge });
        saveAllData(next);
        return next;
      });
    },
    [recomputeAchievements],
  );

  const popCelebration = useCallback(() => {
    setNewlyUnlocked((queue) => queue.slice(1));
  }, []);

  const activeCity = useMemo(() => {
    if (!data) return null;
    const { cities, activeCityId } = data.settings;
    return cities.find((c) => c.id === activeCityId) ?? cities[0] ?? null;
  }, [data]);

  const cityData = useMemo<CityScopedData | null>(() => {
    if (!data || !activeCity) return null;
    return {
      streets: data.streets.filter((s) => s.cityId === activeCity.id),
      records: data.records.filter((r) => r.cityId === activeCity.id),
      knowledge: data.knowledge.filter((k) => k.cityId === activeCity.id),
    };
  }, [data, activeCity]);

  return (
    <CityGlowContext.Provider
      value={{
        ready: data !== null,
        data,
        cityData,
        activeCity,
        updateStreets,
        updateRecords,
        updateKnowledge,
        updateSettings,
        setActiveCity,
        addCity,
        renameCity,
        removeCity,
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
