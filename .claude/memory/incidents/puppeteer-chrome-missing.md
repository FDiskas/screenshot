---
name: puppeteer-chrome-missing
description: Puppeteer Could not find Chrome error fix.
keywords: [puppeteer, chrome, missing, cache, install]
created: 2026-07-04
updated: 2026-07-04
---

**Fact / Rule:** If the worker throws `Puppeteer error for <url>: Could not find Chrome...` with instructions to perform an installation, you must manually run the Puppeteer installation script.

**Why:** This happens when Puppeteer is updated, or the `~/.cache/puppeteer` directory is cleared, leaving the local Chrome binary missing for the required version.

**How to apply:** Run `npx puppeteer browsers install chrome` to fix it.
