import express from 'express';
import crypto from 'crypto';
import sharp from 'sharp';
import { db } from './database.js';

const router = express.Router();

// --- Helpers ---

const normalizeTenant = (t) => (t && typeof t === 'string' ? t.trim() : '') || 'default';

const cleanupOrphanLabels = (t) => {
  const ten = normalizeTenant(t);
  const used = new Set();
  
  db.prepare('SELECT parent_label, child_label FROM shortcuts WHERE tenant=?')
    .all(ten)
    .forEach(s => {
      if (s.parent_label) used.add(s.parent_label);
      if (s.child_label) {
        s.child_label.split(',').forEach(x => used.add(x.trim()));
      }
    });
    
  const all = db.prepare('SELECT name FROM label_colors WHERE tenant=?').all(ten);
  const del = db.prepare('DELETE FROM label_colors WHERE name=? AND tenant=?');
  
  all.forEach(l => {
    if (!used.has(l.name) && l.name !== '') {
      del.run(l.name, ten);
    }
  });
};

const normPayload = (body) => {
  let { name, url, icon_url, parent_label, child_label, parent_color, child_color, tenant } = body || {};
  if (!name || !url) throw new Error('Name/URL missing');
  try {
    if (!new URL(url).protocol.startsWith('http')) throw 0;
  } catch {
    throw new Error('Invalid URL');
  }
  return {
    tenant: normalizeTenant(tenant),
    name: String(name).trim(),
    url: String(url).trim(),
    icon_url: icon_url || '',
    parent_label: parent_label ? String(parent_label).trim() : '',
    child_label: child_label ? String(child_label).trim() : '',
    parent_color: parent_color || '',
    child_color: child_color || ''
  };
};

const genThumb = async (u) => {
  if (!u || !u.startsWith('data:image')) return { icon_64: null, icon_128: null, icon_256: null };
  try {
    const b = Buffer.from(u.split(',')[1], 'base64');
    const [b64, b128, b256] = await Promise.all([64, 128, 256].map(s => sharp(b).resize(s, s).png().toBuffer()));
    return {
      icon_64: `data:image/png;base64,${b64.toString('base64')}`,
      icon_128: `data:image/png;base64,${b128.toString('base64')}`,
      icon_256: `data:image/png;base64,${b256.toString('base64')}`
    };
  } catch {
    return { icon_64: null, icon_128: null, icon_256: null };
  }
};

// --- Routes ---

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const r = db.prepare('SELECT * FROM admins WHERE username=?').get(username?.trim());
    if (!r || crypto.createHash('sha256').update(password || '').digest('hex') !== r.password_hash) {
      return res.status(401).json({ error: 'Auth failed' });
    }
    res.json({ success: true, role: r.role || 'admin' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/data', (req, res) => {
  try {
    const t = normalizeTenant(req.query.tenant);
    const sc = db.prepare('SELECT * FROM shortcuts WHERE tenant=? ORDER BY favorite DESC, sort_index ASC, created_at DESC').all(t);
    const lc = db.prepare('SELECT name, color_class FROM label_colors WHERE tenant=?').all(t);
    const cfg = db.prepare('SELECT key, value FROM app_config').all();
    
    const lcm = {};
    const ac = {};
    lc.forEach(l => lcm[l.name] = l.color_class);
    cfg.forEach(c => ac[c.key] = c.value);
    
    res.json({ shortcuts: sc, labelColors: lcm, appConfig: ac, tenant: t });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/config', (req, res) => {
  try {
    const c = req.body;
    const st = db.prepare('INSERT OR REPLACE INTO app_config(key,value) VALUES(?,?)');
    db.transaction(() => {
      for (const [k, v] of Object.entries(c)) st.run(k, String(v));
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/config/force', (req, res) => {
  try {
    const cfg = req.body || {};
    const version = Date.now().toString();
    const st = db.prepare('INSERT OR REPLACE INTO app_config(key,value) VALUES(?,?)');
    db.transaction(() => {
      for (const [k, v] of Object.entries(cfg)) {
        st.run(k, String(v));
      }
      st.run('config_version', version);
    })();
    res.json({ success: true, version });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reorder', (req, res) => {
  try {
    const { order, tenant } = req.body || {};
    const ten = normalizeTenant(tenant);
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order' });
    const stmt = db.prepare('UPDATE shortcuts SET sort_index=? WHERE id=? AND tenant=?');
    db.transaction(() => {
      order.forEach((id, idx) => {
        stmt.run(idx + 1, id, ten);
      });
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/shortcuts', async (req, res) => {
  try {
    const d = normPayload(req.body);
    const th = await genThumb(d.icon_url);
    db.prepare(`
      INSERT INTO shortcuts(tenant, name, url, icon_url, icon_64, icon_128, icon_256, parent_label, child_label, favorite, clicks)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      ON CONFLICT(name, url, tenant)
      DO UPDATE SET icon_url=excluded.icon_url, icon_64=excluded.icon_64, icon_128=excluded.icon_128, icon_256=excluded.icon_256, parent_label=excluded.parent_label, child_label=excluded.child_label
    `).run(d.tenant, d.name, d.url, d.icon_url, th.icon_64, th.icon_128, th.icon_256, d.parent_label, d.child_label);
    
    const ups = db.prepare('INSERT OR REPLACE INTO label_colors(name, tenant, color_class) VALUES(?, ?, ?)');
    if (d.parent_label && d.parent_color) ups.run(d.parent_label, d.tenant, d.parent_color);
    if (d.child_label && d.child_color) d.child_label.split(',').forEach(t => ups.run(t.trim(), d.tenant, d.child_color));
    
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/shortcuts/:id', async (req, res) => {
  try {
    const d = normPayload(req.body);
    const id = +req.params.id;
    const th = await genThumb(d.icon_url);
    if (!db.prepare(`UPDATE shortcuts SET name=?, url=?, icon_url=?, icon_64=?, icon_128=?, icon_256=?, parent_label=?, child_label=? WHERE id=? AND tenant=?`)
        .run(d.name, d.url, d.icon_url, th.icon_64, th.icon_128, th.icon_256, d.parent_label, d.child_label, id, d.tenant).changes) {
      return res.status(404).json({ error: 'Not found' });
    }
    const ups = db.prepare('INSERT OR REPLACE INTO label_colors(name, tenant, color_class) VALUES(?, ?, ?)');
    if (d.parent_label && d.parent_color) ups.run(d.parent_label, d.tenant, d.parent_color);
    if (d.child_label && d.child_color) d.child_label.split(',').forEach(t => ups.run(t.trim(), d.tenant, d.child_color));
    cleanupOrphanLabels(d.tenant);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/shortcuts/:id', (req, res) => {
  try {
    const id = +req.params.id;
    const r = db.prepare('SELECT tenant FROM shortcuts WHERE id=?').get(id);
    if (!r || !db.prepare('DELETE FROM shortcuts WHERE id=?').run(id).changes) {
      return res.status(404).json({ error: 'Not found' });
    }
    cleanupOrphanLabels(r.tenant);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/click/:id', (req, res) => {
  try {
    const id = +req.params.id;
    db.prepare('UPDATE shortcuts SET clicks=clicks+1 WHERE id=?').run(id);
    db.prepare('INSERT INTO click_logs(shortcut_id) VALUES(?)').run(id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

router.post('/favorite/:id', (req, res) => {
  try {
    const id = +req.params.id;
    const r = db.prepare('SELECT favorite FROM shortcuts WHERE id=?').get(id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const nv = r.favorite ? 0 : 1;
    db.prepare('UPDATE shortcuts SET favorite=? WHERE id=?').run(nv, id);
    res.json({ success: true, favorite: nv });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

router.get('/insights', (req, res) => {
  try {
    const tc = db.prepare('SELECT COUNT(*) as count FROM click_logs').get().count;
    const top = db.prepare('SELECT s.name, COUNT(cl.id) as count FROM click_logs cl JOIN shortcuts s ON cl.shortcut_id=s.id GROUP BY s.name ORDER BY count DESC LIMIT 10').all();
    const tl = db.prepare("SELECT date(clicked_at) as d, COUNT(*) as count FROM click_logs WHERE clicked_at >= date('now', '-7 day') GROUP BY d ORDER BY d ASC").all();
    const hr = db.prepare("SELECT strftime('%H', clicked_at) as h, COUNT(*) as count FROM click_logs GROUP BY h ORDER BY h ASC").all();
    res.json({ totalClicks: tc, topApps: top, timeline: tl, hourly: hr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/insights/export', (req, res) => {
  try {
    const l = db.prepare(`SELECT cl.clicked_at, s.name, s.tenant, s.parent_label, s.child_label, s.clicks FROM click_logs cl LEFT JOIN shortcuts s ON cl.shortcut_id=s.id ORDER BY cl.clicked_at DESC`).all();
    const csv = ['Time,App,Tenant,Group,Tags,Total_Clicks', ...l.map(r => `${r.clicked_at},"${(r.name || 'Deleted').replace(/"/g, '""')}",${r.tenant},${r.parent_label || ''},"${(r.child_label || '').replace(/"/g, '""')}",${r.clicks || 0}`)].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment(`insights_full_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.get('/insights/export/summary', (req, res) => {
  try {
    const l = db.prepare(`SELECT date(cl.clicked_at) AS date, s.name AS app, s.tenant, s.parent_label AS grp, s.child_label AS tags, COUNT(*) AS clicks FROM click_logs cl LEFT JOIN shortcuts s ON cl.shortcut_id=s.id GROUP BY date, app, tenant, grp, tags ORDER BY date DESC, clicks DESC`).all();
    const csv = ['Date,App,Tenant,Group,Tags,Clicks', ...l.map(r => `${r.date},"${(r.app || 'Deleted').replace(/"/g, '""')}",${r.tenant || ''},${r.grp || ''},"${(r.tags || '').replace(/"/g, '""')}",${r.clicks}`)].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment(`insights_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Import Logic
router.post('/import', (req, res) => {
  const { shortcuts: sc, labels: lb, tenant: t } = req.body || {};
  const root = normalizeTenant(t);
  
  const ins = db.prepare(`
    INSERT INTO shortcuts(tenant, name, url, icon_url, icon_64, icon_128, icon_256, parent_label, child_label, favorite, clicks)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, url, tenant)
    DO UPDATE SET icon_url=excluded.icon_url, icon_64=excluded.icon_64, icon_128=excluded.icon_128, icon_256=excluded.icon_256, parent_label=excluded.parent_label, child_label=excluded.child_label, favorite=MAX(shortcuts.favorite, excluded.favorite), clicks=shortcuts.clicks+excluded.clicks
  `);
  
  const ups = db.prepare('INSERT OR REPLACE INTO label_colors(name, tenant, color_class) VALUES(?, ?, ?)');
  
  try {
    db.transaction(() => {
      const aff = new Set();
      (Array.isArray(sc) ? sc : []).forEach(s => {
        if (!s?.name || !s?.url) return;
        let ten = normalizeTenant(s.tenant || root);
        try {
          if (!new URL(s.url).protocol.startsWith('http')) return;
        } catch { return; }
        
        ins.run(
          ten, s.name.trim(), s.url.trim(),
          s.icon_url || '', s.icon_64 || null, s.icon_128 || null, s.icon_256 || null,
          s.parent_label || '', s.child_label || '',
          s.favorite ? 1 : 0, Math.max(0, +s.clicks || 0)
        );
        aff.add(ten);
      });
      
      (Array.isArray(lb) ? lb : []).forEach(l => {
        if (!l?.name) return;
        let ten = normalizeTenant(l.tenant || root);
        ups.run(l.name.trim(), ten, l.color_class || '');
        aff.add(ten);
      });
      
      aff.forEach(t => cleanupOrphanLabels(t));
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/health', (req, res) => res.json({ status: 'ok' }));

export default router;
