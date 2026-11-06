/**
 * 数据导出与导入（Phase 5）。
 *
 * 备份格式：{ app: "city-glow", schemaVersion, exportedAt, data }
 * 导入按 id 兼容合并，绝不直接覆盖——换设备、误删、多年数据演化都靠这条路径保住积累。
 */

import type { CityGlowData, ExplorationRecord, KnowledgeCard, Street } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { loadAllData, saveAllData, migrateData } from "@/lib/storage";

export interface BackupFile {
  app: "city-glow";
  schemaVersion: number;
  exportedAt: string;
  data: CityGlowData;
}

/** 生成 YYYYMMDD 文件名 */
function backupFileName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `city-glow-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
}

/** 触发浏览器下载 city-glow-backup-YYYYMMDD.json */
export function downloadBackup(data: CityGlowData): void {
  const backup: BackupFile = {
    app: "city-glow",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName();
  a.click();
  URL.revokeObjectURL(url);
}

/** 基本结构校验（字段级兜底在合并时完成） */
export function validateBackup(raw: unknown): BackupFile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== "city-glow") return null;
  if (typeof obj.schemaVersion !== "number") return null;
  if (typeof obj.exportedAt !== "string") return null;
  if (typeof obj.data !== "object" || obj.data === null) return null;
  return obj as unknown as BackupFile;
}

/**
 * 合并策略（按 id 并集，冲突取较新者）：
 * - streets: lastWalkedAt 较新者胜，单边独有直接并入
 * - records / knowledge: 并集，id 相同视为同一条（保留本地版本）
 * - achievements: unlocked 按 id 并集，stats 逐项取最大
 * - settings: 备份胜出（带过来的城市与家的位置通常更新）
 * 导入前旧版本号数据先经 migrateData 升级。
 */
export function mergeBackup(local: CityGlowData, backup: BackupFile): CityGlowData {
  const incoming = migrateData(backup.data);
  const merged: CityGlowData = {
    settings: { ...incoming.settings, schemaVersion: SCHEMA_VERSION },
    streets: mergeStreets(local.streets, incoming.streets),
    records: mergeById(local.records, incoming.records),
    knowledge: mergeById(local.knowledge, incoming.knowledge),
    achievements: {
      unlocked: [
        ...local.achievements.unlocked,
        ...incoming.achievements.unlocked,
      ].filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i),
      stats: {
        totalStreets: Math.max(local.achievements.stats.totalStreets, incoming.achievements.stats.totalStreets),
        totalKm: Math.max(local.achievements.stats.totalKm, incoming.achievements.stats.totalKm),
        regionsCovered: Math.max(local.achievements.stats.regionsCovered, incoming.achievements.stats.regionsCovered),
      },
    },
  };
  return merged;
}

function mergeStreets(local: Street[], incoming: Street[]): Street[] {
  const map = new Map<string, Street>();
  for (const s of local) map.set(s.id, s);
  for (const s of incoming) {
    const existing = map.get(s.id);
    if (!existing) {
      map.set(s.id, s);
    } else {
      const l = existing.lastWalkedAt ?? "";
      const r = s.lastWalkedAt ?? "";
      map.set(s.id, r > l ? s : existing);
    }
  }
  return [...map.values()];
}

/** 按 id 去重合并，本地优先 */
function mergeById<T extends { id: string }>(
  local: T[],
  incoming: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of incoming) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}

/** 从文件读取并合并入本地存储，返回是否成功 */
export function importBackupFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw: unknown = JSON.parse(String(reader.result));
        const backup = validateBackup(raw);
        if (!backup) {
          resolve(false);
          return;
        }
        saveAllData(mergeBackup(loadAllData(), backup));
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
