import { DatabaseSync } from "node:sqlite";
import path from "node:path";

/**
 * Koneksi SQLite bawaan Node.js (node:sqlite) - tanpa modul native,
 * jadi tidak ada masalah instalasi di Windows maupun Linux.
 * File DB: data.db (di-root project, sudah di-gitignore).
 */
const db = new DatabaseSync(path.join(process.cwd(), "data.db"), {
  // Busy timeout: kalau beberapa proses (mis. worker build Next.js) membuka
  // file yang sama bersamaan, tunggu dulu ketimbang langsung error "database is locked".
  timeout: 10_000,
});

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS influencers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    handle     TEXT NOT NULL UNIQUE,
    niche      TEXT NOT NULL,
    city       TEXT NOT NULL,
    followers  INTEGER NOT NULL,
    base_price INTEGER NOT NULL,
    rating     REAL NOT NULL,
    review_count INTEGER NOT NULL,
    verified   INTEGER NOT NULL DEFAULT 0,
    bio        TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT 'from-indigo-500 to-violet-500'
  );

  CREATE TABLE IF NOT EXISTS packages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    price         INTEGER NOT NULL,
    summary       TEXT NOT NULL,
    includes      TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS umkms (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    owner    TEXT NOT NULL,
    category TEXT NOT NULL,
    city     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    influencer_id INTEGER NOT NULL REFERENCES influencers(id),
    umkm_id       INTEGER NOT NULL REFERENCES umkms(id),
    package_name  TEXT NOT NULL,
    amount        INTEGER NOT NULL,
    message       TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'PENDING',
    created_at    TEXT NOT NULL
  );
`);

export { db };
