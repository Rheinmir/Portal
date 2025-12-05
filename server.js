
import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5464;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files (React build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- DATABASE SETUP ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shortcuts.db');
const db = new Database(dbPath);

// Enable WAL for better concurrency & durability
db.pragma('journal_mode = WAL');

// Basic schema + migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon_url TEXT,
    parent_label TEXT,
    child_label TEXT,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS label_colors (
    name TEXT PRIMARY KEY,
    color_class TEXT
  );
`);

// Ensure unique index for (name, url) to support upsert/merge imports
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcuts_name_url
  ON shortcuts(name, url);
`);

// Helper: cleanup orphan labels (labels không còn được shortcut nào dùng)
const cleanupOrphanLabels = () => {
  db.exec(`
    DELETE FROM label_colors
    WHERE name NOT IN (
      SELECT DISTINCT parent_label FROM shortcuts WHERE parent_label IS NOT NULL AND parent_label != ''
      UNION
      SELECT DISTINCT child_label FROM shortcuts WHERE child_label IS NOT NULL AND child_label != ''
    );
  `);
};

// Helper: validate & normalize shortcut payload
const normalizeShortcutPayload = (body) => {
  let {
    name,
    url,
    icon_url,
    parent_label,
    child_label,
    parent_color,
    child_color
  } = body || {};

  if (!name || !url) {
    throw new Error('Thiếu name hoặc url');
  }

  name = String(name).trim();
  url = String(url).trim();
  icon_url = icon_url ? String(icon_url) : '';
  parent_label = parent_label ? String(parent_label).trim() : '';
  child_label = child_label ? String(child_label).trim() : '';
  parent_color = parent_color || '';
  child_color = child_color || '';

  try {
    // Simple URL validation, not strict
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('URL phải bắt đầu bằng http hoặc https');
    }
  } catch (e) {
    throw new Error('URL không hợp lệ');
  }

  return {
    name,
    url,
    icon_url,
    parent_label,
    child_label,
    parent_color,
    child_color
  };
};

// --- API ENDPOINTS ---

// 1. Get All Data
app.get('/api/data', (req, res) => {
  try {
    const shortcuts = db
      .prepare('SELECT * FROM shortcuts ORDER BY created_at DESC, id DESC')
      .all();
    const labels = db.prepare('SELECT * FROM label_colors').all();

    const labelColorsMap = {};
    labels.forEach((l) => {
      labelColorsMap[l.name] = l.color_class;
    });

    res.json({ shortcuts, labelColors: labelColorsMap });
  } catch (error) {
    console.error('GET /api/data error:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu' });
  }
});

// 2. Add Shortcut
app.post('/api/shortcuts', (req, res) => {
  try {
    const {
      name,
      url,
      icon_url,
      parent_label,
      child_label,
      parent_color,
      child_color
    } = normalizeShortcutPayload(req.body || {});

    const insert = db.prepare(`
      INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks)
      VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(name, url) DO UPDATE SET
        icon_url = excluded.icon_url,
        parent_label = excluded.parent_label,
        child_label = excluded.child_label
    `);

    insert.run(
      name,
      url,
      icon_url || '',
      parent_label || '',
      child_label || ''
    );

    const upsertLabel = db.prepare(`
      INSERT OR REPLACE INTO label_colors (name, color_class)
      VALUES (?, ?)
    `);

    if (parent_label && parent_color) {
      upsertLabel.run(parent_label, parent_color);
    }
    if (child_label && child_color) {
      upsertLabel.run(child_label, child_color);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/shortcuts error:', error);
    res.status(400).json({ error: error.message || 'Lỗi dữ liệu đầu vào' });
  }
});

// 3. Update Shortcut
app.put('/api/shortcuts/:id', (req, res) => {
  try {
    const {
      name,
      url,
      icon_url,
      parent_label,
      child_label,
      parent_color,
      child_color
    } = normalizeShortcutPayload(req.body || {});
    const id = Number(req.params.id);

    const update = db.prepare(`
      UPDATE shortcuts
      SET name = ?, url = ?, icon_url = ?, parent_label = ?, child_label = ?
      WHERE id = ?
    `);

    const result = update.run(
      name,
      url,
      icon_url || '',
      parent_label || '',
      child_label || '',
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy shortcut để cập nhật' });
    }

    const upsertLabel = db.prepare(`
      INSERT OR REPLACE INTO label_colors (name, color_class)
      VALUES (?, ?)
    `);

    if (parent_label && parent_color) {
      upsertLabel.run(parent_label, parent_color);
    }
    if (child_label && child_color) {
      upsertLabel.run(child_label, child_color);
    }

    cleanupOrphanLabels();

    res.json({ success: true });
  } catch (error) {
    console.error('PUT /api/shortcuts error:', error);
    res.status(400).json({ error: error.message || 'Lỗi cập nhật dữ liệu' });
  }
});

// 4. Delete Shortcut
app.delete('/api/shortcuts/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const stmt = db.prepare('DELETE FROM shortcuts WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy shortcut để xóa' });
    }

    cleanupOrphanLabels();

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/shortcuts error:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa shortcut' });
  }
});

// 5. Click Tracking
app.post('/api/click/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const stmt = db.prepare(
      'UPDATE shortcuts SET clicks = clicks + 1 WHERE id = ?'
    );
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy shortcut' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/click error:', error);
    res.status(500).json({ error: 'Lỗi click tracking' });
  }
});

// 6. Import Data (Merge)
app.post('/api/import', (req, res) => {
  const { shortcuts, labels } = req.body || {};

  const insertShortcut = db.prepare(`
    INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, url) DO UPDATE SET
      icon_url = excluded.icon_url,
      parent_label = excluded.parent_label,
      child_label = excluded.child_label,
      clicks = shortcuts.clicks + excluded.clicks
  `);

  const upsertLabel = db.prepare(`
    INSERT OR REPLACE INTO label_colors (name, color_class)
    VALUES (?, ?)
  `);

  const transaction = db.transaction(() => {
    if (Array.isArray(shortcuts)) {
      for (const s of shortcuts) {
        if (!s || !s.name || !s.url) continue;

        let name = String(s.name).trim();
        let url = String(s.url).trim();
        let icon = s.icon_url || '';
        let parent = s.parent_label || '';
        let child = s.child_label || '';
        let clicks = Number(s.clicks || 0);

        try {
          const parsed = new URL(url);
          if (!parsed.protocol.startsWith('http')) continue;
        } catch {
          continue;
        }

        insertShortcut.run(
          name,
          url,
          icon,
          parent,
          child,
          clicks >= 0 ? clicks : 0
        );
      }
    }

    if (Array.isArray(labels)) {
      for (const l of labels) {
        if (!l || !l.name) continue;
        const name = String(l.name).trim();
        const color = l.color_class || '';
        if (!name) continue;
        upsertLabel.run(name, color);
      }
    }

    cleanupOrphanLabels();
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/import error:', error);
    res.status(500).json({ error: 'Lỗi import dữ liệu' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all -> serve React app
app.get('*', (req, res) => {
  if (!fs.existsSync(path.join(distPath, 'index.html'))) {
    return res
      .status(500)
      .send('Frontend chưa build. Hãy chạy "npm run build" trước.');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Database file:', dbPath);
});
