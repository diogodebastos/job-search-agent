import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MY = path.join(ROOT, "my");
export const readJson = (p, fallback = null) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; } };
export const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
export const contact = () => readJson(path.join(MY, "profile", "contact.json"), {});

/* Any Chromium-based browser can print a page to PDF without opening a window. */
const BROWSERS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Arc.app/Contents/MacOS/Arc",
  `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
export const findBrowser = () => BROWSERS.find((p) => { try { return fs.existsSync(p); } catch { return false; } }) ?? null;

export function printPdf(htmlFile, pdfFile) {
  const browser = findBrowser();
  if (!browser) return { ok: false, reason: "no-browser" };
  const r = spawnSync(browser, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=4000", `--print-to-pdf=${pdfFile}`, `file://${htmlFile}`], { encoding: "utf8" });
  return r.status === 0 && fs.existsSync(pdfFile) ? { ok: true } : { ok: false, reason: (r.stderr || "print failed").slice(-400) };
}

export function screenshot(url, pngFile, width = 1440, height = 900) {
  const browser = findBrowser();
  if (!browser) return false;
  const r = spawnSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},${height}`, "--virtual-time-budget=9000", `--screenshot=${pngFile}`, url], { encoding: "utf8", timeout: 60000 });
  return r.status === 0 && fs.existsSync(pngFile);
}

/* Page count without extra tools: pdfinfo if present, then macOS metadata. Null when unknown. */
export function pageCount(pdfFile) {
  let r = spawnSync("pdfinfo", [pdfFile], { encoding: "utf8" });
  let m = r.stdout?.match(/^Pages:\s+(\d+)/m);
  if (m) return Number(m[1]);
  r = spawnSync("mdls", ["-raw", "-name", "kMDItemNumberOfPages", pdfFile], { encoding: "utf8" });
  m = r.stdout?.match(/^\d+$/);
  return m ? Number(m[0]) : null;
}
export const today = () => new Date().toISOString().slice(0, 10);
