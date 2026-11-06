import type { CityGlowData } from "@/lib/types";
import { DEFAULT_DATA, SCHEMA_VERSION } from "@/lib/types";

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
 * Phase 2 起在地图/日记等模块挂载时调用。
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
    (value) => (isKnowledgeArray(value) ? value : null),
    DEFAULT_DATA.knowledge,
  );
  const achievements = readSlice(
    STORAGE_KEYS.achievements,
    (value) => (isAchievements(value) ? value : null),
    DEFAULT_DATA.achievements,
  );
  return { settings, streets, records, knowledge, achievements };
}

function isSettings(value: unknown): value is CityGlowData["settings"] {
  return typeof value === "object" && value !== null && "cityName" in value;
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
 * Phase 1 为占位实现；从 Phase 2 起每次数据结构变更都在这里追加迁移步骤，
 * 迁移必须保证旧数据字段不丢失（只增不删、改名留别名）。
 */
export function migrateData(data: CityGlowData): CityGlowData {
  let current = data;
  // 示例：if (current.settings.schemaVersion < 2) { ...升级到 v2... }
  current = {
    ...current,
    settings: { ...current.settings, schemaVersion: SCHEMA_VERSION },
  };
  return current;
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

/** 清空全部分片（保留默认 settings），返回清空后的数据 */
export function clearAllData(): CityGlowData {
  const fresh: CityGlowData = {
    ...DEFAULT_DATA,
    settings: { ...DEFAULT_DATA.settings, cityName: loadAllData().settings.cityName || DEFAULT_DATA.settings.cityName },
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
