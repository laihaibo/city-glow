import type { Metadata } from "next";
import { Camera, Footprints, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "路线与计划" };

/** 本周末建议路线：Phase 4 将按地理邻近度真实生成 */
const DEMO_ROUTE = ["文亭街", "美人巷", "彭城路"];

/** 待走街巷池：按区域分组，Phase 4 接入真实数据 */
const DEMO_TODO_POOL = [
  {
    region: "老城",
    streets: [
      { name: "少华街", priority: "高", note: "想拍老房子" },
      { name: "统一街", priority: "中", note: "" },
    ],
  },
  {
    region: "东区",
    streets: [
      { name: "民馨园路", priority: "高", note: "要带相机" },
      { name: "绿地大道", priority: "低", note: "" },
    ],
  },
  {
    region: "南湖",
    streets: [{ name: "湖滨西路", priority: "中", note: "" }],
  },
];

const PRIORITY_VARIANT: Record<string, string> = {
  高: "bg-primary/15 text-primary",
  中: "bg-chart-3/15 text-chart-3",
  低: "bg-muted text-muted-foreground",
};

export default function PlanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">路线与计划</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          待走街巷池 + 周末自动拼路线，让每个周末都有目的地
        </p>
      </div>

      {/* 本周末建议路线 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">本周末建议路线</h2>
          <Badge variant="secondary" className="rounded-full text-xs">
            Phase 4 生成
          </Badge>
        </div>
        <GlassCard className="overflow-hidden bg-gradient-to-br from-chart-1/14 to-transparent p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden />
            老城半日环线 · 步行约 3.2 km · 预计 1.5 小时
          </div>
          <ol className="mt-4 space-y-3">
            {DEMO_ROUTE.map((street, index) => (
              <li key={street} className="flex items-center gap-3">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground tabular-nums"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold">{street}</span>
                {index < DEMO_ROUTE.length - 1 && (
                  <span className="flex-1 border-t border-dashed border-primary/40" aria-hidden />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="size-3.5" aria-hidden />
            备注提醒：带上相机，拍老房子门头
          </p>
        </GlassCard>
      </section>

      {/* 待走街巷池 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">待走街巷池</h2>
        <div className="space-y-3">
          {DEMO_TODO_POOL.map(({ region, streets }) => (
            <GlassCard key={region} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{region}</p>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {streets.length} 条待走
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {streets.map(({ name, priority, note }) => (
                  <li
                    key={name}
                    className="flex items-center gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5"
                  >
                    <Footprints className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    {note && <span className="text-xs text-muted-foreground">📌 {note}</span>}
                    <Badge
                      className={`rounded-full px-2 py-0 text-xs font-normal ${PRIORITY_VARIANT[priority]}`}
                    >
                      {priority}优先
                    </Badge>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
