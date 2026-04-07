import { Database } from "bun:sqlite";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const DB_DIR = join(process.cwd(), "data");
mkdirSync(DB_DIR, { recursive: true });

const db = new Database(join(DB_DIR, "screenshots.db"));

// Force schema update if needed (Drop and recreate once to ensure UNIQUE constraint)
// db.run("DROP TABLE IF EXISTS screenshots;"); 

db.run(`
  CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    status INTEGER NOT NULL,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_domain ON screenshots(domain);
  CREATE INDEX IF NOT EXISTS idx_expires ON screenshots(expires_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_url_unique ON screenshots(url);
`);

export interface ScreenshotRecord {
  id: number;
  url: string;
  domain: string;
  status: number;
  image_path: string | null;
  created_at: string;
  expires_at: string;
}

export const dbService = {
  getLatest: (limit = 9): ScreenshotRecord[] => {
    return db.query("SELECT * FROM screenshots WHERE status = 200 ORDER BY created_at DESC LIMIT ?").all(limit) as ScreenshotRecord[];
  },

  getByUrl: (url: string): ScreenshotRecord | undefined => {
    return db.query("SELECT * FROM screenshots WHERE url = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1").get(url) as ScreenshotRecord;
  },

  add: (record: Omit<ScreenshotRecord, "id" | "created_at">) => {
    return db.run(
      `INSERT INTO screenshots (url, domain, status, image_path, expires_at) 
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET 
         status = excluded.status,
         image_path = excluded.image_path,
         expires_at = excluded.expires_at,
         created_at = CURRENT_TIMESTAMP`,
      [record.url, record.domain, record.status, record.image_path, record.expires_at]
    );
  },

  cleanup: () => {
    return db.run("DELETE FROM screenshots WHERE expires_at < datetime('now')");
  }
};

export default db;
