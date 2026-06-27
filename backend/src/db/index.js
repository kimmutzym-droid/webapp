import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || "./data/app.db";
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

export const db = new Database(path.resolve(dbPath));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY,
  blogger_blog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry INTEGER,
  daily_limit INTEGER NOT NULL DEFAULT 5,
  time_slots TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  title TEXT,
  body_html TEXT,
  meta_description TEXT,
  labels TEXT,
  sources_used TEXT,
  disclaimer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_targets (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  blog_id TEXT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TEXT,
  published_at TEXT,
  blogger_post_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_post_targets_blog_status ON post_targets(blog_id, status);
CREATE INDEX IF NOT EXISTS idx_post_targets_scheduled ON post_targets(scheduled_at);
`);
