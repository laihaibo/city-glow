/**
 * 地理计算工具：街巷长度、距离、周末路线的最近邻串联。
 * 坐标一律 [lat, lng]（leaflet 顺序），注意与常用 lng-lat 顺序区分。
 */

const EARTH_RADIUS_KM = 6371;

/** 两个坐标点的 haversine 球面距离（km） */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** 折线路径总长度（km）；少于 2 个点返回 0 */
export function pathLengthKm(path: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distanceKm(path[i - 1], path[i]);
  }
  return Math.round(total * 100) / 100;
}

/** 路径中心点（地图定位用） */
export function pathCenter(path: [number, number][]): [number, number] | null {
  if (path.length === 0) return null;
  const lat = path.reduce((sum, p) => sum + p[0], 0) / path.length;
  const lng = path.reduce((sum, p) => sum + p[1], 0) / path.length;
  return [lat, lng];
}

export interface RouteStop {
  streetId: string;
  name: string;
  /** 距上一站的步行距离（km）；首站为 0 */
  legKm: number;
}

/**
 * 最近邻串联：把待走街巷串成一条顺路的周末路线。
 * 从起点（默认"家"）出发，每步选最近的未访问街巷，直到取满 maxStops 条。
 */
export function planNearestRoute(
  start: [number, number],
  candidates: { id: string; name: string; path: [number, number][] }[],
  maxStops = 5,
): RouteStop[] {
  const remaining = candidates
    .map((c) => ({ ...c, center: pathCenter(c.path) }))
    .filter((c): c is typeof c & { center: [number, number] } => c.center !== null);

  const route: RouteStop[] = [];
  let cursor = start;
  while (route.length < maxStops && remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(cursor, remaining[i].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    route.push({
      streetId: next.id,
      name: next.name,
      legKm: Math.round(bestDist * 100) / 100,
    });
    cursor = next.center;
  }
  return route;
}

/** 步行时长估算：默认 4 km/h（带孩子再打 8 折由调用方决定） */
export function walkMinutes(km: number, speedKmh = 4): number {
  return Math.ceil((km / speedKmh) * 60);
}
