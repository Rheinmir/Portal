import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const backupDir = path.join(dataDir, "backup");
const dbPath = path.join(dataDir, "shortcuts.db");

// Ensure directories exist
[dataDir, backupDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const ensureColumn = (table, definition) => {
  const [columnName] = definition.split(" ");
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((x) => x.name === columnName)) {
      console.log(`Adding ${columnName} to ${table}`);
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
    }
  } catch (e) {
    console.error(`Error ensuring column ${columnName} in ${table}:`, e);
  }
};

export const initDatabase = () => {
  // Shortcuts Table
  ensureColumn("shortcuts", "tenant TEXT NOT NULL DEFAULT 'default'");
  ensureColumn("shortcuts", "icon_64 TEXT");
  ensureColumn("shortcuts", "icon_128 TEXT");
  ensureColumn("shortcuts", "icon_256 TEXT");
  ensureColumn("shortcuts", "parent_label TEXT");
  ensureColumn("shortcuts", "child_label TEXT");
  ensureColumn("shortcuts", "favorite INTEGER DEFAULT 0");
  ensureColumn("shortcuts", "clicks INTEGER DEFAULT 0");
  ensureColumn("shortcuts", "created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  ensureColumn("shortcuts", "sort_index INTEGER DEFAULT 0");

  // Label Colors Table
  ensureColumn("label_colors", "tenant TEXT NOT NULL DEFAULT 'default'");
  ensureColumn("label_colors", "color_class TEXT");

  // Admins Table
  ensureColumn("admins", "role TEXT NOT NULL DEFAULT 'admin'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS shortcuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      icon_url TEXT,
      icon_64 TEXT,
      icon_128 TEXT,
      icon_256 TEXT,
      parent_label TEXT,
      child_label TEXT,
      favorite INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sort_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS label_colors (
      name TEXT NOT NULL,
      tenant TEXT NOT NULL DEFAULT 'default',
      color_class TEXT,
      PRIMARY KEY(name, tenant)
    );
    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS click_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortcut_id INTEGER,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS image_search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_ip TEXT,
      user_agent TEXT,
      file_size INTEGER,
      file_type TEXT,
      filename TEXT,
      searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcuts_name_url_tenant ON shortcuts(name, url, tenant);
  `);

  // Default Admin
  if (!db.prepare("SELECT COUNT(*) as c FROM admins").get().c) {
    db.prepare(
      "INSERT INTO admins(username, password_hash, role) VALUES (?, ?, ?)"
    ).run(
      "admin",
      crypto.createHash("sha256").update("miniappadmin").digest("hex"),
      "superadmin"
    );
    console.log("Default admin created (admin/miniappadmin)");
  }

  // Cleanup Outdated Data
  try {
    console.log("Running database cleanup...");
    // Delete click_logs older than 30 days
    const deletedLogs = db
      .prepare(
        "DELETE FROM click_logs WHERE clicked_at < date('now', '-30 day')"
      )
      .run();
    if (deletedLogs.changes > 0) {
      console.log(`Removed ${deletedLogs.changes} outdated click logs.`);
    }

    // Optimize DB size
    db.pragma("optimize");
  } catch (err) {
    console.error("Database cleanup warning:", err.message);
    // Swallow error to prevent crash
  }
};
