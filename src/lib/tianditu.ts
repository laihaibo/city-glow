import { getTiandituKey } from "@/lib/storage";

/**
 * 天地图 Web API 封装（与瓦片底图共用同一个 Key，存于 localStorage）。
 * 仅在已配置 Key 时可用；网络失败/无结果返回 null，由调用方给出提示。
 */

const GEOCODER_URL = "https://api.tianditu.gov.cn/geocoder";
const TIMEOUT_MS = 10_000;

export interface GeoCodeResult {
  name: string;
  lat: number;
  lng: number;
}

interface TdtDsResponse {
  location?: { lon: number; lat: number };
  msg?: string;
}

interface TdtPostResponse {
  result?: {
    formatted_address?: string;
    addressComponent?: { city?: string; county?: string };
  };
  msg?: string;
}

async function tdtFetch(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 是否已配置天地图 Key（搜索功能的前置条件；浏览器定位不依赖 Key） */
export function hasTiandituKey(): boolean {
  return getTiandituKey().length > 0;
}

/** 城市名 → 坐标（正向地理编码）。搜索输入建议写全名，如「徐州市」 */
export async function geocodeForward(keyword: string): Promise<GeoCodeResult | null> {
  const tk = getTiandituKey();
  const word = keyword.trim();
  if (!tk || !word) return null;
  const ds = encodeURIComponent(JSON.stringify({ keyWord: word }));
  const data = (await tdtFetch(`${GEOCODER_URL}?ds=${ds}&tk=${tk}`)) as TdtDsResponse | null;
  if (!data?.location) return null;
  return { name: word, lat: data.location.lat, lng: data.location.lon };
}

/**
 * 坐标 → 城市名（逆向地理编码）。
 * 城市名宽松解析：city → county → 格式化地址的末段。
 */
export async function geocodeReverse(lat: number, lng: number): Promise<GeoCodeResult | null> {
  const tk = getTiandituKey();
  if (!tk) return null;
  const postStr = encodeURIComponent(JSON.stringify({ lon: lng, lat, ver: 1 }));
  const data = (await tdtFetch(`${GEOCODER_URL}?postStr=${postStr}&tk=${tk}`)) as TdtPostResponse | null;
  const result = data?.result;
  if (!result) return null;

  const comp = result.addressComponent ?? {};
  let name = comp.city?.trim() ?? "";
  if (!name) name = comp.county?.trim() ?? "";
  if (!name) {
    const addr = result.formatted_address ?? "";
    name = addr.split(/省|市/).filter(Boolean).pop() ?? addr;
  }
  return { name: name || "我的城市", lat, lng };
}
