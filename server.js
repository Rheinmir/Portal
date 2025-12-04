
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
app.use(express.json({ limit: '50mb' })); // Tăng limit để nhận ảnh base64

// Serve static files (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE SETUP ---
// Đảm bảo thư mục data tồn tại
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'shortcuts.db'));

// Init Tables
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

// --- API ENDPOINTS ---

// 1. Get All Data
app.get('/api/data', (req, res) => {
    try {
        const shortcuts = db.prepare('SELECT * FROM shortcuts ORDER BY created_at DESC').all();
        const labels = db.prepare('SELECT * FROM label_colors').all();
        
        // Convert labels array to map object for frontend
        const labelColorsMap = {};
        labels.forEach(l => labelColorsMap[l.name] = l.color_class);
        
        res.json({ shortcuts, labelColors: labelColorsMap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Add Shortcut
app.post('/api/shortcuts', (req, res) => {
    const { name, url, icon_url, parent_label, child_label, parent_color, child_color } = req.body;
    
    try {
        const insert = db.prepare(`
            INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks) 
            VALUES (?, ?, ?, ?, ?, 0)
        `);
        insert.run(name, url, icon_url, parent_label || '', child_label || '');

        // Update Labels Colors (Store HEX now instead of class)
        const upsertLabel = db.prepare('INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)');
        
        if (parent_label) upsertLabel.run(parent_label, parent_color);
        if (child_label) upsertLabel.run(child_label, child_color);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update Shortcut (NEW)
app.put('/api/shortcuts/:id', (req, res) => {
    const { name, url, icon_url, parent_label, child_label, parent_color, child_color } = req.body;
    try {
        const update = db.prepare(`
            UPDATE shortcuts 
            SET name=?, url=?, icon_url=?, parent_label=?, child_label=?
            WHERE id=?
        `);
        update.run(name, url, icon_url, parent_label || '', child_label || '', req.params.id);

        const upsertLabel = db.prepare('INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)');
        if (parent_label) upsertLabel.run(parent_label, parent_color);
        if (child_label) upsertLabel.run(child_label, child_color);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete Shortcut
app.delete('/api/shortcuts/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM shortcuts WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Click Tracking
app.post('/api/click/:id', (req, res) => {
    try {
        db.prepare('UPDATE shortcuts SET clicks = clicks + 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Import Data (Merge)
app.post('/api/import', (req, res) => {
    const { shortcuts, labels } = req.body;
    
    const insert = db.prepare(`
        INSERT INTO shortcuts (name, url, icon_url, parent_label, child_label, clicks) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const upsertLabel = db.prepare('INSERT OR REPLACE INTO label_colors (name, color_class) VALUES (?, ?)');

    const transaction = db.transaction(() => {
        if(shortcuts) {
            for (const s of shortcuts) {
                insert.run(s.name, s.url, s.icon_url || '', s.parent_label || '', s.child_label || '', s.clicks || 0);
            }
        }
        if(labels) {
            for (const l of labels) {
                upsertLabel.run(l.name, l.color_class);
            }
        }
    });

    try {
        transaction();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
