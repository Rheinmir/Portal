
import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5464;

// Increase limit for image uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE SETUP ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'shortcuts.db'));
db.pragma('journal_mode = WAL');

// Init Tables with new columns
db.exec(`
  CREATE TABLE IF NOT EXISTS shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS label_colors (name TEXT PRIMARY KEY, color_class TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcuts_name_url ON shortcuts(name, url);
`);

// --- HELPERS ---
const cleanupOrphanLabels = () => {
  db.exec(`DELETE FROM label_colors WHERE name NOT IN (
      SELECT DISTINCT parent_label FROM shortcuts WHERE parent_label IS NOT NULL AND parent_label != ''
      UNION SELECT DISTINCT child_label FROM shortcuts WHERE child_label IS NOT NULL AND child_label != '')`);
};

const normalizePayload = (body) => {
  let { name, url, icon_url, parent_label, child_label, parent_color, child_color } = body || {};
  if (!name || !url) throw new Error('Thiếu tên hoặc đường dẫn');
  try { if (!new URL(url).protocol.startsWith('http')) throw new Error(); } catch (e) { throw new Error('URL không hợp lệ (phải bắt đầu bằng http/https)'); }
  return {
    name: String(name).trim(),
    url: String(url).trim(),
    icon_url: icon_url ? String(icon_url) : '',
    parent_label: parent_label ? String(parent_label).trim() : '',
    child_label: child_label ? String(child_label).trim() : '',
    parent_color: parent_color || '',
    child_color: child_color || ''
  };
};

const generateThumbnails = async (base64Str) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return { icon_64: null, icon_128: null, icon_256: null };
    try {
        const parts = base64Str.split(';base64,');
        const buffer = Buffer.from(parts[1], 'base64');
        
        const [b64, b128, b256] = await Promise.all([
            sharp(buffer).resize(64, 64).png().toBuffer(),
            sharp(buffer).resize(128, 128).png().toBuffer(),
            sharp(buffer).resize(256, 256).png().toBuffer()
        ]);

        return {
            icon_64: `data:image/png;base64,${b64.toString('base64')}`,
            icon_128: `data:image/png;base64,${b128.toString('base64')}`,
            icon_256: `data:image/png;base64,${b256.toString('base64')}`
        };
    } catch (e) {
        console.error("Thumbnail error:", e);
        return { icon_64: null, icon_128: null, icon_256: null };
    }
};

// --- API ---

// 1. Get Data
app.get('/api/data', (req, res) => {
  try {
    // Sort logic handled in Frontend or simple default here
    const shortcuts = db.prepare('SELECT * FROM shortcuts ORDER BY favorite DESC, created_at DESC').all();
    const labels = db.prepare('SELECT * FROM label_colors').all();
    const labelColors = {}; labels.forEach(l => labelColors[l.name] = l.color_class);
    res.json({ shortcuts, labelColors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Add
app.post('/api/shortcuts', async (req, res) => {
  try {
    const d = normalizePayload(req.body);
    const thumbs = await generateThumbnails(d.icon_url);
    
    db.prepare(`INSERT INTO shortcuts (name, url, icon_url, icon_64, icon_128, icon_256, parent_label, child_label, clicks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(name, url) DO UPDATE SET 
        icon_url=excluded.icon_url, 
        icon_64=excluded.icon_64,
        icon_128=excluded.icon_128,
        icon_256=excluded.icon_256,
        parent_label=excluded.parent_label, 
        child_label=excluded.child_label`
    ).run(d.name, d.url, d.icon_url, thumbs.icon_64, thumbs.icon_128, thumbs.icon_256, d.parent_label, d.child_label);

    const upsert = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
    if (d.parent_label && d.parent_color) upsert.run(d.parent_label, d.parent_color);
    if (d.child_label && d.child_color) upsert.run(d.child_label, d.child_color);
    
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 3. Update
app.put('/api/shortcuts/:id', async (req, res) => {
  try {
    const d = normalizePayload(req.body);
    const thumbs = await generateThumbnails(d.icon_url);
    
    const info = db.prepare(`UPDATE shortcuts SET name=?, url=?, icon_url=?, icon_64=?, icon_128=?, icon_256=?, parent_label=?, child_label=? WHERE id=?`)
      .run(d.name, d.url, d.icon_url, thumbs.icon_64, thumbs.icon_128, thumbs.icon_256, d.parent_label, d.child_label, req.params.id);
    
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });

    const upsert = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
    if (d.parent_label && d.parent_color) upsert.run(d.parent_label, d.parent_color);
    if (d.child_label && d.child_color) upsert.run(d.child_label, d.child_color);
    cleanupOrphanLabels();
    
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 4. Delete
app.delete('/api/shortcuts/:id', (req, res) => {
  try {
    if (db.prepare('DELETE FROM shortcuts WHERE id = ?').run(req.params.id).changes === 0) return res.status(404).json({ error: 'Not found' });
    cleanupOrphanLabels();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Toggle Favorite
app.post('/api/favorite/:id', (req, res) => {
    try {
        const id = req.params.id;
        const current = db.prepare('SELECT favorite FROM shortcuts WHERE id = ?').get(id);
        if (!current) return res.status(404).json({ error: 'Not found' });
        
        const newVal = current.favorite ? 0 : 1;
        db.prepare('UPDATE shortcuts SET favorite = ? WHERE id = ?').run(newVal, id);
        res.json({ success: true, favorite: newVal });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Click
app.post('/api/click/:id', (req, res) => {
  try { db.prepare('UPDATE shortcuts SET clicks = clicks + 1 WHERE id = ?').run(req.params.id); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Import
app.post('/api/import', (req, res) => {
  const { shortcuts, labels } = req.body || {};
  const insert = db.prepare(`INSERT INTO shortcuts (name, url, icon_url, icon_64, icon_128, icon_256, parent_label, child_label, clicks, favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, url) DO UPDATE SET icon_url=excluded.icon_url, parent_label=excluded.parent_label, child_label=excluded.child_label`);
  const upsert = db.prepare(`INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)`);
  try {
    db.transaction(() => {
      if (Array.isArray(shortcuts)) shortcuts.forEach(s => {
        if (!s?.name || !s?.url) return;
        try { if(new URL(s.url).protocol.startsWith('http')) insert.run(s.name.trim(), s.url.trim(), s.icon_url||'', s.icon_64||null, s.icon_128||null, s.icon_256||null, s.parent_label||'', s.child_label||'', Number(s.clicks||0), Number(s.favorite||0)); } catch {}
      });
      if (Array.isArray(labels)) labels.forEach(l => { if(l?.name) upsert.run(l.name.trim(), l.color_class||''); });
      cleanupOrphanLabels();
    })();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => fs.existsSync(path.join(__dirname, 'dist', 'index.html')) ? res.sendFile(path.join(__dirname, 'dist', 'index.html')) : res.status(500).send('Frontend chưa build.'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
