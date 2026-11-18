#!/usr/bin/env node
/* Brand-styled CV and cover letter, built from the application's cv.md and
 * cover-letter.md. This file is a TEMPLATE (brand-cv skill). Copy it with
 * art.mjs into <application>/brand/, then rewrite THEME, the CSS and the
 * artwork for the company you studied.
 *
 *   node my/applications/<folder>/brand/build.mjs
 *
 * It writes cv.html, letter.html and both PDFs next to itself.
 * The layout below is one example: a centred name as the hero, the contact
 * line as a nav bar, a dithered banner, hairline sections, a frame. A company
 * with different habits needs a different layout, not just new colours. */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { banner, card, GLYPHS } from "./art.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
let ROOT = APP;
while (!fs.existsSync(path.join(ROOT, "scripts", "md.mjs"))) { const up = path.dirname(ROOT); if (up === ROOT) throw new Error("run this from inside the job-search-agent folder"); ROOT = up; }
const { parse, inline } = await import(pathToFileURL(path.join(ROOT, "scripts", "md.mjs")));
const { contact: readContact, printPdf, pageCount } = await import(pathToFileURL(path.join(ROOT, "scripts", "lib.mjs")));
const me = readContact();

/* ---- THEME: what a new company changes first ------------------------------ */
const THEME = {
  company: "Example Company",
  role: "Job Title",
  accent: "#0000F2",   // name, links, labels, frame
  ink: "#000091",      // body text and section titles
  paper: "#F2F2F2",    // page background
  display: { family: "Oswald", file: "fonts/Oswald.woff2", weights: "200 700" },
  body: { family: "Mona Sans", file: "fonts/MonaSans.woff2", weights: "200 900", stretch: "75% 125%" },
  splitBefore: null,   // markdown heading where page 2 of the CV starts, e.g. "### Agency Y"; null = one page
  bannerRows: { cv: 79, letter: 54, field: 118 }, // art height in cells (465 wide)
  glyphs: [GLYPHS.chart, GLYPHS.smile, GLYPHS.prompt], // footer cards; the middle one is also the nav badge
  colophon: "Artwork: original, drawn in code for this application",
  dated: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
};
/* --------------------------------------------------------------------------- */
const T = THEME, name = me.name || "Your Name";
const short = (u) => (u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const navItems = [me.location, me.email && `<a href="mailto:${me.email}">${me.email}</a>`, me.phone, ...[me.website, me.portfolio, me.linkedin].filter(Boolean).map((u) => `<a href="${u}">${short(u)}</a>`)].filter(Boolean);
const half = Math.ceil(navItems.length / 2);
const badge = card(T.glyphs[1], { ink: T.accent, paper: T.paper, fill: true });
const nav = `<nav><div>${navItems.slice(0, half).map((x) => `<span>${x}</span>`).join("")}</div><span class="logo">${badge}</span><div>${navItems.slice(half).map((x) => `<span>${x}</span>`).join("")}</div></nav>`;
const cards = `<span class="cards">${card(T.glyphs[0], { ink: T.accent, paper: T.paper })}${badge}${card(T.glyphs[2], { ink: T.accent, paper: T.paper })}</span>`;
const footer = (left, right) => `<footer><div>${left}</div>${cards}<div class="r">${right}</div></footer>`;
const art = (rows, seed) => banner(465, rows, { seed, ink: T.accent });

const css = `
@font-face{font-family:"Body";src:url("${T.body.file}") format("woff2");font-weight:${T.body.weights};${T.body.stretch ? `font-stretch:${T.body.stretch}` : ""}}
@font-face{font-family:"Display";src:url("${T.display.file}") format("woff2");font-weight:${T.display.weights}}
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;background:${T.paper}}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:9mm 14mm 0;break-after:page;background:${T.paper};color:${T.ink};font:400 8.6pt/1.4 "Body",Arial,sans-serif}
.page:last-child{break-after:auto}
.page::after{content:"";position:absolute;inset:0;border:1mm solid ${T.accent};pointer-events:none}
a{color:${T.accent};text-decoration:none}
nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font:500 6.3pt/1 "Body",Arial,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.09em;color:${T.accent};white-space:nowrap}
nav div{display:flex;justify-content:space-around;gap:2mm}
nav .logo svg{height:10.5mm;display:block;margin:0 3mm}
.kicker{font:700 5.6pt/1 "Body",Arial,sans-serif;font-stretch:125%;text-transform:uppercase;letter-spacing:.04em;color:${T.accent};text-align:center}
h1{font:300 var(--name,64pt)/0.98 "Display","Arial Narrow",sans-serif;text-transform:uppercase;color:${T.accent};text-align:center;margin:1.6mm 0 0;white-space:nowrap}
.lede{text-align:center;max-width:156mm;margin:2.6mm auto 0;font-size:9pt;line-height:1.38}
.banner{margin:3.6mm 0 0;border-radius:1mm;overflow:hidden;height:var(--bh,31mm)}
.banner svg,.field svg{display:block;width:100%;height:100%}
h2{font:300 19pt/1 "Display","Arial Narrow",sans-serif;text-transform:uppercase;color:${T.ink};margin:3.4mm 0 1.6mm;padding-top:2.8mm;border-top:.25mm solid color-mix(in srgb, ${T.ink} 14%, transparent)}
h2 a{color:inherit}
h3{font:500 9.6pt/1.1 "Body",Arial,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.05em;color:${T.accent};margin:2.6mm 0 .5mm}
p{margin:0 0 1mm}
h3+p{font-size:7.9pt;margin-bottom:.9mm}
strong{font-weight:650}
ul{margin:0 0 1.2mm;padding:0;list-style:none}
li{position:relative;padding-left:3.1mm;margin:0 0 .62mm}
li::before{content:"";position:absolute;left:.5mm;top:.52em;width:.9mm;height:.9mm;background:${T.accent}}
footer{position:absolute;left:14mm;right:14mm;bottom:6.2mm;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;font:400 6pt/1.5 "Body",Arial,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.05em;color:${T.ink}}
footer .r{text-align:right}
.cards svg{height:7.4mm;margin:0 1.1mm;vertical-align:bottom}
.minihead{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font:500 6.3pt/1 "Body",Arial,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.09em;color:${T.accent};margin-bottom:1mm}
.minihead .logo svg{height:8mm;display:block}
.minihead .r{text-align:right}
.field{position:absolute;left:14mm;right:14mm;bottom:19mm;height:46mm;border-radius:1mm;overflow:hidden}
.letter{--name:50pt;--bh:21mm}
.letter .body{max-width:148mm;margin:8mm auto 0;font-size:10pt;line-height:1.56}
.letter .body p{margin:0 0 3.1mm}
.letter .date{font:500 6.6pt/1 "Body",Arial,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.09em;color:${T.accent};margin-bottom:4.5mm}
.letter .sign{font:300 22pt/1 "Display","Arial Narrow",sans-serif;text-transform:uppercase;color:${T.accent};margin-top:2mm}
`;

const fill = (md) => md.replaceAll("{{PHONE}}", me.phone || "").replaceAll("{{EMAIL}}", me.email || "");
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildCv() {
  const md = fill(fs.readFileSync(path.join(APP, "cv.md"), "utf8"));
  const blocks = md.split(/\n(?=## )/);
  const summaryBlock = blocks.find((b) => /^## (Summary|Profile|Resumo|Perfil)/i.test(b));
  const summary = summaryBlock ? summaryBlock.replace(/^## .*\n/, "").trim() : "";
  const rest = blocks.filter((b) => b.startsWith("## ") && b !== summaryBlock).join("\n");
  const [p1, p2] = T.splitBefore ? rest.split(new RegExp("\\n(?=" + esc(T.splitBefore) + ")")) : [rest, null];
  const pages = p2 ? 2 : 1;
  return page(`${name} - CV`, `
<section class="page">
  ${nav}
  <div class="kicker" style="margin-top:6mm">Curriculum vitae · ${T.role}</div>
  <h1>${name}</h1>
  <div class="banner">${art(T.bannerRows.cv, 7)}</div>
  ${summary ? `<p class="lede">${inline(summary)}</p>` : ""}
  ${parse(p1)}
  ${footer(`${name}<br>${T.dated}`, `${pages === 1 ? T.colophon + "<br>" : "Curriculum vitae<br>"}Page 1 / ${pages}`)}
</section>${p2 ? `
<section class="page">
  <div class="minihead"><span>${name}</span><span class="logo">${badge}</span><span class="r">${T.role}</span></div>
  ${parse(p2)}
  <div class="field">${art(T.bannerRows.field, 23)}</div>
  ${footer(T.colophon, "Curriculum vitae<br>Page 2 / 2")}
</section>` : ""}`);
}

function buildLetter() {
  const md = fill(fs.readFileSync(path.join(APP, "cover-letter.md"), "utf8"));
  const paras = md.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  const date = paras[2].split("·")[0].trim();
  const body = paras.slice(3).map((p) => `<p>${inline(p).replace(/<br>\n?/g, "<br>")}</p>`);
  const signoff = body.pop();
  return page(`${name} - Cover Letter`, `
<section class="page letter">
  ${nav}
  <div class="kicker" style="margin-top:7mm">Cover letter · ${T.role}</div>
  <h1>${name}</h1>
  <div class="banner">${art(T.bannerRows.letter, 7)}</div>
  <div class="body">
    <div class="date">${date} · To the ${T.company} team</div>
    ${body.join("\n")}
    <p>${signoff.replace(/^<p>|<\/p>$/g, "").split("<br>")[0]}</p>
    <div class="sign">${name}</div>
  </div>
  ${footer(T.colophon, "Cover letter<br>Page 1 / 1")}
</section>`);
}

const file = name.trim().replace(/[^\p{L}\p{N}]+/gu, "_");
for (const [kind, build, src, out] of [["cv", buildCv, "cv.md", `${file}_CV.pdf`], ["letter", buildLetter, "cover-letter.md", `${file}_Cover_Letter.pdf`]]) {
  if (!fs.existsSync(path.join(APP, src))) { console.log(`skip ${kind}: no ${src}`); continue; }
  const h = path.join(HERE, `${kind}.html`), pdf = path.join(HERE, out);
  fs.writeFileSync(h, build());
  const r = printPdf(h, pdf);
  if (!r.ok) { console.log(`${kind}: could not print (${r.reason}). Open ${path.relative(ROOT, h)} in a browser and save as PDF, with background graphics on.`); continue; }
  console.log(`${kind}: ${path.relative(ROOT, pdf)} (${pageCount(pdf) ?? "?"} pages). Now read it: fixed pages cut overflow silently.`);
}
