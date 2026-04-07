# SnapService - Beautiful URL Screenshots

A high-performance screenshot service built with **Bun**, **Puppeteer**, **Hono**, and **React**. This service captures high-fidelity 296x166 px screenshots with domain-level caching and a built-in safety API.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or higher)
- [Puppeteer Dependencies](https://pptr.dev/guides/installation) (Headless Chrome)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. No database setup required.

### Start the Service

To run in development mode with hot-reloading:

```bash
bun run dev
```

To run in production mode:

```bash
bun run start
```

_The service will start at `http://localhost:3001`._

## 🛠️ API Usage

### Capture Screenshot

`GET /api/screenshot?url=https://example.com`

**Features:**

- **Instant Placeholder**: Returns a "Processing..." PNG immediately if the screenshot isn't cached.
- **Auto Validation**: Rejects non-HTTPS URLs and check against `is.coders.lt` safety API.
- **Redirect Support**: Fully follows browser redirects.
- **Domain Capture**: Requests are normalized to domain-only screenshots (path/query are ignored).

## 🧹 Maintenance & Storage

### Caching Strategy

- **File System Only**: No metadata database or JSON index is stored.
- **Directory Layout**: Screenshots are stored by TLD and then full domain.
  - `public/screenshots/com/www.example.com/[timestamp]-[hash].png`
  - `public/screenshots/lt/www.lrt.lt/[timestamp]-[hash].png`
- **TTL**: Images are valid for **1 month** only.

### Maintenance Tasks

- **Manual Cleanup**: To purge expired screenshots, run:
  ```bash
  # This can be scheduled via Cron
  bun run src/db/cleanup.ts
  ```
- **Puppeteer Cache**: If screenshots fail to load, ensure your environment has the necessary Chrome/Chromium binaries installed.

## 📦 Tech Stack

- **Runtime**: Bun
- **Server/SSR**: Hono + React
- **Engine**: Puppeteer (Headless Chrome)
- **Styling**: Tailwind CSS + Shadcn
- **Persistence**: File system only
- **Image Processing**: Sharp

---

Created with ❤️ by Antigravity.
