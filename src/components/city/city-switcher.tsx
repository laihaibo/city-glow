"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCityGlow } from "@/lib/hooks";
import type { CityInfo } from "@/lib/types";
import { cn } from "cn";

/**
 * 城市切换器（天气应用式）：触发按钮显示当前城市名，
 * 弹出底部 Sheet 列出全部城市，点击即切换。
 */
export function CitySwitcher({ className }: { className?: string }) {
  const { ready, data, activeCity, setActiveCity } = useCityGlow();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const cities = data?.settings.cities ?? [];
  const streetCount = (city: CityInfo) =>
    data?.streets.filter((s) => s.cityId === city.id).length ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!ready}
        aria-label="切换城市"
        className={cn(
          "glass flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted/60 disabled:opacity-60",
          className,
        )}
      >
        <MapPin className="size-3.5 text-primary" aria-hidden />
        <span className="max-w-28 truncate">{activeCity?.name ?? "…"}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="glass-strong rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
        >
          <SheetHeader className="px-0">
            <SheetTitle>选择城市</SheetTitle>
            <SheetDescription>每个城市有独立的街巷、日记和知识卡</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 pb-4">
            {cities.map((city) => {
              const isActive = city.id === activeCity?.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setActiveCity(city.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left transition-colors",
                    isActive ? "bg-primary/15 ring-1 ring-primary/40" : "bg-muted/50 hover:bg-muted",
                  )}
                >
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {city.name}
                      {isActive && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                          当前
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {streetCount(city)} 条街巷
                    </span>
                  </span>
                  <span className="text-lg" aria-hidden>{isActive ? "📍" : "🏙️"}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/profile#cities");
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-dashed border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Settings2 className="size-4" aria-hidden />
              添加 / 管理城市
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
