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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'shortcuts.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL,
    icon_url TEXT, parent_label TEXT, child_label TEXT, clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS label_colors (name TEXT PRIMARY KEY, color_class TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcuts_name_url ON shortcuts(name, url);
`);

const cleanupOrphanLabels = () => {
  db.exec(`DELETE FROM label_colors WHERE name NOT IN (
      SELECT DISTINCT parent_label FROM shortcuts WHERE parent_label IS NOT NULL AND parent_label != ''
      UNION SELECT DISTINCT child_label FROM shortcuts WHERE child_label IS NOT NULL AND child_label != '')`);
};

const normalizeShortcutPayload = (body) => {
  let { name, url, icon_url, parent_label, child_label, parent_color, child_color } = body || {};
  if (!name || !url) throw new Error('Thiếu name hoặc url');
  try { if (!new URL(url).protocol.startsWith('http')) throw new Error(); } catch (e) { throw new Error('URL không hợp lệ'); }
  return {
    name: String(name).trim(), url: String(url).trim(), icon_url: icon_url ? String(icon_url) : '',
    parent_label: parent_label ? String(parent_label).trim() : '', child_label: child_label ? String(child_label).trim() : '',
    parent_color: parent_color || '', child_color: child_color || ''
  };
};

app.get('/api/data', (req, res) => {
  try {
    const shortcuts = db.prepare('SELECT * FROM shortcuts ORDER BY created_at DESC, id DESC').all();
    const labels = db.prepare('SELECT * FROM label_colors').all();
    const labelColors = {}; labels.forEach(l => labelColors[l.name] = l.color_class);
    res.json({ shortcuts, labelColors });
  } catch (e) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.post('/api/shortcuts', (req, res) => {
  try {
    const d = normalizeShortcutPayload(req.body);
    db.prepare(`INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks) VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(name, url) DO UPDATE SET icon_url=excluded.icon_url, parent_label=excluded.parent_label, child_label=excluded.child_label`).run(d.name, d.url, d.icon_url, d.parent_label, d.child_label);
    const upsertLabel = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
    if (d.parent_label && d.parent_color) upsertLabel.run(d.parent_label, d.parent_color);
    if (d.child_label && d.child_color) upsertLabel.run(d.child_label, d.child_color);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/shortcuts/:id', (req, res) => {
  try {
    const d = normalizeShortcutPayload(req.body);
    const result = db.prepare(`UPDATE shortcuts SET name=?, url=?, icon_url=?, parent_label=?, child_label=? WHERE id=?`).run(d.name, d.url, d.icon_url, d.parent_label, d.child_label, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    const upsertLabel = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
    if (d.parent_label && d.parent_color) upsertLabel.run(d.parent_label, d.parent_color);
    if (d.child_label && d.child_color) upsertLabel.run(d.child_label, d.child_color);
    cleanupOrphanLabels();
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/shortcuts/:id', (req, res) => {
  try {
    if (db.prepare('DELETE FROM shortcuts WHERE id = ?').run(req.params.id).changes === 0) return res.status(404).json({ error: 'Not found' });
    cleanupOrphanLabels();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.post('/api/click/:id', (req, res) => {
  try {
    if (db.prepare('UPDATE shortcuts SET clicks = clicks + 1 WHERE id = ?').run(req.params.id).changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.post('/api/import', (req, res) => {
  const { shortcuts, labels } = req.body || {};
  const insert = db.prepare(`INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, url) DO UPDATE SET icon_url=excluded.icon_url, parent_label=excluded.parent_label, child_label=excluded.child_label, clicks=shortcuts.clicks+excluded.clicks`);
  const upsertLabel = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
  try {
    db.transaction(() => {
      if (Array.isArray(shortcuts)) shortcuts.forEach(s => {
        if (!s?.name || !s?.url) return;
        try { if(new URL(s.url).protocol.startsWith('http')) insert.run(s.name.trim(), s.url.trim(), s.icon_url||'', s.parent_label||'', s.child_label||'', Number(s.clicks||0)); } catch {}
      });
      if (Array.isArray(labels)) labels.forEach(l => { if(l?.name) upsertLabel.run(l.name.trim(), l.color_class||''); });
      cleanupOrphanLabels();
    })();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Lỗi import' }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => fs.existsSync(path.join(__dirname, 'dist', 'index.html')) ? res.sendFile(path.join(__dirname, 'dist', 'index.html')) : res.status(500).send('Frontend chưa build.'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
