---
name: apply
description: Prepare a complete job application from a link. Use this for "/apply", any job posting link or pasted job description, "apply to this", "what do you think of this job", "tailor my CV for", logging what happened to an application ("they rejected me", "I got an interview", "no reply"), "find me jobs at <company>", or "what have we learned". It reads the posting, scores the fit honestly, writes a tailored CV and cover letter only from the user's confirmed facts, prepares form answers and outreach notes, and records the application in the tracker.
argument-hint: <job link or pasted posting> · update <company> <what happened> · find <company or keywords> · retro
---

# apply

Follow `CLAUDE.md`: plain language, the truth rule, and **you prepare, the user sends**.

## Mode: a job link or pasted posting

### 1. Before you start
- `my/profile/facts.md` and `my/profile/master-cv.md` must exist. If not, say the CV comes first and run `/grill-cv`.
- Read `LEARNINGS.md` and `my/learnings.md`. Rules in the user's own file overrule the general ones.
- Read `my/profile/preferences.json` and, if set, `markets/<market>.md`.

### 2. Get the posting
- Fetch the link. Many job sites block robots or need a login (LinkedIn especially). If you get no real text, don't guess: ask the user to open the page, select all, copy and paste it here.
- If the page shows application form questions, note them too.
- Create the folder `my/applications/<today>-<company>-<short-role>/` (lowercase, hyphens) and save:
  - `posting.md`: title, company, link, location, work mode, pay if stated, the date, then the full text. The original wording, in its original language.
  - `meta.json`: `{ "company", "role", "url", "location", "salary", "status": "drafting", "channel": "cold", "created": "<today>", "applied": null, "fit": null, "events": [{ "date", "type": "drafting", "note" }] }`

### 3. Analyse → `analysis.md`, and tell the user what you found
- **Requirements table:** requirement · must or nice · evidence (fact IDs) · strength (strong / partial / none) · how the CV will show it.
- **Fit score out of 100**, worked out the same way every time so applications can be compared:
  - 70 × must-haves (strong 1, partial 0.5, none 0, averaged)
  - plus 20 × nice-to-haves, same way
  - plus 10 × practical fit (location and work mode, language, seniority, and pay against the floor: 1 fine, 0.5 doubtful, 0 a deal-breaker)
- **Pay:** compare any stated band with the floor in `preferences.json`. If the top of the band is under the floor, say so before doing anything else and ask whether to continue (L-08).
- **Gaps:** each with an honest way to handle it. A must-have with no evidence is a gap; never paper over it.
- **A new question for the user**, if the posting asks for something `facts.md` is silent on: "Have you ever done X?" A yes becomes a new fact (written first, then used). A no goes on the Gaps list.

Then give the user the verdict in a few sentences: the score, the two strongest matches, the gaps, and your honest recommendation (go, go but find a way in first, or skip). Wait for their go-ahead only if you recommend skipping or the pay is under the floor; otherwise continue.

### 4. Keywords → `keywords.json`
`[{ "term", "synonyms": [], "priority": "must" | "nice", "evidence": "F-…" | null }]`
- Use the posting's own words ("Google Ads", "stakeholder management").
- Gap terms get `"evidence": null`: the check then fails if one slips into the CV.

### 5. The way in
Before writing, look for a route that isn't cold (L-01 to L-05):
- Ask the user: "Do you know anyone who works there, used to, or knows someone who does?" Also: who posted the job, and is the team findable on LinkedIn?
- Set `channel` in `meta.json`: `referral` (someone will refer them), `warm` (someone inside knows them and knows they're applying), `outreach` (a note to a stranger), or `cold`.
- Don't hold the application hostage to this: ten minutes of looking, then move on.

### 6. Tailored CV → `cv.md`
Cut it from the master CV: select, reorder, trim. Follow `references/cv-style.md`. In short:
- The posting's must-haves appear in the summary and the first bullets, in the posting's words, **only where a fact supports them**.
- At most 2 pages: plan about 80 lines from the first draft.
- Keep the `{{EMAIL}}` and `{{PHONE}}` placeholders.
- Same language as the posting.

### 7. Cover letter → `cover-letter.md`
Follow `references/cover-letter.md`: 250 to 350 words, one page, a real opening, two or three requirements matched to evidence, **one honest gap line**, a simple close. Skip it only if the form has no place for one and the user agrees.

### 8. Make the PDFs and check them
```bash
node scripts/render.mjs my/applications/<folder>
```
Fix the markdown until every check passes. Then **read both PDFs yourself**: page count, nothing cut off, no heading stranded at the bottom of a page.

### 9. Truth audit
In `analysis.md` under "Truth audit", list every CV bullet and every letter claim with its fact IDs. If a line has no ID, remove it or ask the user.

### 10. Form answers → `form-answers.md`
One block per form field, in order, ready to paste: contact details, links, work authorisation (from facts), notice period and salary expectation (ask the user the first time; record their answer in `preferences.json`), "how did you hear about us" (truthful), and any free-text questions drafted from facts. Mark anything the user must decide themselves.

### 11. Outreach → `outreach.md`
Two or three short notes for the user to send themselves, on the day they apply:
- to a contact, or to someone on the team, or to the person who posted the job;
- at most 300 characters each for a LinkedIn connection note (count them);
- specific to the role, built from facts, in the reader's language;
- ask a real question about the work, not for a job (L-05);
- if someone offers to refer them, include a two-line blurb that person can paste.

### 12. Review together
Open the PDFs for the user. Summarise: the fit score, what the CV leads with, the gap the letter admits, and anything you were unsure about. Apply their edits, re-render, re-check.
Offer `/brand-cv` when a person is likely to open the files (smaller companies, agencies, creative and marketing roles, applications by email).

### 13. The user sends it
Tell them exactly what to do, as a short numbered list: which files to upload, which answers to paste, which note to send to whom. When they confirm it's sent, update `meta.json` (`status: "applied"`, `applied: <today>`, an `applied` event, `fit`, and `files`) and run `node scripts/tracker.mjs`.

## Mode: `update <company> <what happened>`
Events and the status each sets: `screen` (first call with a recruiter) → `screen` · `interview` → `interview` · `final` → `final` · `offer` → `offer` · `rejected` → `rejected` · `ghosted` (no reply after about 6 weeks; ask first) → `ghosted` · `withdrawn` → `withdrawn` · `outreach` and `follow-up` (a note sent or answered) leave the status alone.
- Add `{ date, type, note }` to `events`, set `status`.
- **Learn from it:** add one or two lines to `my/learnings.md` as "what happened → what to do next time". Be specific: how many days, which way in, what was different.
- For a rejection: be kind first. Then one useful observation, not five.
- For an interview: write `interview-prep.md` in the application folder: what they will likely ask given the posting, a story from `facts.md` for each (situation, what you did, result), the probable questions about each gap with honest answers, and three good questions to ask them. Offer to practise: you ask, one question at a time, and give frank feedback.
- For an offer: compare the whole package with the floor and the preferences, list what to ask before saying yes, and remind them the decision is theirs.

## Mode: `find <company or keywords>`
- Look at the company's own careers page first; job boards go stale. Search the web for "<company> careers" plus the role, never with the user's personal details.
- List what's open that matches `preferences.json`: title, location, link, pay if stated, and a one-line reason it could fit. Mark anything under the pay floor.
- Recommend one or two to apply to. Don't start an application until the user picks.

## Mode: `retro`
After every five or so applications, or when asked "what have we learned":
- Read every `meta.json` and `my/learnings.md`. Run `node scripts/tracker.mjs`.
- Report: how many sent, replies by way in, average fit of those that got a reply against those that didn't, typical days to a reply. Say plainly that small numbers prove little.
- Propose two or three concrete changes (which roles, which way in, what in the CV), each tied to something that happened. Write the ones the user accepts into `my/learnings.md`.
