// Shared geometry helpers for the map data pipeline.
export const CA_BBOX = [-124.6, 32.4, -114.0, 42.1]; // minLon, minLat, maxLon, maxLat
export const U = 1e4; // storage unit: 1e-4 degree (about 11 m)

export function inBBox(lon, lat, b = CA_BBOX) { return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]; }

// Douglas-Peucker on [[lon,lat],...]; tol in degrees. Keeps endpoints. Iterative (no recursion limits).
export function simplify(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = -1, idx = -1;
    const ax = pts[a][0], ay = pts[a][1], bx = pts[b][0], by = pts[b][1];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      let px = pts[i][0] - ax, py = pts[i][1] - ay, d2;
      if (len2 === 0) d2 = px * px + py * py;
      else {
        let t = (px * dx + py * dy) / len2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - t * dx, ey = py - t * dy; d2 = ex * ex + ey * ey;
      }
      if (d2 > max) { max = d2; idx = i; }
    }
    if (max > t2) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

// [[lon,lat],...] -> flat delta-encoded ints in 1e-4 degree units: [x0, y0, dx1, dy1, ...]
export function enc(pts) {
  const out = []; let px = 0, py = 0;
  for (let i = 0; i < pts.length; i++) {
    const x = Math.round(pts[i][0] * U), y = Math.round(pts[i][1] * U);
    if (i > 0 && x === px && y === py) continue;
    out.push(x - px, y - py); px = x; py = y;
  }
  return out;
}
export function dec(flat) {
  const out = []; let x = 0, y = 0;
  for (let i = 0; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; out.push([x / U, y / U]); }
  return out;
}

const R = 6371008.8;
export function hav(lon1, lat1, lon2, lat2) {
  const r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function pathLen(pts) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); return d; }
export function bearing(lon1, lat1, lon2, lat2) {
  const r = Math.PI / 180, y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}
export function ringArea(ring) { // planar shoelace, degrees^2 (for ranking only)
  let a = 0; for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a / 2);
}
