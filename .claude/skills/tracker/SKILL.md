---
name: tracker
description: Open the job-search tracker and report where every application stands. Use this for "/tracker", "open the tracker", "show my applications", "how is my job search going", "what should I follow up on", or "what's next".
---

# tracker

1. Run `node scripts/tracker.mjs --open`. It prints a status and opens `my/tracker.html`, a one-page dashboard, in the browser.
2. Relay the status in plain words: how many sent, what's waiting and for how long, which way in has worked so far.
3. Suggest at most two next actions, for example: a follow-up that is due (10+ working days without a reply), an outcome to log (`/apply update`), or a way in to look for before the next application.

This skill only reads. Outcomes are logged with `/apply update <company> <what happened>`.
If Node is missing, read each `my/applications/*/meta.json` yourself and give the same summary in chat.
