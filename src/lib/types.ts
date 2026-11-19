/**
 * City Glow 数据模型（localStorage Schema v3）
 *
 * v3 起全部数据合并存储在单一 key `cityGlow-store`（CityGlowStore），
 * 备份 JSON 的 data 字段与线上数据完全同构。
 * 读写统一走 src/lib/storage.ts，禁止组件直接访问 localStorage。
 *
 * schemaVersion 用于跨年升级时的字段迁移——这是让数据能用十年的保险。
 */

export const SCHEMA_VERSION = 3;

/** 城市档案：City Glow 支持多城市（常驻地 + 老家 + 旅行城市……） */
export interface CityInfo {
  id: string;
  /** 如"宁波""徐州" */
  name: string;
  /** 该城市的"家/市中心"，地图初始中心点 */
  homeLocation: { lat: number; lng: number };
  /** 加入日期（ISO 8601） */
  createdAt: string;
}

export interface CityGlowSettings {
  /** 城市列表（≥1），activeCityId 指向其中 */
  cities: CityInfo[];
  activeCityId: string;
  theme: "light" | "dark" | "auto";
}

export type StreetStatus = "done" | "doing" | "todo";

export type StreetPriority = "high" | "medium" | "low";
export type StreetDifficulty = "easy" | "medium" | "hard";

/**
 * 街巷关键点：起点 / 转弯点 / 终点的结构化记录。
 * 修路导致路径变化时，凭命名关键点 + 全量 path 坐标即可重新描画找回路。
 */
export type StreetWaypointKind = "start" | "turn" | "end";

export interface StreetWaypoint {
  id: string;
  kind: StreetWaypointKind;
  /** 自定义名称（如"鼓楼口"），可空 */
  name?: string;
  lat: number;
  lng: number;
}

export interface Street {
  id: string;
  /** 所属城市（CityInfo.id） */
  cityId: string;
  /** 如"中山路" */
  name: string;
  /** 如"海曙老城 / 江北外滩 / 鄞州中心 / 东部新城" */
  region: string;
  /** [lat, lng] 路径点序列，绘制时沿路径点击生成（全部坐标） */
  path: [number, number][];
  /** 关键点（起点/转弯点/终点），保存街巷时由 path 自动派生，可命名 */
  waypoints?: StreetWaypoint[];
  status: StreetStatus;
  lengthKm: number;
  /** 最近一次走过的日期（ISO 8601） */
  lastWalkedAt?: string;
  notes?: string;
  /** 待走池优先级（路线规划用） */
  priority?: StreetPriority;
  /** 难度（孩子体力 / 距离考量） */
  difficulty?: StreetDifficulty;
}

export interface ExplorationRecord {
  id: string;
  /** 所属城市（CityInfo.id） */
  cityId: string;
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
  /** base64 照片（注意体积，照片量大后应迁 IndexedDB） */
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
  /** 所属城市（CityInfo.id） */
  cityId: string;
  /** 关联街巷，可选 */
  streetId?: string;
  /** 自定义落点（不关联街巷时可指定），可选 */
  location?: { lat: number; lng: number };
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

/** 业务数据（备份 JSON 的 data 字段同此结构） */
export interface CityGlowData {
  settings: CityGlowSettings;
  streets: Street[];
  records: ExplorationRecord[];
  knowledge: KnowledgeCard[];
  achievements: Achievements;
}

/** localStorage `cityGlow-store` 单 key 的完整存储结构 */
export interface CityGlowStore extends CityGlowData {
  schemaVersion: number;
}

/**
 * 迁移固定城市 id：v1 的单一城市（宁波）迁移后挂在这个 id 上，保证幂等。
 */
export const LEGACY_CITY_ID = "city-legacy";

/** 首次使用时的默认数据 */
export const DEFAULT_DATA: CityGlowData = {
  settings: {
    cities: [
      {
        id: LEGACY_CITY_ID,
        name: "宁波",
        homeLocation: { lat: 29.8712, lng: 121.5458 },
        createdAt: "2026-11-06T00:00:00.000Z",
      },
    ],
    activeCityId: LEGACY_CITY_ID,
    theme: "auto",
  },
  streets: [],
  records: [],
  knowledge: [],
  achievements: {
    unlocked: [],
    stats: { totalStreets: 0, totalKm: 0, regionsCovered: 0 },
  },
};
