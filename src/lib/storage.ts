import type { CityGlowData, CityGlowStore, CityInfo } from "@/lib/types";
import { DEFAULT_DATA, LEGACY_CITY_ID, SCHEMA_VERSION } from "@/lib/types";

/**
 * localStorage 读写统一入口。
 *
 * 规则：
 * - v3 起全部业务数据合并存于单一 key `cityGlow-store`（CityGlowStore），
 *   备份 JSON 的 data 字段与线上数据完全同构；每次保存全量重写。
 * - 只允许在 "use client" 组件的 effect / 事件回调中调用（SSR 无 window）；
 * - JSON 解析一律容错：损坏数据回退为默认值，绝不让一次脏读毁掉十年积累；
 * - schemaVersion 迁移在此收口：v1/v2 的 5 分片数据首次读取时自动合并升级并清除旧 key。
 */

/** v3 单 key 存储 */
const STORE_KEY = "cityGlow-store";

/** v1/v2 时代的分片 key（迁移完成后清除） */
export const LEGACY_STORAGE_KEYS = {
  settings: "cityGlow.settings",
  streets: "cityGlow.streets",
  records: "cityGlow.records",
  knowledge: "cityGlow.knowledge",
  achievements: "cityGlow.achievements",
} as const;

/**
 * 外部服务 Key 的独立分片：不属于主数据，不进备份、不随清空重置。
 * 换设备后需重新填写（备份文件刻意不含 Key，避免扩散）。
 */
export const TIANDITU_KEY_STORAGE = "cityGlow.tiandituKey";
export const AI_STORAGE = "cityGlow.ai";

/** SSR / 首次渲染前不存在 localStorage */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** 读取原始 key 的字符串值；解析失败或不存在时返回 null，绝不抛异常 */
function readRaw(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 写入原始值；隐私模式下写入失败静默降级 */
function writeRaw(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // 存储满 / 隐私模式：暂不中断用户操作，导出功能兜底
  }
}

function removeRaw(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    const existed = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    return existed;
  } catch {
    return false;
  }
}

/** 泛型读取：解析失败或结构不符时返回 null */
function readJson(key: string, validate: (value: unknown) => boolean): unknown | null {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/* ---------- 读取与迁移 ---------- */

/**
 * 读取全部数据。
 * 优先读 v3 单 key；不存在时尝试 v1/v2 分片并自动升级：
 * 合并写入 `cityGlow-store` 后清除旧 key（幂等，可安全重复执行）。
 */
export function loadAllData(): CityGlowData {
  // 1) v3 单 key
  const rawStore = readJson(STORE_KEY, isPlainObject);
  if (isPlainObject(rawStore) && "settings" in rawStore) {
    const store = rawStore as unknown as Partial<CityGlowStore>;
    const data = migrateData(pickData(store));
    const cleanedLegacy = cleanupLegacyKeys();
    if (store.schemaVersion !== SCHEMA_VERSION || cleanedLegacy) {
      saveAllData(data);
    }
    return data;
  }

  // 2) v1/v2 分片 → 合并升级
  const legacy = readLegacyData();
  if (legacy) {
    const migrated = migrateData(legacy);
    saveAllData(migrated);
    cleanupLegacyKeys();
    return migrated;
  }

  // 3) 全新用户
  return DEFAULT_DATA;
}

/** 从（可能不完整的）store 对象提取业务数据，缺失字段用默认值补齐 */
function pickData(store: Partial<CityGlowStore>): CityGlowData {
  return {
    settings: isPlainObject(store.settings)
      ? (store.settings as unknown as CityGlowData["settings"])
      : DEFAULT_DATA.settings,
    streets: Array.isArray(store.streets) ? store.streets : [],
    records: Array.isArray(store.records) ? store.records : [],
    knowledge: Array.isArray(store.knowledge) ? store.knowledge : [],
    achievements:
      isPlainObject(store.achievements) &&
      "unlocked" in store.achievements &&
      "stats" in store.achievements
        ? (store.achievements as unknown as CityGlowData["achievements"])
        : DEFAULT_DATA.achievements,
  };
}

/** 读取 v1/v2 分片；五个 key 全部不存在时返回 null（全新用户） */
function readLegacyData(): CityGlowData | null {
  const keys = Object.values(LEGACY_STORAGE_KEYS);
  if (!keys.some((key) => readRaw(key) !== null)) return null;
  return {
    settings:
      (readJson(keys[0], (v) => isPlainObject(v) && ("cityName" in v || "cities" in v)) as
        | CityGlowData["settings"]
        | null) ?? DEFAULT_DATA.settings,
    streets: (readJson(keys[1], Array.isArray) as CityGlowData["streets"] | null) ?? [],
    records: (readJson(keys[2], Array.isArray) as CityGlowData["records"] | null) ?? [],
    knowledge: (readJson(keys[3], Array.isArray) as CityGlowData["knowledge"] | null) ?? [],
    achievements:
      (readJson(keys[4], (v) => isPlainObject(v) && "unlocked" in v && "stats" in v) as
        | CityGlowData["achievements"]
        | null) ?? DEFAULT_DATA.achievements,
  };
}

/** 清除旧分片 key；返回是否确实清除了内容（用于判断是否需要重写主 key） */
function cleanupLegacyKeys(): boolean {
  return Object.values(LEGACY_STORAGE_KEYS).reduce(
    (cleaned, key) => removeRaw(key) || cleaned,
    false,
  );
}

/**
 * 版本迁移：v1（cityName 单城市）→ v2（多城市）→ v3（单 key 存储）。
 * v3 的增量字段（Street.waypoints / KnowledgeCard.location）均为可选，
 * 旧数据直通即可，无需变换；这里只负责结构修复与 v1 升级。
 * 迁移必须保证旧数据字段不丢失（只增不删、改名留别名）。
 */
export function migrateData(data: CityGlowData): CityGlowData {
  const raw = data.settings as CityGlowData["settings"] & {
    cityName?: string;
    homeLocation?: { lat: number; lng: number };
    schemaVersion?: number;
  };
  if ("cityName" in raw || "homeLocation" in raw) {
    return migrateV1ToV2(data);
  }
  // v2 → v3：剥离寄存在 settings 里的 schemaVersion，其余原样保留
  const cities = Array.isArray(raw.cities) && raw.cities.length > 0 ? raw.cities : DEFAULT_DATA.settings.cities;
  return {
    ...data,
    settings: {
      cities,
      activeCityId:
        typeof raw.activeCityId === "string" && cities.some((c) => c.id === raw.activeCityId)
          ? raw.activeCityId
          : cities[0].id,
      theme: raw.theme ?? "auto",
    },
  };
}

/**
 * v1 → v2：单一城市设置（cityName/homeLocation）迁出为 cities[0]，
 * 全部街巷/日记/知识卡补 cityId。迁移 id 固定为 LEGACY_CITY_ID，重复执行幂等。
 */
function migrateV1ToV2(data: CityGlowData): CityGlowData {
  const legacy = data.settings as CityGlowData["settings"] & {
    cityName?: string;
    homeLocation?: { lat: number; lng: number };
  };
  const city: CityInfo = {
    id: LEGACY_CITY_ID,
    name: legacy.cityName?.trim() || "宁波",
    homeLocation: legacy.homeLocation ?? { lat: 29.8712, lng: 121.5458 },
    createdAt: new Date().toISOString(),
  };
  return {
    settings: {
      cities: [city],
      activeCityId: LEGACY_CITY_ID,
      theme: legacy.theme ?? "auto",
    },
    streets: data.streets.map((s) => ({ ...s, cityId: s.cityId ?? LEGACY_CITY_ID })),
    records: data.records.map((r) => ({ ...r, cityId: r.cityId ?? LEGACY_CITY_ID })),
    knowledge: data.knowledge.map((k) => ({ ...k, cityId: k.cityId ?? LEGACY_CITY_ID })),
    achievements: data.achievements,
  };
}

/* ---------- 写入（单 key 全量） ---------- */

/** 全量写回 `cityGlow-store`（导入恢复、每次数据变更共用） */
export function saveAllData(data: CityGlowData): void {
  const migrated = migrateData(data);
  const store: CityGlowStore = { schemaVersion: SCHEMA_VERSION, ...migrated };
  writeRaw(STORE_KEY, JSON.stringify(store));
}

/** 清空业务数据（保留城市档案），返回清空后的数据 */
export function clearAllData(): CityGlowData {
  const current = loadAllData();
  const fresh: CityGlowData = {
    ...DEFAULT_DATA,
    // 清空数据但保留城市列表与当前城市（城市是"档案"而非"内容"）
    settings: {
      ...DEFAULT_DATA.settings,
      cities: current.settings.cities,
      activeCityId: current.settings.activeCityId,
    },
  };
  saveAllData(fresh);
  return fresh;
}

/** 估算 localStorage 占用字节数（设置页展示"数据占用 X KB"） */
export function estimateStorageBytes(): number {
  if (!isBrowser()) return 0;
  const keys = [STORE_KEY, ...Object.values(LEGACY_STORAGE_KEYS)];
  let total = 0;
  for (const key of keys) {
    total += key.length + (readRaw(key)?.length ?? 0);
  }
  return total * 2; // UTF-16 每字符 2 字节
}

/* ---------- 外部服务 Key（独立于主数据，见 TIANDITU_KEY_STORAGE 注释） ---------- */

const tiandituKeyListeners = new Set<() => void>();

/** 订阅天地图 Key 变化（同页面内的保存即时通知所有消费者） */
export function subscribeTiandituKey(listener: () => void): () => void {
  tiandituKeyListeners.add(listener);
  return () => tiandituKeyListeners.delete(listener);
}

/** 读取天地图 API Key；未配置或全空白时返回空串 */
export function getTiandituKey(): string {
  return readRaw(TIANDITU_KEY_STORAGE)?.trim() ?? "";
}

/** 保存天地图 API Key（自动去首尾空白）并通知订阅者 */
export function saveTiandituKey(key: string): void {
  writeRaw(TIANDITU_KEY_STORAGE, key.trim());
  tiandituKeyListeners.forEach((listener) => listener());
}

/* ---------- AI 助手配置（可选增强，见 AI_STORAGE 注释） ---------- */

/** AI 服务配置：任意 OpenAI 兼容接口（智谱 / DeepSeek / 硅基流动 / OpenRouter…） */
export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * AI 配置默认值。经实测（2026-11）：DeepSeek / 硅基流动 / OpenRouter 的
 * preflight 带 CORS 头，支持浏览器直连；智谱 open.bigmodel.cn 的 preflight
 * 不返回 CORS 头，浏览器直连会失败，需改用中转地址。
 */
export const AI_DEFAULTS = {
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
} as const;

/** 读取 AI 配置；未配置或 apiKey 为空时返回 null */
export function getAiConfig(): AiConfig | null {
  const raw = readRaw(AI_STORAGE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    if (!parsed.apiKey?.trim()) return null;
    return {
      baseUrl: parsed.baseUrl?.trim() || AI_DEFAULTS.baseUrl,
      apiKey: parsed.apiKey.trim(),
      model: parsed.model?.trim() || AI_DEFAULTS.model,
    };
  } catch {
    return null;
  }
}

/** 保存 AI 配置（保留空字段走默认值） */
export function saveAiConfig(config: Partial<AiConfig>): void {
  writeRaw(AI_STORAGE, JSON.stringify(config));
}
