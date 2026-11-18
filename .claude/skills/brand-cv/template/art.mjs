/* A small toolkit for original 1-bit dithered artwork, drawn in code.
 *
 * It exists so a CV can carry artwork in a company's *technique* without using
 * any of the company's own images. Paint light onto a grid of cells, force a
 * few cells fully light or dark, and it is ordered-dithered into one SVG path.
 * The picture is seeded, so it comes out the same on every build.
 *
 * Choose subjects from the user's own work. The banner() below is a neutral
 * example (a rising chart, a screen, sparkles): replace its scene for each
 * person and company. For a different technique (line art, halftone dots,
 * gradient shapes) write a new generator with the same exports. */
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
];

/* 12x12 pixel glyphs for cards and sprites. "X" is ink. Draw your own. */
export const GLYPHS = {
  chart: ["...........X", "..........X.", ".........X..", "......X.X...", ".....X.X....", "....X.......", "..X.X.......", ".X.X........", "X...........", "............", "XXXXXXXXXXXX", "............"],
  spark: [".....X......", ".....X......", ".....X......", "....XXX.....", "...XXXXX....", "XXXXXXXXXXX.", "...XXXXX....", "....XXX.....", ".....X......", ".....X......", ".....X......", "............"],
  smile: ["............", "..XXXXXXXX..", ".X........X.", "X..X....X..X", "X..X....X..X", "X..........X", "X.X......X.X", "X..XXXXXX..X", ".X........X.", "..XXXXXXXX..", "............", "............"],
  prompt: ["............", "............", "X...........", ".X..........", "..X.........", "...X........", "..X.........", ".X..........", "X.....XXXXXX", "............", "............", "............"],
};

export function canvas(cols, rows, { seed = 7, base = 0.015 } = {}) {
  const W = cols, H = rows, u = rows;
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const v = Array.from({ length: H }, () => new Float32Array(W).fill(base));
  const force = Array.from({ length: H }, () => new Int8Array(W)); // 1 light, -1 dark
  const inside = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  const c = {
    W, H, u, rand,
    /* paint(fn): fn(x, y, current) returns the new lightness 0..1 for every cell */
    paint(fn) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) v[y][x] = fn(x, y, v[y][x]); return c; },
    /* a soft light, brightest at (cx, cy) */
    glow(cx, cy, rx, ry, amount = 0.7) { return c.paint((x, y, cur) => Math.max(cur, amount * Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)))); },
    rect(x0, y0, w, h, value) { for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, Math.round(y0 + h)); y++) for (let x = Math.max(0, Math.round(x0)); x < Math.min(W, Math.round(x0 + w)); x++) v[y][x] = typeof value === "function" ? value(x, y) : value; return c; },
    ellipse(cx, cy, rx, ry, value) { return c.paint((x, y, cur) => (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 ? (typeof value === "function" ? value(x, y) : value) : cur)); },
    /* dot(x, y, 1) forces a light cell; -1 forces a dark one */
    dot(x, y, f = 1) { x = Math.round(x); y = Math.round(y); if (inside(x, y)) force[y][x] = f; return c; },
    line(x0, y0, x1, y1, f = 1, thick = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) for (let t = 0; t < thick; t++) c.dot(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n + t, f); return c; },
    sparkle(x, y, r) { for (let k = -r; k <= r; k++) { c.dot(x + k, y); c.dot(x, y + k); } const q = Math.floor(r / 3); for (let i = -q; i <= q; i++) for (let j = -q; j <= q; j++) if (Math.abs(i) + Math.abs(j) <= q) c.dot(x + i, y + j); return c; },
    stars(density = 0.002) { for (let i = 0; i < W * H * density; i++) c.dot(Math.floor(rand() * W), Math.floor(rand() * H)); return c; },
    rain(columns = W / 9) { for (let i = 0; i < columns; i++) { const x = Math.floor(rand() * W), y0 = Math.floor(rand() * H * 0.5), len = 4 + Math.floor(rand() * H * 0.5), ph = Math.floor(rand() * 5); for (let y = y0; y < Math.min(H, y0 + len); y++) if ((y + ph) % 4 < 2) v[y][x] = Math.max(v[y][x], 0.34); } return c; },
    /* a pixel glyph, each pixel px cells wide; "X" light, anything else dark */
    sprite(glyph, x0, y0, px = 1) { glyph.forEach((row, j) => [...row].forEach((ch, i) => { for (let a = 0; a < px; a++) for (let b = 0; b < px; b++) c.dot(x0 + i * px + a, y0 + j * px + b, ch === "X" ? 1 : -1); })); return c; },
    toSVG({ ink = "#0000F2", paper = "#FFFFFF", label = "Dithered illustration" } = {}) {
      let d = "";
      for (let y = 0; y < H; y++) {
        let start = -1;
        for (let x = 0; x <= W; x++) {
          const on = x < W && (force[y][x] === 1 || (force[y][x] === 0 && v[y][x] > (BAYER[y % 8][x % 8] + 0.5) / 64));
          if (on && start < 0) start = x;
          if (!on && start >= 0) { d += `M${start} ${y}h${x - start}v1h-${x - start}z`; start = -1; }
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="${label}"><rect width="${W}" height="${H}" fill="${ink}"/><path d="${d}" fill="${paper}"/></svg>`;
    },
  };
  return c;
}

/* Example scene: a rising results chart, a screen, sparkles. Replace it. */
export function banner(cols, rows, { seed = 7, ink = "#0000F2", paper = "#FFFFFF" } = {}) {
  const c = canvas(cols, rows, { seed }), { W, H, u } = c;
  c.rain().stars();
  // a chart that climbs from left to right, with a glow under its last point
  const pts = [[0.06, 0.8], [0.14, 0.7], [0.2, 0.74], [0.28, 0.55], [0.34, 0.6], [0.42, 0.34], [0.48, 0.22]].map(([x, y]) => [x * W, y * H]);
  c.glow(pts.at(-1)[0], pts.at(-1)[1], 0.9 * u, 0.6 * u, 0.6);
  for (let x = 0.05 * W; x < 0.5 * W; x++) { const i = pts.findIndex((p) => p[0] > x); if (i > 0) { const [a, b] = [pts[i - 1], pts[i]], yTop = a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]); c.rect(x, yTop, 1, 0.88 * H - yTop, (xx, yy) => 0.1 + 0.35 * (1 - (yy - yTop) / (0.88 * H - yTop))); } }
  for (let i = 1; i < pts.length; i++) c.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 1, 2);
  for (const [x, y] of pts) c.sparkle(Math.round(x), Math.round(y), 2);
  c.line(0.05 * W, 0.88 * H, 0.5 * W, 0.88 * H, 1);
  // a screen with a glyph on it
  const mx = 0.72 * W, my = 0.5 * H, mw = 1.05 * u, mh = 0.72 * u;
  c.glow(mx, my, 0.9 * u, 0.6 * u, 0.22);
  c.rect(mx - mw / 2, my - mh / 2, mw, mh, (x, y) => 0.72 - 0.28 * ((x - mx) / mw + 0.5));
  c.rect(mx - mw / 2 + 0.12 * u, my - mh / 2 + 0.1 * u, mw - 0.24 * u, mh - 0.24 * u, (x, y) => 0.1 + (y % 2 ? 0.07 : 0));
  c.rect(mx - 0.22 * u, my + mh / 2, 0.44 * u, 0.07 * u, 0.4);
  const px = Math.max(1, Math.round((mh * 0.5) / 12));
  c.sprite(GLYPHS.smile, Math.round(mx - 6 * px), Math.round(my - 0.02 * u - 6 * px), px);
  for (const [fx, fy, r] of [[0.56, 0.2, 0.1], [0.9, 0.24, 0.13], [0.93, 0.74, 0.06], [0.6, 0.8, 0.05], [0.02, 0.18, 0.06]]) c.sparkle(Math.round(fx * W), Math.round(fy * H), Math.max(2, Math.round(r * u)));
  return c.toSVG({ ink, paper, label: "Dithered illustration: a rising chart and a screen" });
}

/* A small outlined card with a 12x12 glyph, like a stamp. */
export function card(glyph, { ink = "#0000F2", paper = "#F2F2F2", fill = false } = {}) {
  let d = "";
  glyph.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "X") d += `M${4 + i} ${7 + j}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 26" shape-rendering="crispEdges"><rect x="0.5" y="0.5" width="19" height="25" rx="2" fill="${fill ? ink : paper}" stroke="${ink}" stroke-width="0.7" shape-rendering="geometricPrecision"/><path d="${d}" fill="${fill ? paper : ink}"/></svg>`;
}
