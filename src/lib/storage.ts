import type { CityGlowData, CityInfo } from "@/lib/types";
import { DEFAULT_DATA, LEGACY_CITY_ID, SCHEMA_VERSION } from "@/lib/types";

/**
 * localStorage 读写统一入口。
 *
 * 规则：
 * - 所有 key 以 cityGlow 为前缀，按数据分片独立存储；
 * - 只允许在 "use client" 组件的 effect / 事件回调中调用（SSR 无 window）；
 * - JSON 解析一律容错：损坏数据回退为默认值，绝不让一次脏读毁掉十年积累；
 * - schemaVersion 迁移在此收口。
 */

const PREFIX = "cityGlow";

export const STORAGE_KEYS = {
  settings: `${PREFIX}.settings`,
  streets: `${PREFIX}.streets`,
  records: `${PREFIX}.records`,
  knowledge: `${PREFIX}.knowledge`,
  achievements: `${PREFIX}.achievements`,
} as const;

/**
 * 外部服务 Key 的独立分片：不属于主数据，不进备份、不随清空重置。
 * 换设备后需重新填写（备份文件刻意不含 Key，避免扩散）。
 */
export const TIANDITU_KEY_STORAGE = `${PREFIX}.tiandituKey`;
export const AI_STORAGE = `${PREFIX}.ai`;

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
    // 存储满 / 隐私模式：暂不中断用户操作，Phase 5 的导出功能兜底
  }
}

/** 泛型分片读取：解析失败或结构不符时返回 fallback */
function readSlice<T>(key: string, validate: (value: unknown) => T | null, fallback: T): T {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * 读取全部数据（各分片缺失时用默认值补齐）。
 * 读取时自动执行版本迁移：检测到旧版本数据立即升级并落盘，
 * 保证 Context 装载的永远是最新结构。
 */
export function loadAllData(): CityGlowData {
  const settings = readSlice(
    STORAGE_KEYS.settings,
    (value) => (isSettings(value) ? value : null),
    DEFAULT_DATA.settings,
  );
  const streets = readSlice(
    STORAGE_KEYS.streets,
    (value) => (isStreetArray(value) ? value : null),
    DEFAULT_DATA.streets,
  );
  const records = readSlice(
    STORAGE_KEYS.records,
    (value) => (isRecordArray(value) ? value : null),
    DEFAULT_DATA.records,
  );
  const knowledge = readSlice(
    STORAGE_KEYS.knowledge,
    (signal) => (isKnowledgeArray(signal) ? signal : null),
    DEFAULT_DATA.knowledge,
  );
  const achievements = readSlice(
    STORAGE_KEYS.achievements,
    (value) => (isAchievements(value) ? value : null),
    DEFAULT_DATA.achievements,
  );
  const data: CityGlowData = { settings, streets, records, knowledge, achievements };
  const migrated = migrateData(data);
  if (migrated.settings.schemaVersion !== data.settings.schemaVersion) {
    // 版本升级：立即落盘，避免每次读取都重复迁移
    saveAllData(migrated);
  }
  return migrated;
}

function isSettings(value: unknown): value is CityGlowData["settings"] {
  // v1（cityName）与 v2（cities/activeCityId）都放行，统一交给 migrateData 处理
  return (
    typeof value === "object" &&
    value !== null &&
    ("cityName" in value || ("cities" in value && "activeCityId" in value))
  );
}

function isStreetArray(value: unknown): value is CityGlowData["streets"] {
  return Array.isArray(value);
}

function isRecordArray(value: unknown): value is CityGlowData["records"] {
  return Array.isArray(value);
}

function isKnowledgeArray(value: unknown): value is CityGlowData["knowledge"] {
  return Array.isArray(value);
}

function isAchievements(value: unknown): value is CityGlowData["achievements"] {
  return (
    typeof value === "object" &&
    value !== null &&
    "unlocked" in value &&
    "stats" in value
  );
}

/**
 * 版本迁移：schemaVersion < SCHEMA_VERSION 时逐级升级数据结构。
 * 从 Phase 2 起每次数据结构变更都在这里追加迁移步骤，
 * 迁移必须保证旧数据字段不丢失（只增不删、改名留别名）。
 */
export function migrateData(data: CityGlowData): CityGlowData {
  let current = data;
  if (current.settings.schemaVersion < 2) {
    current = migrateV1ToV2(current);
  }
  current = {
    ...current,
    settings: { ...current.settings, schemaVersion: SCHEMA_VERSION },
  };
  return current;
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
      schemaVersion: SCHEMA_VERSION,
      cities: [city],
      activeCityId: LEGACY_CITY_ID,
      theme: data.settings.theme ?? "auto",
    },
    streets: data.streets.map((s) => ({ ...s, cityId: s.cityId ?? LEGACY_CITY_ID })),
    records: data.records.map((r) => ({ ...r, cityId: r.cityId ?? LEGACY_CITY_ID })),
    knowledge: data.knowledge.map((k) => ({ ...k, cityId: k.cityId ?? LEGACY_CITY_ID })),
    achievements: data.achievements,
  };
}

/** 全量写回所有分片（导入恢复时使用，Phase 5 完善） */
export function saveAllData(data: CityGlowData): void {
  const migrated = migrateData(data);
  writeRaw(STORAGE_KEYS.settings, JSON.stringify(migrated.settings));
  writeRaw(STORAGE_KEYS.streets, JSON.stringify(migrated.streets));
  writeRaw(STORAGE_KEYS.records, JSON.stringify(migrated.records));
  writeRaw(STORAGE_KEYS.knowledge, JSON.stringify(migrated.knowledge));
  writeRaw(STORAGE_KEYS.achievements, JSON.stringify(migrated.achievements));
}

/* ---------- 各分片独立读写（组件按需更新，避免全量序列化） ---------- */

export function saveSettings(settings: CityGlowData["settings"]): void {
  writeRaw(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function saveStreets(streets: CityGlowData["streets"]): void {
  writeRaw(STORAGE_KEYS.streets, JSON.stringify(streets));
}

export function saveRecords(records: CityGlowData["records"]): void {
  writeRaw(STORAGE_KEYS.records, JSON.stringify(records));
}

export function saveKnowledge(knowledge: CityGlowData["knowledge"]): void {
  writeRaw(STORAGE_KEYS.knowledge, JSON.stringify(knowledge));
}

export function saveAchievements(achievements: CityGlowData["achievements"]): void {
  writeRaw(STORAGE_KEYS.achievements, JSON.stringify(achievements));
}

/** 按 id upsert 街巷：存在则替换，不存在则插入头部 */
export function upsertStreet(street: CityGlowData["streets"][number]): CityGlowData["streets"] {
  const streets = loadAllData().streets;
  const idx = streets.findIndex((s) => s.id === street.id);
  const next = idx >= 0
    ? streets.map((s) => (s.id === street.id ? street : s))
    : [street, ...streets];
  saveStreets(next);
  return next;
}

/** 按 id 删除街巷 */
export function removeStreet(id: string): CityGlowData["streets"] {
  const streets = loadAllData().streets.filter((s) => s.id !== id);
  saveStreets(streets);
  return streets;
}

/** 按 id upsert 探索日记 */
export function upsertRecord(record: CityGlowData["records"][number]): CityGlowData["records"] {
  const records = loadAllData().records;
  const idx = records.findIndex((r) => r.id === record.id);
  const next = idx >= 0
    ? records.map((r) => (r.id === record.id ? record : r))
    : [record, ...records];
  // 时间线按日期倒序展示，写入时保持有序
  next.sort((a, b) => b.date.localeCompare(a.date));
  saveRecords(next);
  return next;
}

export function removeRecord(id: string): CityGlowData["records"] {
  const records = loadAllData().records.filter((r) => r.id !== id);
  saveRecords(records);
  return records;
}

/** 按 id upsert 知识卡片 */
export function upsertKnowledge(card: CityGlowData["knowledge"][number]): CityGlowData["knowledge"] {
  const knowledge = loadAllData().knowledge;
  const idx = knowledge.findIndex((k) => k.id === card.id);
  const next = idx >= 0
    ? knowledge.map((k) => (k.id === card.id ? card : k))
    : [card, ...knowledge];
  next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  saveKnowledge(next);
  return next;
}

export function removeKnowledge(id: string): CityGlowData["knowledge"] {
  const knowledge = loadAllData().knowledge.filter((k) => k.id !== id);
  saveKnowledge(knowledge);
  return knowledge;
}

/** 清空全部分片（保留城市档案），返回清空后的数据 */
export function clearAllData(): CityGlowData {
  const current = loadAllData();
  const fresh: CityGlowData = {
    ...DEFAULT_DATA,
    // 清空数据但保留城市列表与当前城市（城市是"档案"而非"内容"）
    settings: { ...DEFAULT_DATA.settings, cities: current.settings.cities, activeCityId: current.settings.activeCityId },
  };
  saveAllData(fresh);
  return fresh;
}

/** 估算 localStorage 占用字节数（设置页展示"数据占用 X KB"） */
export function estimateStorageBytes(): number {
  if (!isBrowser()) return 0;
  let total = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
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
