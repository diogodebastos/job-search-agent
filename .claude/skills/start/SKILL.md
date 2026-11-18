---
name: start
description: One-time setup of the job search agent. Use this for "/start", "set me up", "get started", "I just cloned this", the first message in this folder, or whenever my/profile/facts.md does not exist yet. It checks the computer has what the scripts need, creates the private my/ folder, collects contact details and what the user is looking for, and explains the loop in plain words.
---

# start: set up the job search

Follow `CLAUDE.md` for tone: the user is probably not a programmer. Do the technical checks quietly and report only what matters.

## 1. Check the computer (don't narrate the commands)
Run these and note the results:
```bash
node --version            # need 18 or newer
ls "/Applications/Google Chrome.app" "/Applications/Microsoft Edge.app" "/Applications/Brave Browser.app" "/Applications/Arc.app" 2>/dev/null
```
- **Browser missing** (none of Chrome, Edge, Brave, Arc): PDFs can't be printed automatically. Say so in one sentence and offer two choices: install Chrome (send them to google.com/chrome), or you will prepare a page they save as PDF from Safari (File > Export as PDF).
- **Node missing or older than 18:** say "one small free tool is missing; it lets me turn your CV into a PDF and keep your tracker". Offer to walk them through installing it from nodejs.org (the "LTS" installer, a normal double-click install). If they'd rather not, carry on without it using the fallback in `CLAUDE.md`, and tell them things will be a little slower.
- Everything present: say nothing about it beyond "your computer is ready".

## 2. Create the private workspace
```bash
mkdir -p my/profile my/applications
[ -f my/profile/contact.json ] || cp templates/profile/contact.json templates/profile/preferences.json my/profile/
[ -f my/learnings.md ] || printf '# My learnings\n\nWhat my own applications have taught me. Newest first. These overrule LEARNINGS.md.\n' > my/learnings.md
```
Don't copy the example `facts.md` or `master-cv.md`: `/grill-cv` writes the real ones.
Tell the user: everything about them stays in a folder called `my` on this computer. It is never uploaded or shared.

## 3. Contact details (one question at a time)
Ask for, and write into `my/profile/contact.json`: full name as it should appear on the CV, email, phone (with country code; optional), city and country, LinkedIn link (optional), website or portfolio (optional). Remove the example values.

## 4. What they are looking for
Ask, one at a time, and write into `my/profile/preferences.json`:
1. What kind of role do you want next? (titles, in their words)
2. Any companies you already have in mind?
3. Where: which cities, and office, hybrid or remote?
4. Which languages can you work in?
5. What is the lowest pay you would accept? Explain why you ask ("so I can warn you before you spend time on a role that pays less; it stays on this computer"). Record the amount with its period exactly as they think about it (per month or per year, gross or net). They may skip it.
6. Anything that would make you say no to a job? (deal-breakers)
7. Which country's job market? Set `market` to the matching file name in `markets/` if one exists; otherwise note the country and work without a market note.

## 5. Explain the loop, briefly
In your own words, no more than this:
- First we make your CV much stronger. I read it, ask you hard questions, and rewrite it using only what you tell me is true. (That's `/grill-cv`; about 30 to 45 minutes, once.)
- Then, for every job you like, you send me the link. I study it, tell you honestly how well you fit, and prepare a tailored CV, a cover letter and the form answers. You send them.
- I can also restyle the CV in the company's own look, and I keep a tracker of everything.
- I never send anything myself, and I never write anything about you that you haven't confirmed.

## 6. Next step
Ask them to share their current CV: drag the file into the chat (PDF or Word), paste the text, or say they have none. Then run `/grill-cv`.
