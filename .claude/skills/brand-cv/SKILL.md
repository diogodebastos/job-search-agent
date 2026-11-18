---
name: brand-cv
description: Restyle the user's finished CV and cover letter in the target company's own visual language, so they read as if they came from inside the team. Use this for "/brand-cv", "style my CV like their website", "make it look like <company>", "give it their colours and fonts", "make it stand out", or after /apply when a person (not only software) will open the files. It studies the company's site, distils the style into brand notes, draws original artwork in that style, and builds styled PDFs next to the plain ones.
argument-hint: <application folder or company> [site url]
---

# brand-cv

**Goal:** the CV and cover letter look like the company made them, while every word stays the one in the application's `cv.md` and `cover-letter.md`.

Worked examples of the distilled notes: `examples/nous-research.md` (an illustrated, two-colour site) and `examples/cloudflare.md` (a site with no illustration at all).

| What | Path |
|---|---|
| Template build script (THEME block, CSS, page layout) | `.claude/skills/brand-cv/template/build.mjs` |
| Artwork toolkit (1-bit dither canvas, glyph cards) | `.claude/skills/brand-cv/template/art.mjs` |
| Site measurements and screenshots | `node scripts/study-site.mjs <url> <folder>` |
| Open-licence fonts | `node scripts/fetch-fonts.mjs <folder> "<families>"` |
| Output, per application | `my/applications/<folder>/brand/` |

## Hard rules
1. **Same words.** Styled PDFs are built from the application's `cv.md` and `cover-letter.md`. Never edit text inside `brand/`. Any extra line the design adds (a caption, a label, a panel) must be a fact from `facts.md`.
2. **Their style, never their assets.** Take colours, type, layout habits and illustration technique. Never use the company's logo, wordmark, mascot, icons, photos or illustrations, never trace them, and never use their slogan as the user's own. All artwork is original, drawn in code, with subjects from the user's own work.
3. **No false affiliation.** The documents say "Curriculum vitae" and "Cover letter" and name the role applied for. Nothing may suggest the user already works there: no staff-badge, business-card or "team member" look.
4. **Fonts must be licensed.** Use the company's font only if it is open-licence (SIL OFL, Apache). If it is commercial, a trial or custom-made, choose the closest open font and note the substitution. Never download font files from the company's site.
5. **Keep the plain version.** It stays in the application folder as the fallback. For a site that reads résumés by software, upload the styled CV only if its text is intact (step 6); otherwise upload the plain one and use the styled one for email and for people.
6. **You prepare; the user sends.**

## Steps

### 1. Preconditions
The application has a finished `cv.md` and `cover-letter.md` whose plain PDFs pass `scripts/render.mjs`. If not, finish `/apply` first. Tell the user what you're about to do in one sentence and that it takes a few minutes.

### 2. Study the site (do not guess from memory)
For the **home page, the careers or job page, and one product or "about" page**:
```bash
node scripts/study-site.mjs <url> my/applications/<folder>/brand/study/<page-name>
```
Each run writes `study.json` and two screenshots (`top.png`, `tall.png`). Read all of them.
- **The screenshots decide; the numbers explain.** `study.json` counts what the site's style files *contain*, which includes things no page shows. Use it to name what you see: the exact colour codes, the real font family names, the letter-spacing and case of labels.
- `fontFaces` is the reliable list of fonts the site loads. `googleFonts` means the font is free to use.
- If a browser tool is available in this session (Claude in Chrome, a built-in browser, Playwright), use it as well: scroll the page and measure the real fonts and colours on screen. It sees things the script can't, such as styles built by the page's own code.
- If the site blocks the script or the screenshots are blank, ask the user for two or three screenshots dragged into the chat.
- Screenshots follow the computer's light or dark setting. If the site has both modes, pick the one its marketing pages use by default.

Look for and write down:
- **Colour:** paper, ink, accent, and how many colours they really use.
- **Type roles:** display face, label face, body face; case, weight, spacing; how big the biggest text is against the page.
- **Layout habits:** centred or left-aligned, frames and borders, dividers, corner radius, density, what the nav and footer look like.
- **Imagery:** the technique (dither, halftone, line art, 3D, photography, gradients, UI diagrams, none), its palette, its recurring subjects, where it sits.
- **Small signatures:** badges, pills, kickers, bullets, button shapes, icons.

### 3. Write `brand/brand-notes.md`
One page, in the shape of the files in `examples/`. The last two lines matter most:
- **Mapping:** how each of their habits becomes part of a CV (their hero title → the name; their nav → the contact line; their feature panel → the summary).
- **Not used:** what you deliberately left out (logo, mascot, slogan).

### 4. Copy the template and theme it
```bash
mkdir -p my/applications/<folder>/brand && cp .claude/skills/brand-cv/template/*.mjs my/applications/<folder>/brand/
node scripts/fetch-fonts.mjs my/applications/<folder>/brand/fonts "family=Oswald:wght@200..700&family=Mona+Sans:wdth,wght@75..125,200..900"
```
Then edit `brand/build.mjs`:
- **`THEME` first:** company, role, the three colours, the font files, `splitBefore` (the markdown heading where page 2 starts; `null` for a one-page CV), art heights, footer glyphs, colophon.
- **The CSS next.** The template is one layout (centred name, nav row, banner, hairline sections, frame). A company with different habits needs a different layout: left-aligned header, cards, a side column, a serif body, no frame, no banner. Rewrite freely. Keep the page mechanics: `.page` at 210×297mm, `@page{margin:0}`, `print-color-adjust:exact`, the absolute footer.
- The CSS calls the fonts "Display" and "Body"; point `THEME.display.file` and `THEME.body.file` at the files you fetched. Ask for variable ranges (`wght@300..700`): the script keeps one file per family.

### 5. Draw the artwork in `brand/art.mjs`
- Match their **technique**; choose the **user's subjects**. A marketer: a results chart, a campaign calendar, a phone showing a post, an audience map. An engineer: a terminal, a diagram of what they built. A designer: their own grid and type.
- If the site has **no illustration**, don't add any. Borrow its diagrams and panels instead, and fill them with the user's facts (see `examples/cloudflare.md`).
- The toolkit: `canvas(cols, rows)` gives `glow`, `rect`, `ellipse`, `line`, `sparkle`, `stars`, `rain`, `sprite`, `paint`, then `toSVG({ ink, paper })`. Draw 12×12 glyphs as rows of "X" and ".".
- For another technique, write a new generator with the same exports (`banner(cols, rows, opts)`, `card(glyph, opts)`): strokes for line art, circles on a grid for halftone, blurred shapes for gradients.
- Look at the art alone before laying out: write the SVG into a small HTML page, screenshot it with `scripts/lib.mjs`'s `screenshot()`, and read the image. Expect two or three rounds.

### 6. Build, look, fix
```bash
node my/applications/<folder>/brand/build.mjs
```
**Read every page of both PDFs.** Check:
- The CV is 1 or 2 full pages and the letter exactly 1. Pages are fixed-size, so overflow is **cut off silently**: confirm the last line of every page is there and clear of the footer. Move `splitBefore` if a page is too full.
- No large empty area: raise the type size first, then add a closing art field.
- Nav items don't collide, nothing wraps awkwardly, labels fit their boxes.
- The text is intact: every sentence of `cv.md` appears, with the email, phone and links. If `pdftotext` is installed, compare its output with the plain CV's; otherwise read the PDF's text.
- It is comfortable to read on a laptop and on paper. Decoration never beats legibility.

### 7. Hand over
- Open both PDFs for the user and tell them, in plain words: what you took from the company's site, which fonts you substituted and why, and what you left out on purpose.
- Update `form-answers.md` (or the email draft) to name the styled files, with the plain ones as the fallback.
- Add an event to `meta.json` and the files under `files` (`cv_styled`, `letter_styled`).
- Delete `brand/study/` screenshots if the user wants the folder tidy; keep `brand-notes.md`.

## What has worked
- Measure before you design. Eyeballing misreads fonts: what looked like a monospace label was a condensed sans.
- The name set in their display face, at their scale, does most of the work. The rest is restraint: their two or three colours, their hairlines, their spacing.
- Use the site's own structure as the CV's: nav → contact line, hero → name, feature panel → summary, footer → footer.
- Artwork that carries the user's own story reads as theirs, in the company's hand.
- A small colophon ("original artwork, drawn in code for this application") turns the styling into a portfolio piece, and makes clear nothing was lifted.
- First-render faults to expect: colliding nav items, lines overflowing a panel, wrapping footers, too much empty space.
