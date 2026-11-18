#!/usr/bin/env node
/* Measure a company's visual language without a browser plug-in.
 *   node scripts/study-site.mjs <url> <out-folder>
 * Fetches the page and its stylesheets, then counts what the CSS really uses:
 * font families, @font-face files, colours, radii. Also takes two screenshots
 * with a Chromium-based browser if one is installed (top of page, and a tall one).
 * Read study.json and the PNGs, then write the brand notes. Sends nothing but
 * ordinary page requests. */
import fs from "fs";
import path from "path";
import { screenshot } from "./lib.mjs";

const [url, out] = process.argv.slice(2);
if (!url || !out) { console.error("usage: study-site.mjs <url> <out-folder>"); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const get = async (u) => { try { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); return r.ok ? await r.text() : ""; } catch { return ""; } };

const html = await get(url);
if (!html) { console.error("Could not fetch the page. Ask the user for screenshots instead, or try the site's other pages."); process.exit(1); }
const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => m[0].match(/href=["']?([^"'\s>]+)/i)?.[1]).filter(Boolean).map((h) => new URL(h.replace(/&amp;/g, "&"), url).href).slice(0, 25);
let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
for (const s of sheets) css += "\n" + (await get(s));
css += "\n" + [...html.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join(";\n");

const tally = (re, norm = (s) => s) => { const m = {}; for (const x of css.matchAll(re)) { const k = norm(x[1].trim()); if (k) m[k] = (m[k] || 0) + 1; } return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 25)); };
const fontFaces = [...css.matchAll(/@font-face\s*{([^}]*)}/gi)].map((m) => ({
  family: m[1].match(/font-family:\s*["']?([^;"']+)/i)?.[1]?.trim(), weight: m[1].match(/font-weight:\s*([^;]+)/i)?.[1]?.trim(),
  file: m[1].match(/url\(["']?([^"')]+)/i)?.[1]?.split("/").pop()?.slice(0, 60),
})).filter((f) => f.family);
const study = {
  url, studied: new Date().toISOString().slice(0, 10), stylesheets: sheets.length,
  title: html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim(),
  fontFamilies: tally(/font-family:\s*([^;}!]+)/gi, (s) => s.split(",")[0].replace(/["']/g, "").trim()),
  fontFaces: [...new Map(fontFaces.map((f) => [`${f.family} ${f.weight}`, f])).values()].slice(0, 30),
  googleFonts: [...html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi)].map((m) => m[1].replace(/&amp;/g, "&")),
  colors: tally(/(#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]+\)|oklch\([^)]+\)|hsla?\([^)]+\))/gi, (s) => s.toLowerCase().replace(/\s+/g, "")),
  colorTokens: Object.fromEntries([...css.matchAll(/(--[\w-]*(?:color|bg|ink|paper|brand|primary|accent|text|surface)[\w-]*)\s*:\s*([^;}]+)/gi)].slice(0, 60).map((m) => [m[1], m[2].trim().slice(0, 60)])),
  fontSizes: tally(/font-size:\s*([^;}!]+)/gi), fontWeights: tally(/font-weight:\s*([^;}!]+)/gi),
  letterSpacing: tally(/letter-spacing:\s*([^;}!]+)/gi), textTransform: tally(/text-transform:\s*([^;}!]+)/gi),
  radii: tally(/border-radius:\s*([^;}!]+)/gi),
  images: [...html.matchAll(/<(?:img|source|video)[^>]+(?:src|srcset)=["']([^"'\s]+)/gi)].map((m) => m[1].split("/").pop().slice(0, 70)).slice(0, 40),
  inlineSvgs: (html.match(/<svg/gi) || []).length,
};
fs.writeFileSync(path.join(out, "study.json"), JSON.stringify(study, null, 2));
console.log(`study: ${path.join(out, "study.json")}`);
console.log(`  fonts: ${Object.keys(study.fontFamilies).slice(0, 6).join(" · ") || "none found (styles may be built in the browser: rely on the screenshots)"}`);
console.log(`  colours: ${Object.keys(study.colors).slice(0, 8).join(" ")}`);
for (const [name, w, h] of [["top", 1440, 900], ["tall", 1440, 4200]]) {
  const png = path.join(out, `${name}.png`);
  console.log(screenshot(url, png, w, h) ? `  screenshot: ${png}` : `  no screenshot (${name}): no Chromium-based browser found; ask the user for a screenshot`);
}
