import type { CityGlowData } from "@/lib/types";

/**
 * 成就系统：按数量 / 区域 / 内容三条线的徽章体系。
 * evaluate 纯函数——给定数据返回当前应解锁的徽章与最新统计，供 hook 与成就墙复用。
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** 徽章分组，成就墙按此排布 */
  group: "数量" | "区域" | "内容";
  /** 图标 emoji，配合糖果玻璃卡片展示 */
  emoji: string;
  /** 判断是否达成（传入派生统计） */
  check: (s: BadgeStats) => boolean;
  /** 进度展示（成就墙灰态显示 x/y） */
  progress?: (s: BadgeStats) => { current: number; target: number };
}

export interface BadgeStats {
  doneStreets: number;
  totalStreets: number;
  totalKm: number;
  regionsCovered: number;
  /** 单区域内已走街巷数，区域通用 */
  perRegionDone: Record<string, number>;
  /** 数据中登记过的全部区域（含未走），全域点亮判定用 */
  allRegions: string[];
  explorationCount: number;
  knowledgeCount: number;
  relicCount: number;
  yearStreets: number;
  yearRecords: number;
}

export function deriveStats(data: CityGlowData): BadgeStats {
  const done = data.streets.filter((s) => s.status === "done");
  const perRegionDone: Record<string, number> = {};
  for (const s of done) {
    perRegionDone[s.region] = (perRegionDone[s.region] ?? 0) + 1;
  }
  const year = new Date().getFullYear().toString();

  return {
    doneStreets: done.length,
    totalStreets: data.streets.length,
    totalKm: done.reduce((sum, s) => sum + s.lengthKm, 0),
    regionsCovered: Object.keys(perRegionDone).length,
    perRegionDone,
    allRegions: [...new Set(data.streets.map((s) => s.region))],
    explorationCount: data.records.length,
    knowledgeCount: data.knowledge.length,
    relicCount: data.knowledge.filter((k) => k.category === "relic").length,
    yearStreets: done.filter((s) => (s.lastWalkedAt ?? "").startsWith(year)).length,
    yearRecords: data.records.filter((r) => r.date.startsWith(year)).length,
  };
}

export const BADGES: Badge[] = [
  // ---- 数量线 ----
  {
    id: "first-street",
    name: "第一缕光",
    description: "点亮第一条街巷",
    group: "数量",
    emoji: "💡",
    check: (s) => s.doneStreets >= 1,
    progress: (s) => ({ current: s.doneStreets, target: 1 }),
  },
  {
    id: "ten-streets",
    name: "十巷新旅",
    description: "累计走过 10 条街巷",
    group: "数量",
    emoji: "🚶",
    check: (s) => s.doneStreets >= 10,
    progress: (s) => ({ current: s.doneStreets, target: 10 }),
  },
  {
    id: "fifty-streets",
    name: "老海曙 50 巷",
    description: "累计走过 50 条街巷",
    group: "数量",
    emoji: "🏮",
    check: (s) => s.doneStreets >= 50,
    progress: (s) => ({ current: s.doneStreets, target: 50 }),
  },
  {
    id: "hundred-streets",
    name: "百巷达人",
    description: "累计走过 100 条街巷",
    group: "数量",
    emoji: "🏆",
    check: (s) => s.doneStreets >= 100,
    progress: (s) => ({ current: s.doneStreets, target: 100 }),
  },
  {
    id: "five-hundred-streets",
    name: "千巷传奇·序章",
    description: "累计走过 500 条街巷",
    group: "数量",
    emoji: "🌟",
    check: (s) => s.doneStreets >= 500,
    progress: (s) => ({ current: s.doneStreets, target: 500 }),
  },
  // ---- 里程线 ----
  {
    id: "km-10",
    name: "小小脚步",
    description: "累计步行 10 km",
    group: "数量",
    emoji: "👟",
    check: (s) => s.totalKm >= 10,
    progress: (s) => ({ current: Math.floor(s.totalKm), target: 10 }),
  },
  {
    id: "km-50",
    name: "半马征途",
    description: "累计步行 50 km",
    group: "数量",
    emoji: "🏃",
    check: (s) => s.totalKm >= 50,
    progress: (s) => ({ current: Math.floor(s.totalKm), target: 50 }),
  },
  {
    id: "km-100",
    name: "百里串城",
    description: "累计步行 100 km",
    group: "数量",
    emoji: "🧭",
    check: (s) => s.totalKm >= 100,
    progress: (s) => ({ current: Math.floor(s.totalKm), target: 100 }),
  },
  // ---- 区域线 ----
  {
    id: "region-master",
    name: "区域通",
    description: "单一区域走过 30 条街巷",
    group: "区域",
    emoji: "🗺️",
    check: (s) => Object.values(s.perRegionDone).some((n) => n >= 30),
    progress: (s) => {
      const max = Math.max(0, ...Object.values(s.perRegionDone));
      return { current: max, target: 30 };
    },
  },
  {
    id: "all-regions",
    name: "全域点亮",
    description: "每个登记过的区域都有走过的街巷",
    group: "区域",
    emoji: "🌈",
    check: (s) => {
      if (s.allRegions.length === 0) return false;
      return s.allRegions.every((r) => (s.perRegionDone[r] ?? 0) > 0);
    },
    progress: (s) => {
      const lit = s.allRegions.filter((r) => (s.perRegionDone[r] ?? 0) > 0).length;
      return { current: lit, target: Math.max(1, s.allRegions.length) };
    },
  },
  // ---- 出行次数 ----
  {
    id: "trips-10",
    name: "十次出发",
    description: "写下 10 篇探索日记",
    group: "数量",
    emoji: "🎈",
    check: (s) => s.explorationCount >= 10,
    progress: (s) => ({ current: s.explorationCount, target: 10 }),
  },
  {
    id: "trips-50",
    name: "风雨无阻",
    description: "写下 50 篇探索日记",
    group: "数量",
    emoji: "☀️",
    check: (s) => s.explorationCount >= 50,
    progress: (s) => ({ current: s.explorationCount, target: 50 }),
  },
  // ---- 内容线 ----
  {
    id: "knowledge-10",
    name: "知识收藏家",
    description: "收藏 10 张知识卡片",
    group: "内容",
    emoji: "📚",
    check: (s) => s.knowledgeCount >= 10,
    progress: (s) => ({ current: s.knowledgeCount, target: 10 }),
  },
  {
    id: "knowledge-50",
    name: "城市百科",
    description: "收藏 50 张知识卡片",
    group: "内容",
    emoji: "🎓",
    check: (s) => s.knowledgeCount >= 50,
    progress: (s) => ({ current: s.knowledgeCount, target: 50 }),
  },
  {
    id: "archaeologist",
    name: "书藏古今·考古学家",
    description: "收集 5 张文物古迹卡片",
    group: "内容",
    emoji: "🏺",
    check: (s) => s.relicCount >= 5,
    progress: (s) => ({ current: s.relicCount, target: 5 }),
  },
];

export interface EvaluateResult {
  badges: Badge[];
  unlockedIds: string[];
  stats: CityGlowData["achievements"]["stats"];
}

/** 评估当前数据：返回徽章全集、已达成 id 与成就墙统计 */
export function evaluateAchievements(data: CityGlowData): EvaluateResult {
  const stats = deriveStats(data);
  const unlockedIds = BADGES.filter((b) => b.check(stats)).map((b) => b.id);
  return {
    badges: BADGES,
    unlockedIds,
    stats: {
      totalStreets: stats.totalStreets,
      totalKm: Math.round(stats.totalKm * 10) / 10,
      regionsCovered: stats.regionsCovered,
    },
  };
}
