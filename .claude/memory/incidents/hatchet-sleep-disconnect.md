---
name: hatchet-sleep-disconnect
description: Hatchet worker fails with ECONNREFUSED after computer sleep or long event loop block.
keywords: [hatchet, econnrefused, heartbeat, sleep, event loop, connection dropped]
created: 2026-07-04
updated: 2026-07-04
---

**Fact / Rule:** Hatchet SDK will drop the connection and might fail to reconnect (`ECONNREFUSED` / `Dispatcher/Heartbeat UNAVAILABLE`) if the heartbeat is delayed for a long time (e.g., >40s).

**Why:** This happens most commonly during local development when the computer goes to sleep (which pauses the Node.js event loop). When it wakes up, Hatchet tries to send a heartbeat that is deeply delayed, the server drops the connection, and local network/DNS state after waking up might temporarily block the reconnect.

**How to apply:** If you see `Heartbeat interval delay (... >> 4000ms)` followed by `ECONNREFUSED` in local development, it is a transient environmental issue. Stop the dev server (`Ctrl+C`) and start it again.
