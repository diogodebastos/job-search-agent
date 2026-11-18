#!/usr/bin/env node
/* Turn an application folder's cv.md and cover-letter.md into PDFs, then check them.
 *
 *   node scripts/render.mjs <folder> [--only cv|letter]
 *
 * - Fills {{PHONE}} and {{EMAIL}} from my/profile/contact.json.
 * - Prints with any Chromium-based browser (Chrome, Edge, Brave, Arc). Without
 *   one it leaves the .html next to the markdown: open it in Safari and use
 *   File > Export as PDF.
 * - If the folder has keywords.json, checks the CV text against it:
 *   [{ "term": "Google Ads", "synonyms": ["Google AdWords"], "priority": "must"|"nice",
 *      "evidence": "F-JOB1-03" | null }]
 *   evidence: null marks a known gap; that term must NOT appear in the CV.
 * Exit code 1 when a check fails. */
import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import { ROOT, contact, printPdf, pageCount, readJson, writeJson } from "./lib.mjs";
import { parse } from "./md.mjs";

const { values: opt, positionals } = parseArgs({ allowPositionals: true, options: { only: { type: "string" } } });
const dir = positionals[0] && path.resolve(positionals[0]);
if (!dir || !fs.existsSync(dir)) { console.error("usage: render.mjs <folder with cv.md / cover-letter.md> [--only cv|letter]"); process.exit(2); }

const c = contact();
const fileName = (c.name || "CV").trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
const css = fs.readFileSync(path.join(ROOT, "templates", "cv.css"), "utf8");
const fill = (md) => {
  let t = md;
  for (const [k, v] of [["PHONE", c.phone], ["EMAIL", c.email]]) {
    const val = (v ?? "").trim();
    t = val ? t.replaceAll(`{{${k}}}`, val) : t.replace(new RegExp(`\\s*\\|\\s*\\{\\{${k}\\}\\}|\\{\\{${k}\\}\\}\\s*[|·]\\s*|\\{\\{${k}\\}\\}`, "g"), "");
  }
  return t;
};
const JOBS = {
  cv: { src: "cv.md", out: `${fileName}_CV.pdf`, max: 2, cls: "" },
  letter: { src: "cover-letter.md", out: `${fileName}_Cover_Letter.pdf`, max: 1, cls: "letter" },
};
let failed = false;
const report = { files: {}, checks: [] };
const check = (name, ok, detail = "") => { report.checks.push({ name, ok, detail }); console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ": " + detail : ""}`); if (!ok) failed = true; };

for (const [kind, job] of Object.entries(JOBS)) {
  if (opt.only && opt.only !== kind) continue;
  const src = path.join(dir, job.src);
  if (!fs.existsSync(src)) { console.log(`skip ${kind}: no ${job.src}`); continue; }
  const md = fill(fs.readFileSync(src, "utf8"));
  const title = `${c.name || ""} - ${kind === "cv" ? "CV" : "Cover Letter"}`.replace(/^ - /, "");
  const html = path.join(dir, job.src.replace(/\.md$/, ".html")), pdf = path.join(dir, job.out);
  fs.writeFileSync(html, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body class="${job.cls}">\n${parse(md)}\n</body></html>`);
  const r = printPdf(html, pdf);
  if (!r.ok) {
    console.log(`${kind}: could not print a PDF (${r.reason}). The page is at ${path.relative(ROOT, html)}: open it in a browser and save it as PDF.`);
    failed = true; continue;
  }
  fs.rmSync(html);
  const pages = pageCount(pdf);
  report.files[kind] = { pdf: path.basename(pdf), pages };
  console.log(`${kind}: ${path.relative(ROOT, pdf)} (${pages ?? "page count unknown: open the PDF and count"} page${pages === 1 ? "" : "s"})`);
  if (pages !== null) check(`${kind} is at most ${job.max} page${job.max > 1 ? "s" : ""}`, pages <= job.max, `${pages}`);
  if (kind === "cv") {
    const text = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`#]/g, "");
    check("no emoji in the CV", !/\p{Extended_Pictographic}/u.test(text));
    check("email present", /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text));
    check("no unfilled {{placeholders}}", !/\{\{[A-Z_]+\}\}/.test(text));
    const kwFile = path.join(dir, "keywords.json");
    if (fs.existsSync(kwFile)) {
      const has = (term) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "iu").test(text);
      const kws = readJson(kwFile, []), found = (k) => [k.term, ...(k.synonyms ?? [])].some(has);
      const must = kws.filter((k) => k.evidence && k.priority === "must"), nice = kws.filter((k) => k.evidence && k.priority !== "must"), gaps = kws.filter((k) => !k.evidence);
      const missing = must.filter((k) => !found(k)).map((k) => k.term), leaked = gaps.filter(found).map((k) => k.term);
      check(`must-have keywords with evidence (${must.length - missing.length}/${must.length})`, missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "");
      check("no gap term claimed", leaked.length === 0, leaked.length ? "found: " + leaked.join(", ") : "");
      const niceFound = nice.filter(found).length;
      console.log(`  · nice-to-have keywords: ${niceFound}/${nice.length} · known gaps left out: ${gaps.map((k) => k.term).join(", ") || "none"}`);
      report.keywords = { must: must.length, must_found: must.length - missing.length, missing, leaked, nice: nice.length, nice_found: niceFound, coverage: must.length ? Math.round(100 * (must.length - missing.length) / must.length) : 100 };
    }
  }
}
writeJson(path.join(dir, "check-report.json"), report);
process.exit(failed ? 1 : 0);
