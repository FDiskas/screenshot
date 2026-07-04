---
name: native-virtualization
description: Use native CSS content-visibility instead of JS libraries for virtualization in SSR pages.
keywords: [virtualization, css, content-visibility, ssr, performance, react]
created: 2026-07-04
updated: 2026-07-04
---

**Fact / Rule:** For list/grid virtualization in this project, use native CSS (`content-visibility: auto; contain-intrinsic-size: auto <size>;`) instead of bringing in heavy JS libraries like `react-window`.

**Why:** The project uses `@hono/react-renderer` which performs Server-Side Rendering (SSR) without client-side React hydration. Introducing JS-based React virtualization would require adding full client-side React rendering/hydration, drastically increasing bundle size and complexity. CSS virtualization offloads rendering calculations to the browser natively.

**How to apply:** 
When rendering a long list or grid of items (like the screenshot gallery), add this to the item container:
```html
<div style="content-visibility: auto; contain-intrinsic-size: auto 340px;">
  ...
</div>
```
Ensure a fallback or approximate size is provided to `contain-intrinsic-size` to prevent scrollbar jumping.
