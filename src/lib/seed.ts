/**
 * 宁波示例数据：真实街巷的近似坐标 + 示例日记与知识卡。
 * 固定 seed- 前缀 id，重复载入按 id 幂等合并，不会产生重复条目。
 */

import type {
  CityGlowData,
  ExplorationRecord,
  KnowledgeCard,
  Street,
} from "@/lib/types";
import { loadAllData, saveAllData } from "@/lib/storage";

const SEED_STREETS: Street[] = [
  {
    id: "seed-st-zhongshan",
    name: "中山路",
    region: "海曙老城",
    path: [
      [29.8757, 121.5405],
      [29.876, 121.548],
      [29.8763, 121.5545],
    ],
    status: "done",
    lengthKm: 1.32,
    lastWalkedAt: "2026-10-18",
    priority: "medium",
    notes: "浙东第一街，国庆走过一次",
  },
  {
    id: "seed-st-heying",
    name: "偃月街",
    region: "海曙老城",
    path: [
      [29.8735, 123.5395],
      [29.876, 121.5405],
    ],
    status: "done",
    lengthKm: 0.28,
    lastWalkedAt: "2026-10-18",
    priority: "medium",
  },
  {
    id: "seed-st-cangqiao",
    name: "仓桥街",
    region: "海曙老城",
    path: [
      [29.8725, 121.541],
      [29.8748, 121.5417],
    ],
    status: "done",
    lengthKm: 0.26,
    lastWalkedAt: "2026-11-01",
    priority: "medium",
  },
  {
    id: "seed-st-xianxue",
    name: "县学街",
    region: "海曙老城",
    path: [
      [29.87, 121.542],
      [29.8705, 121.546],
    ],
    status: "doing",
    lengthKm: 0.38,
    priority: "high",
    notes: "想拍老城里的老门头",
  },
  {
    id: "seed-st-dashani",
    name: "大沙泥街",
    region: "海曙老城",
    path: [
      [29.8675, 121.546],
      [29.868, 121.552],
    ],
    status: "todo",
    lengthKm: 0.58,
    priority: "high",
    notes: "天封塔就在这条街，要带相机",
  },
  {
    id: "seed-st-kaiming",
    name: "开明街",
    region: "海曙老城",
    path: [
      [29.871, 121.547],
      [29.876, 121.5478],
    ],
    status: "todo",
    lengthKm: 0.58,
    priority: "medium",
  },
  {
    id: "seed-st-heyi",
    name: "和义路",
    region: "江北外滩",
    path: [
      [29.8822, 121.5465],
      [29.8828, 121.553],
    ],
    status: "done",
    lengthKm: 0.62,
    lastWalkedAt: "2026-11-01",
    priority: "medium",
  },
  {
    id: "seed-st-zhongma",
    name: "中马路（老外滩）",
    region: "江北外滩",
    path: [
      [29.885, 121.554],
      [29.8885, 121.556],
    ],
    status: "done",
    lengthKm: 0.4,
    lastWalkedAt: "2026-10-25",
    priority: "medium",
  },
  {
    id: "seed-st-renmin",
    name: "人民路",
    region: "江北外滩",
    path: [
      [29.883, 121.556],
      [29.89, 121.557],
    ],
    status: "todo",
    lengthKm: 0.78,
    priority: "low",
  },
  {
    id: "seed-st-siming",
    name: "四明中路",
    region: "鄞州中心",
    path: [
      [29.818, 121.547],
      [29.815, 121.554],
    ],
    status: "todo",
    lengthKm: 0.78,
    priority: "medium",
  },
  {
    id: "seed-st-yuehu",
    name: "月湖西巷弄",
    region: "海曙老城",
    path: [
      [29.8665, 121.544],
      [29.8685, 121.5445],
    ],
    status: "done",
    lengthKm: 0.22,
    lastWalkedAt: "2026-10-18",
    priority: "low",
  },
  {
    id: "seed-st-ningdong",
    name: "宁东路",
    region: "东部新城",
    path: [
      [29.86, 121.6],
      [29.858, 121.608],
    ],
    status: "todo",
    lengthKm: 0.95,
    priority: "low",
  },
];

const SEED_RECORDS: ExplorationRecord[] = [
  {
    id: "seed-rc-1",
    date: "2026-10-18",
    companions: ["爸爸", "女儿"],
    streetIds: ["seed-st-zhongshan", "seed-st-heying", "seed-st-yuehu"],
    insights:
      "女儿在月湖边的巷子里数拴马石，猜**偃月街**的名字是不是像月亮。翻了地图发现整条街真的弯成月牙形——原来街名就是一张地图！\n- 偃月 = 弯月\n- 老城的街名藏着形状",
    mood: "🤩",
  },
  {
    id: "seed-rc-2",
    date: "2026-10-25",
    companions: ["妈妈", "女儿", "朋友"],
    streetIds: ["seed-st-zhongma"],
    insights:
      "老外滩的砖墙比鄞州中心的玻璃幕墙好看（女儿原话）。数了数中马路的百年建筑，比上周去的四明中路多了整整 8 幢。老外滩 1844 年开埠，比上海外滩还早 20 年。",
    mood: "😄",
  },
  {
    id: "seed-rc-3",
    date: "2026-11-01",
    companions: ["爸爸", "女儿"],
    streetIds: ["seed-st-cangqiao", "seed-st-heyi"],
    insights:
      "仓桥街没有桥，但老人说这里从前真的有仓和桥。孩子把听到的讲给妈妈听：`城市会记住自己的名字，只是有时候记在老人的记忆里`。",
    mood: "🌤️",
  },
];

const SEED_KNOWLEDGE: KnowledgeCard[] = [
  {
    id: "seed-kn-tianfeng",
    title: "天封塔：18 层地基托起的唐代地标",
    category: "relic",
    streetId: "seed-st-dashani",
    content:
      "**天封塔**始建于唐武后「天册万岁」年间（695 年），建塔时就地挖坑夯层，一层地上一段，故名「天封」。\n- 现塔为 1989 年重建，明州港的航标\n- 地宫出土过宋元银殿等文物\n- 大沙泥街、小沙泥街的「沙泥」，传说就是当年建塔堆沙而来",
    createdAt: "2026-10-18T20:00:00.000Z",
  },
  {
    id: "seed-kn-zhongshan",
    title: "中山路：从唐代城轴线到浙东第一街",
    category: "story",
    streetId: "seed-st-zhongshan",
    content:
      "从鼓楼沿东数，中山路基本压在**唐末罗城的轴线上**。\n- 唐代:明州子城与罗城之间的大街\n- 民国:中山路一名随全国纪念而来\n- 今天:地上车流，地下是轨道交通一号线——一条街走了一千多年",
    createdAt: "2026-10-18T20:10:00.000Z",
  },
  {
    id: "seed-kn-yuehu",
    title: "月湖十洲：一处水利工程的诗意成果",
    category: "geology",
    streetId: "seed-st-yuehu",
    content:
      "月湖不是天然湖，而是唐代蓄水灌溉的**水利工程**，宋时疏浚成十洲胜景。\n- 花屿、月岛、柳汀……十洲各有名字\n- 天一阁就在月湖西岸，书藏古今\n- 候鸟季有鸬鹚越冬，是孩子的自然观察点",
    createdAt: "2026-10-18T20:20:00.000Z",
  },
  {
    id: "seed-kn-laowaitan",
    title: "老外滩 vs 鄞州中心：两个时代的 CBD",
    category: "district",
    streetId: "seed-st-zhongma",
    content:
      "同一条甬江，两岸是**两个时代的商业模式**。\n- 老外滩（1844 开埠）:教堂、领事馆、石库门，业态以餐饮文旅为主\n- 鄞州中心（2000s）:万达商圈、写字楼、地铁换乘，规划痕迹重\n- 对比维度:摊贩密度 / 招牌样式 / 老龄化程度",
    createdAt: "2026-10-25T20:30:00.000Z",
  },
];

/** 返回带示例数据的完整数据集（不落盘，由调用方决定写与否） */
export function buildSeedData(): CityGlowData {
  const achievements = {
    unlocked: [],
    stats: { totalStreets: 0, totalKm: 0, regionsCovered: 0 },
  };
  return {
    settings: {
      schemaVersion: 1,
      cityName: "宁波",
      theme: "auto",
      homeLocation: { lat: 29.8712, lng: 121.5458 },
    },
    streets: SEED_STREETS,
    records: SEED_RECORDS,
    knowledge: SEED_KNOWLEDGE,
    achievements,
  };
}

/** 把示例数据按 id 幂等合并入本地存储，返回合并后的数据 */
export function loadSeedData(): CityGlowData {
  // 延迟导入避免循环依赖：storage 不依赖 seed，这里直接引没问题
  const current = loadAllData();
  const seed = buildSeedData();

  const streetMap = new Map(current.streets.map((s) => [s.id, s]));
  for (const s of seed.streets) {
    const existing = streetMap.get(s.id);
    // 已有用户数据（如已把该街巷标为走过）时不覆盖
    if (!existing || existing.lastWalkedAt === undefined) {
      streetMap.set(s.id, s);
    }
  }

  const recordIds = new Set(current.records.map((r) => r.id));
  const knowledgeIds = new Set(current.knowledge.map((k) => k.id));

  const merged: CityGlowData = {
    settings: current.settings,
    streets: [...streetMap.values()],
    records: [...seed.records.filter((r) => !recordIds.has(r.id)), ...current.records],
    knowledge: [...seed.knowledge.filter((k) => !knowledgeIds.has(k.id)), ...current.knowledge],
    achievements: current.achievements,
  };
  saveAllData(merged);
  return merged;
}
