"use client";

import { useEffect, useState } from "react";
import { useCityGlow } from "@/lib/hooks";

/** 粒子角度（度）——固定一组散布值，避免每次渲染随机跳动 */
const PARTICLE_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const PARTICLE_COLORS = ["#f0489c", "#f5c518", "#38bdf8", "#4ade80", "#a78bfa"];

/**
 * 成就解锁庆祝浮层：液态玻璃卡片 + 光晕 + 粒子迸发，2.2s 自动消失。
 * 徽章队列化逐个展示，不打断操作。
 */
export function CelebrationLayer() {
  const { newlyUnlocked, popCelebration } = useCityGlow();
  const current = newlyUnlocked[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!current) return;
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), 2000);
    const popTimer = setTimeout(() => popCelebration(), 2300);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(popTimer);
    };
  }, [current, popCelebration]);

  if (!current) return null;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-[80] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* 背景光晕 */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute size-64 rounded-full bg-primary/25 blur-3xl" />

      {/* 粒子迸发 */}
      {PARTICLE_ANGLES.map((angle, i) => (
        <span
          key={angle}
          className="celebrate-particle absolute size-2.5 rounded-full"
          style={{
            // @ts-expect-error CSS 自定义属性传给 keyframes
            "--burst-angle": `${angle}deg`,
            backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          }}
        />
      ))}

      {/* 徽章卡 */}
      <div className="celebrate-card glass-strong relative mx-6 flex max-w-xs flex-col items-center gap-2 rounded-3xl px-8 py-7 text-center">
        <span className="text-4xl" aria-hidden>
          🎉
        </span>
        <p className="text-xs font-medium tracking-widest text-primary">成就解锁</p>
        <p className="text-lg font-bold">{current.name}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{current.description}</p>
      </div>
    </div>
  );
}
