#!/usr/bin/env node
/* The tracker: reads my/applications/<folder>/meta.json, prints a short status and
 * writes my/tracker.html (a one-page dashboard).
 *   node scripts/tracker.mjs [--open]
 * meta.json: { company, role, url, location, salary, status, channel, fit,
 *              created, applied, events: [{ date, type, note }] }
 * status: drafting | applied | screen | interview | final | offer | rejected | ghosted | withdrawn
 * channel: cold | outreach | warm | referral */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { MY, readJson, today } from "./lib.mjs";

const dir = path.join(MY, "applications");
const apps = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
  .map((f) => ({ folder: f, ...(readJson(path.join(dir, f, "meta.json")) ?? {}) }))
  .filter((a) => a.company)
  .sort((a, b) => (b.applied || b.created || "").localeCompare(a.applied || a.created || ""));

const STAGE = { screen: 1, interview: 2, final: 3, offer: 4 };
const reached = (a) => Math.max(0, ...(a.events ?? []).map((e) => STAGE[e.type] ?? 0), STAGE[a.status] ?? 0);
const sent = apps.filter((a) => a.applied);
const days = (a) => Math.round((Date.parse(today()) - Date.parse(a.applied)) / 864e5);
const by = (key) => Object.entries(sent.reduce((m, a) => { const k = a[key] || "unknown"; (m[k] ??= []).push(a); return m; }, {}));
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "–");

console.log(`Applications: ${apps.length} (${sent.length} sent, ${apps.length - sent.length} in draft)`);
for (const a of apps.slice(0, 12)) {
  const wait = a.status === "applied" && a.applied ? ` · waiting ${days(a)} days` : "";
  console.log(`  ${(a.applied || a.created || "").padEnd(10)}  ${a.status?.padEnd(9) ?? ""}  ${a.company}: ${a.role}${a.fit ? ` · fit ${a.fit}` : ""} · ${a.channel || "cold"}${wait}`);
}
if (sent.length) {
  console.log("Replies by channel (reached a first conversation or further):");
  for (const [k, list] of by("channel")) console.log(`  ${k}: ${list.filter((a) => reached(a) >= 1).length} of ${list.length}`);
}
const due = sent.filter((a) => a.status === "applied" && days(a) >= 10);
if (due.length) console.log(`Worth a follow-up (10+ days, no reply): ${due.map((a) => a.company).join(", ")}`);

const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
const COLORS = { drafting: "#8a8a8a", applied: "#2563eb", screen: "#7c3aed", interview: "#7c3aed", final: "#b45309", offer: "#15803d", rejected: "#b91c1c", ghosted: "#6b7280", withdrawn: "#6b7280" };
const rows = apps.map((a) => `<tr><td>${e(a.applied || a.created)}</td><td><b>${e(a.company)}</b><br><span>${a.url ? `<a href="${e(a.url)}">${e(a.role)}</a>` : e(a.role)}</span></td><td><i style="background:${COLORS[a.status] ?? "#888"}">${e(a.status)}</i></td><td>${e(a.channel || "cold")}</td><td>${e(a.fit ?? "")}</td><td>${e((a.events ?? []).at(-1)?.note ?? "")}</td><td><code>${e(a.folder)}</code></td></tr>`).join("\n");
const funnel = ["applied", "screen", "interview", "final", "offer"].map((s, i) => { const n = i === 0 ? sent.length : sent.filter((a) => reached(a) >= i).length; return `<div><strong>${n}</strong><span>${i === 0 ? "sent" : s}</span><em>${i === 0 ? "" : pct(n, sent.length)}</em></div>`; }).join("");
const channels = by("channel").map(([k, l]) => `<div><strong>${l.filter((a) => reached(a) >= 1).length} / ${l.length}</strong><span>${e(k)}</span><em>got a conversation</em></div>`).join("");
fs.mkdirSync(MY, { recursive: true });
fs.writeFileSync(path.join(MY, "tracker.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Job search tracker</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;margin:0;padding:32px 16px;background:#f6f6f4;color:#1c1c1c}main{max-width:1060px;margin:auto}
h1{font-size:26px;margin:0 0 4px}p.sub{color:#666;margin:0 0 24px}h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:28px 0 10px}
.cards{display:flex;gap:10px;flex-wrap:wrap}.cards div{background:#fff;border:1px solid #e3e3df;border-radius:10px;padding:12px 16px;min-width:120px}
.cards strong{display:block;font-size:24px}.cards span{display:block}.cards em{color:#777;font-style:normal;font-size:13px}
.wrap{overflow-x:auto;background:#fff;border:1px solid #e3e3df;border-radius:10px}table{border-collapse:collapse;width:100%;min-width:760px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#777}
td span{color:#555}td i{font-style:normal;color:#fff;border-radius:99px;padding:2px 10px;font-size:13px;white-space:nowrap}code{font-size:12px;color:#777}a{color:#1d4ed8}
</style></head><body><main><h1>Job search tracker</h1><p class="sub">Updated ${today()} · ${apps.length} applications · private, on this computer only</p>
<h2>How far they got</h2><div class="cards">${funnel || "<div><span>Nothing sent yet</span></div>"}</div>
${channels ? `<h2>Which way in works</h2><div class="cards">${channels}</div>` : ""}
<h2>Applications</h2><div class="wrap"><table><tr><th>Date</th><th>Company and role</th><th>Status</th><th>Way in</th><th>Fit</th><th>Latest</th><th>Folder</th></tr>${rows || '<tr><td colspan="7">No applications yet. Give Claude a job link to start.</td></tr>'}</table></div></main></body></html>`);
console.log(`Dashboard: my/tracker.html`);
if (process.argv.includes("--open")) spawnSync(process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open", [path.join(MY, "tracker.html")]);
