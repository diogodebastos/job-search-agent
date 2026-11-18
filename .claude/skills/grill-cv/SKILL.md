---
name: grill-cv
description: Question the user's CV hard and rebuild it substantially stronger, from facts they confirm. Use this for "/grill-cv", "grill my CV", "improve my CV", "review my resume", "is my CV any good", when the user attaches or pastes a CV, after /start, or before the first /apply when my/profile/facts.md is missing. It critiques the current CV honestly, interviews the user one question at a time to pull out scope, numbers and proof, records every confirmed fact and every gap, and writes a new master CV. "grill-cv more" continues an earlier session; "grill-cv <job or role>" focuses the questions on a target role.
argument-hint: [more | <target role>]
---

# grill-cv: from a list of duties to a CV that proves things

Most CVs describe a job. A strong CV proves what the person did with it. The gap between the two is information only the user has, so this skill is mostly an interview. Follow `CLAUDE.md`: plain language, one question at a time, never invent.

**Outputs** (all in `my/profile/`):
- `facts.md`: every confirmed fact with an ID, plus a "Gaps: never claim" list. Shape: `templates/profile/facts.md`.
- `master-cv.md`: the full, plain CV built only from those facts. Shape: `templates/profile/master-cv.md`.
- `cv-review.md`: the honest review of the CV they arrived with (kept so they can see the distance travelled).

## 1. Take in what exists
- Read the CV they shared (PDF, Word, pasted text). If they have none, start from a conversation: "Tell me your jobs in order, most recent first."
- Optional extras, if they offer: a LinkedIn profile export or pasted "About" and "Experience" text, a portfolio link, old performance reviews, a job description of their current role. Don't ask for all of these; mention once that any of them helps.
- Read `my/profile/preferences.json` for the roles they want. If it's missing, run `/start` first.
- Look up `markets/<market>.md` if it exists.

## 2. Review it honestly → `my/profile/cv-review.md`
Score each of these from 1 to 5 and give one concrete example from their own text for each:

| Dimension | What a 5 looks like |
|---|---|
| Evidence | Most bullets carry a result with a number, and say how it was measured |
| Ownership | It is clear what *they* did, decided or built, not what the team or the job did |
| Scope | Budget, team size, audience, volume, number of clients or markets are stated |
| Relevance | The top third of page one speaks to the roles they want now |
| Clarity | Short plain sentences, no buzzwords, no internal jargon |
| Structure | Standard headings, newest first, right length, consistent dates |
| Readable by software | One column, real text, no tables, text boxes, icons or skill bars |

Then show the user:
- The overall picture in three sentences. Be kind and direct: name the biggest problem first.
- The **three weakest lines**, quoted, each with why it is weak ("this describes the job, not you", "no number", "what does 'managed' mean here?").
- What is already good. There is always something.
- What happens next: "I'm going to ask you questions to find what's missing. Say 'skip' if you don't know or don't want to answer, and 'enough for today' whenever you like."

## 3. The grill
Go role by role, newest first, spending most time on the last 5 years. Use `references/question-bank.md` for the questions and the profession-specific prompts. Rules:

- **One question per message.** Short. Say why when it isn't obvious.
- **Chase the vague word.** "Managed", "helped", "responsible for", "worked on", "supported" each hide a fact. Ask what they actually did.
- **Ask for the number, then for the proof.** "Roughly how much?" then "How do you know? Where would that number come from?" then "Could you explain it to an interviewer who pushes?" If they can't defend it, record it as an approximate or qualitative fact, or leave the number out.
- **Never suggest a number.** Offer ranges only as a memory aid ("closer to 10 or to 100?"), and record what they say, with "about" if they said about.
- **Their share, honestly.** When a result was a team's, ask what part was theirs. "Part of a team of 5 that..." is a good fact.
- **Listen for buried gold.** Things people leave out: training colleagues, fixing a process, being the one who is asked, a side project, a result everyone took for granted. Ask "What would break if you left tomorrow?" and "What are you asked for help with?"
- **Record as you go.** After each answer, write the fact to `facts.md` with a new ID and `you, <today's date>`. Don't wait for the end.
- **Confidential things.** If they hesitate over a client name or figure, ask what wording is safe and record that wording.
- **Gaps are facts too.** When they say "no, I've never done that", write it under "Gaps: never claim". This list protects them later.
- **Pace.** About 20 to 30 questions in a first session. Every 8 or so, give a one-line recap of what you've captured so they see progress. Stop when they tire; `grill-cv more` picks up where `facts.md` is thin.

End the session with three questions about the target, if not already answered: which of their achievements they are proudest of, what they want more of in the next job, and what they want less of.

## 4. Write the master CV → `my/profile/master-cv.md`
This is the superset: everything true and worth saying, in the plain format. Tailored CVs are cut from it later.
- Contact line with `{{EMAIL}}` and `{{PHONE}}` placeholders (the render script fills them from `contact.json`).
- **Summary:** 3 to 4 lines. Who they are professionally, the scale they work at, their best proven result, what they are looking for. No adjectives that a fact doesn't back.
- **Experience:** newest first. Company, **title**, place, month-year dates. Bullets shaped **verb + what + how + result**. Lead with the strongest. Current role 5 to 8 bullets, older roles fewer, roles over 10 years old one line.
- **Skills:** grouped lines of things they can defend (tools, methods, languages). No rating bars, no "team player".
- **Education**, then certifications, then anything that earns its place (talks, volunteering, side projects).
- Write it in the language they will mostly apply in; note in the file if a second-language version will be needed.
- Every bullet must trace to fact IDs. Keep a list at the bottom of `cv-review.md` under "Where each line comes from".

Banned: invented or rounded-up numbers, "responsible for", "various", "etc.", "passionate", "results-driven", "dynamic", any skill from the Gaps list, and any sentence they couldn't say out loud with a straight face.

## 5. Render and look
```bash
mkdir -p my/profile/master && cp my/profile/master-cv.md my/profile/master/cv.md && node scripts/render.mjs my/profile/master
```
Read the PDF yourself (page count, nothing cut, no orphaned heading at the foot of a page), fix, then open it for the user.

## 6. Show the difference
- Three before-and-after pairs: their old line, the new line, and the fact that made the difference.
- New scores on the same seven dimensions, honestly (some may not have moved).
- What is still thin, and the two or three questions that would fix it next time.
- If their LinkedIn is out of step with the new CV, offer to draft the headline, About and the top role for them to paste. Don't automate LinkedIn.
- Then: "When you find a job you like, send me the link."

## When facts change
A new job, a new result, a correction: update `facts.md` first (strike through what's no longer true), then `master-cv.md`, then re-render. If a correction lowers a number that already went out in an application, tell the user which applications used it.
