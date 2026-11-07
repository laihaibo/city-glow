"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCityGlow } from "@/lib/hooks";
import { useTiandituKey } from "@/lib/use-map-key";
import { geocodeForward, geocodeReverse, hasTiandituKey } from "@/lib/tianditu";
import type { CityInfo } from "@/lib/types";
import { cn } from "cn";

/**
 * 城市管理卡：切换 / 改名 / 删除 / 添加。
 * 添加城市两条路：浏览器定位（无需 Key）+ 天地图搜索（需 Key，与底图共用）。
 * 坐标是保存的前置条件，避免出现没有中心点的城市。
 */
export function CityManager() {
  const { data, activeCity, setActiveCity, addCity, renameCity, removeCity } = useCityGlow();
  const { key: tdtKey } = useTiandituKey();

  /* 添加城市 */
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [coords, setCoords] = useState<CityInfo["homeLocation"] | null>(null);
  const [busy, setBusy] = useState<"locate" | "search" | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  /* 改名 / 删除 */
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cities = data?.settings.cities ?? [];
  const deleteTarget = cities.find((c) => c.id === deleteId);
  const deleteStats = deleteId
    ? {
        streets: data?.streets.filter((s) => s.cityId === deleteId).length ?? 0,
        records: data?.records.filter((r) => r.cityId === deleteId).length ?? 0,
      }
    : null;

  const resetAddForm = () => {
    setName("");
    setCoords(null);
    setBusy(null);
    setStatusMsg("");
  };

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusMsg("当前浏览器不支持定位");
      return;
    }
    setBusy("locate");
    setStatusMsg("正在获取当前位置……");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (hasTiandituKey() && !name.trim()) {
          // 有 Key 时顺手把城市名也逆解析出来（无 Key 则手动填名）
          void geocodeReverse(latitude, longitude).then((r) => {
            if (r) setName((prev) => prev.trim() || r.name);
            setBusy(null);
            setStatusMsg("定位成功！坐标已填入，确认城市名后保存");
          });
        } else {
          setBusy(null);
          setStatusMsg("定位成功！坐标已填入，输入城市名后保存");
        }
      },
      (err) => {
        setBusy(null);
        setStatusMsg(
          err.code === err.PERMISSION_DENIED
            ? "定位被拒绝：请允许浏览器使用位置信息"
            : "定位失败：请稍后重试，或改用搜索",
        );
      },
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const handleSearch = async () => {
    if (!hasTiandituKey()) {
      setStatusMsg("搜索需要天地图 Key：去「足迹地图」页免费配置");
      return;
    }
    if (!name.trim()) {
      setStatusMsg("先输入城市名再搜索");
      return;
    }
    setBusy("search");
    setStatusMsg("正在搜索……");
    const r = await geocodeForward(name);
    setBusy(null);
    if (r) {
      setCoords({ lat: r.lat, lng: r.lng });
      setStatusMsg("已找到坐标！确认城市名后保存");
    } else {
      setCoords(null);
      setStatusMsg("没有找到，试试写全名，如「徐州市」");
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !coords) return;
    addCity({ name, homeLocation: coords });
    resetAddForm();
    setAddOpen(false);
  };

  return (
    <section id="cities" className="space-y-3 scroll-mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">🏙️ 城市管理</h2>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-xl"
          onClick={() => {
            resetAddForm();
            setAddOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          添加城市
        </Button>
      </div>
      <GlassCard className="p-2">
        {cities.map((city) => {
          const isActive = city.id === activeCity?.id;
          const isCurrent = city.id === data?.settings.activeCityId;
          const streetCount = data?.streets.filter((s) => s.cityId === city.id).length ?? 0;
          return (
            <div
              key={city.id}
              className="flex min-h-12 items-center gap-2 rounded-2xl px-3 py-1.5 transition-colors hover:bg-muted/60"
            >
              <button
                type="button"
                onClick={() => setActiveCity(city.id)}
                className="min-w-0 flex-1 text-left"
                title="切换到该城市"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {city.name}
                  {isCurrent && (
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      当前
                    </Badge>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  🏠 {city.homeLocation.lat.toFixed(2)}, {city.homeLocation.lng.toFixed(2)} ·{" "}
                  {streetCount} 条街巷
                </span>
              </button>
              {isActive && !isCurrent && (
                <span className="text-[10px] text-muted-foreground">查看中</span>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`重命名 ${city.name}`}
                onClick={() => {
                  setRenameId(city.id);
                  setRenameValue(city.name);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`删除 ${city.name}`}
                disabled={cities.length <= 1}
                onClick={() => setDeleteId(city.id)}
                className="text-destructive disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
        {cities.length <= 1 && (
          <p className="px-3 pb-2 pt-1 text-xs leading-relaxed text-muted-foreground">
            回老家、去旅行时在这里添加城市，各城市的探索进度互不干扰
          </p>
        )}
      </GlassCard>

      {/* 添加城市对话框 */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>添加城市</DialogTitle>
            <DialogDescription>
              用定位或搜索确定城市中心，保存后自动切换到它
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="城市名，如：徐州"
              className="rounded-2xl"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl"
                disabled={busy !== null}
                onClick={handleLocate}
              >
                <MapPin className="size-4" />
                {busy === "locate" ? "定位中…" : "使用定位"}
              </Button>
              <Button
                variant="secondary"
                className="rounded-2xl"
                disabled={busy !== null}
                onClick={() => void handleSearch()}
                title={hasTiandituKey() ? undefined : "需要天地图 Key"}
              >
                <Search className="size-4" />
                {busy === "search" ? "搜索中…" : "搜索坐标"}
              </Button>
            </div>
            <p className="min-h-5 text-xs leading-relaxed text-muted-foreground">
              {statusMsg ||
                (hasTiandituKey()
                  ? "定位无需 Key；搜索会复用底图的天地图 Key"
                  : "定位无需 Key；「搜索坐标」需要先在足迹地图页配置天地图 Key")}
            </p>
            {coords && (
              <p className="rounded-2xl bg-muted/50 px-3 py-2 font-mono text-xs tabular-nums">
                中心点：{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setAddOpen(false); resetAddForm(); }} className="rounded-2xl">
              取消
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim() || !coords} className="rounded-2xl">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 改名对话框 */}
      <Dialog open={renameId !== null} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>重命名城市</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="rounded-2xl"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRenameId(null)} className="rounded-2xl">
              取消
            </Button>
            <Button
              onClick={() => {
                if (renameId && renameValue.trim()) renameCity(renameId, renameValue);
                setRenameId(null);
              }}
              disabled={!renameValue.trim()}
              className="rounded-2xl"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass-strong max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>删除{deleteTarget?.name ?? "城市"}？</DialogTitle>
            <DialogDescription>
              {deleteStats && (
                <>
                  该城市的 {deleteStats.streets} 条街巷、{deleteStats.records} 篇日记和知识卡都会被删除，且无法恢复。
                  建议先「导出 JSON 备份」。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-2xl">
              再想想
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) removeCity(deleteId);
                setDeleteId(null);
              }}
              className="rounded-2xl"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
