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
3. Initialize the database (automatic on first run).

### Start the Service
To run in development mode with hot-reloading:
```bash
bun run dev
```

To run in production mode:
```bash
bun run start
```
*The service will start at `http://localhost:3001`.*

## 🛠️ API Usage

### Capture Screenshot
`GET /api/screenshot?url=https://example.com`

**Features:**
- **Instant Placeholder**: Returns a "Processing..." PNG immediately if the screenshot isn't cached.
- **Auto Validation**: Rejects non-HTTPS URLs and check against `is.coders.lt` safety API.
- **Redirect Support**: Fully follows browser redirects.
- **Error Handling**: Broken websites (non-200) are cached as "broken" for 30 days to avoid redundant re-checks.

## 🧹 Maintenance & Storage

### Caching Strategy
- **File System**: Screenshots are stored in `public/screenshots/[domain-name]/[hash].png`.
- **Database**: Metadata and screenshot logs are stored in `data/screenshots.db` (SQLite).
- **TTL**: All data (images and database records) are valid for **30 days**.

### Maintenance Tasks
- **Manual Cleanup**: To purge expired screenshots and optimize the database, run:
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
- **Database**: Bun:sqlite
- **Image Processing**: Sharp

---
Created with ❤️ by Antigravity.
