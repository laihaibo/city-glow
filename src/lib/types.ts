/**
 * City Glow 数据模型（localStorage Schema）
 *
 * 所有数据按 key 分片存储：
 *   cityGlow.settings / cityGlow.streets / cityGlow.records /
 *   cityGlow.knowledge / cityGlow.achievements
 * 读写统一走 src/lib/storage.ts，禁止组件直接访问 localStorage。
 *
 * schemaVersion 用于跨年升级时的字段迁移——这是让数据能用十年的保险。
 */

export const SCHEMA_VERSION = 1;

export interface CityGlowSettings {
  schemaVersion: number;
  /** 默认城市，如"徐州" */
  cityName: string;
  theme: "light" | "dark" | "auto";
  /** 家的位置，地图初始中心点 */
  homeLocation: { lat: number; lng: number };
}

export type StreetStatus = "done" | "doing" | "todo";

export type StreetPriority = "high" | "medium" | "low";
export type StreetDifficulty = "easy" | "medium" | "hard";

export interface Street {
  id: string;
  /** 如"中山路" */
  name: string;
  /** 如"海曙老城 / 江北外滩 / 鄞州中心 / 东部新城" */
  region: string;
  /** [lat, lng] 路径点序列，绘制时沿路径点击生成 */
  path: [number, number][];
  status: StreetStatus;
  lengthKm: number;
  /** 最近一次走过的日期（ISO 8601） */
  lastWalkedAt?: string;
  notes?: string;
  /** 待走池优先级（Phase 4 路线规划用） */
  priority?: StreetPriority;
  /** 难度（孩子体力 / 距离考量） */
  difficulty?: StreetDifficulty;
}

export interface ExplorationRecord {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 同行人，如 ["爸爸", "女儿"] */
  companions: string[];
  /** 本次走过的街巷 ID */
  streetIds: string[];
  /** 见闻心得，简易 Markdown */
  insights: string;
  /** 心情 emoji */
  mood: string;
  /** base64 照片（注意体积，后续可换 IndexedDB） */
  photos?: string[];
}

export type KnowledgeCategory =
  | "story" // 街巷故事
  | "district" // 商圈对比
  | "geology" // 地理变迁
  | "zone" // 分区认知
  | "relic" // 文物古迹
  | "other";

export interface KnowledgeCard {
  id: string;
  /** 关联街巷，可选 */
  streetId?: string;
  title: string;
  /** 正文 Markdown */
  content: string;
  category: KnowledgeCategory;
  createdAt: string;
}

export interface AchievementStats {
  totalStreets: number;
  totalKm: number;
  regionsCovered: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface Achievements {
  unlocked: UnlockedAchievement[];
  stats: AchievementStats;
}

export interface CityGlowData {
  settings: CityGlowSettings;
  streets: Street[];
  records: ExplorationRecord[];
  knowledge: KnowledgeCard[];
  achievements: Achievements;
}

/** 首次使用时的默认数据 */
export const DEFAULT_DATA: CityGlowData = {
  settings: {
    schemaVersion: SCHEMA_VERSION,
    cityName: "宁波",
    theme: "auto",
    homeLocation: { lat: 29.8712, lng: 121.5458 },
  },
  streets: [],
  records: [],
  knowledge: [],
  achievements: {
    unlocked: [],
    stats: { totalStreets: 0, totalKm: 0, regionsCovered: 0 },
  },
};
