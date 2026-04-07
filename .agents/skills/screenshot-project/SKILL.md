---
name: screenshot-project
description: Project-specific guidance for the screenshot service (Bun + Hono + Puppeteer + Sharp), including API behavior, caching strategy, image pipeline, and known decisions discovered during implementation.
---

# Screenshot Project Skill

Use this skill when working on this repository's screenshot capture, caching, API routes, docs, and UI behavior.

## Stack And Structure

- Runtime/server: Bun + Hono
- Capture orchestration: Puppeteer in `src/lib/screenshot.ts`
- DNS behavior and browser DNS launch config: `src/lib/dns.ts`
- Image processing: Sharp in `src/lib/screenshot.ts`
- Cache/index model: file system only (no DB metadata for dimensions)
- Main routes: `src/server.tsx`
- Docs page: `src/components/DocsPage.tsx`
- Landing demo behavior: `src/components/LandingPage.tsx`
- Config source of truth: `src/config.ts`

## Critical Product Decisions

1. Capture target is domain-only
- Input URL is normalized to hostname and captured as `https://<hostname>`.
- Path/query/hash should not be used for capture identity.

2. Main API should return image bytes
- `GET /api/screenshot` should return PNG bytes directly when cached.

3. Redirect API is separate
- `GET /api/raw` is the redirect-style endpoint (302 to static image path).

4. No cache-buster query params in examples/UI
- Do not append `&t=<timestamp>` in docs or landing scripts.
- Allow browser caching to reduce server load.

5. Cache headers must come from config
- Use `CONFIG.cache.maxAgeMs` as the source for cache lifetime.
- Cached image responses should include `Cache-Control: public, max-age=<seconds>, immutable`.
- Placeholder/error processing images should be non-cacheable (`no-store, no-cache, must-revalidate`) to avoid stale processing placeholders.

6. Image pipeline behavior
- Capture viewport screenshot with Puppeteer.
- Resize with Sharp before saving (no on-the-fly resize for serving cached image).
- Keep contain-style behavior (`fit: contain`) to avoid crop.
- `withoutEnlargement` is intentionally `false` so output matches requested dimensions.

7. Overlay behavior
- Overlay is added in the screenshot pipeline after resize.
- Top semi-transparent bar contains captured host name.
- Bottom-right `©oders` text has subtle shadow for readability.

8. DNS behavior is enforced via Chromium Local State
- DNS preflight uses JSON DNS endpoint from config to check A/AAAA availability.
- Chromium launch should use per-run `userDataDir` with `Local State` keys:
	- `dns_over_https.mode = secure`
	- `dns_over_https.templates = <RFC6570 template>`
	- `async_dns.enabled = true`
- Do not rely only on Chromium CLI DoH switches in this project; current reliable path is Local State prefs.
- DNS profile verification currently uses `https://test.nextdns.io`, including nested `*.test.nextdns.io` payload flow.

## Performance Expectations

- Cache hits should be cheap.
- Main API should read and return cached PNG bytes.
- `/api/raw` should redirect for clients that prefer static URL fetch.
- Avoid unnecessary per-request transformations for cached images.

## Common Pitfalls To Avoid

- Do not reintroduce `&t=` cache busting in landing/docs examples.
- Do not switch `/api/screenshot` back to redirect-only behavior.
- Do not tie behavior to filename dimension parsing unless explicitly requested.
- Do not cache processing placeholders as if they were final images.
- Do not add heavy runtime work on cache hit unless required.
- Do not move DNS logic back into `src/lib/screenshot.ts`; keep DNS concerns in `src/lib/dns.ts`.

## Editing Checklist

When changing API/cache behavior, verify:

1. `src/server.tsx`
- `/api/screenshot` returns bytes for cache hit.
- `/api/raw` returns redirect for cache hit.
- Cache-Control on final cached assets uses `CONFIG.cache.maxAgeMs`.
- Placeholder responses are no-store.

2. `src/components/LandingPage.tsx`
- No timestamp cache-busting patterns in fetch/image URLs.
- API preview updates safely via `textContent` and encoded URL.

3. `src/components/DocsPage.tsx`
- Endpoint names match current routes.
- Examples do not include `&t=` or `cache: 'no-store'` unless intentionally documenting a debug mode.

4. `src/lib/screenshot.ts`
- Resize happens before save.
- Overlay composition still applied.

5. `src/lib/dns.ts`
- Preflight still checks both A then AAAA.
- Local State `userDataDir` is created and cleaned up per launch when DNS is enabled.
- Verification continues to return `true | false | null` semantics used by screenshot flow.

## Quick Validation Commands

Use these to validate endpoint behavior:

```bash
bun -e "const q='?url=https://www.youtube.com/&width=387&height=217'; const main=await fetch('http://localhost:3001/api/screenshot'+q,{redirect:'manual'}); const raw=await fetch('http://localhost:3001/api/raw'+q,{redirect:'manual'}); console.log('main', main.status, main.headers.get('content-type'), main.headers.get('cache-control')); console.log('raw', raw.status, raw.headers.get('location'), raw.headers.get('cache-control'));"
```

Expected:
- `main`: `200`, `image/png`, cache header based on `maxAgeMs`
- `raw`: `302`, location to `/screenshots/...`, same cache header
