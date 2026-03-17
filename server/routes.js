import express from "express";
import crypto, { randomUUID } from "crypto";
import sharp from "sharp";
import { supabase } from "./database.js";

const router = express.Router();

// --- Helpers ---

const normalizeTenant = (t) =>
  (t && typeof t === "string" ? t.trim() : "") || "default";

const cleanupOrphanLabels = async (t) => {
  const ten = normalizeTenant(t);
  
  try {
    const { data: shortcuts, error: scError } = await supabase
      .from('shortcuts')
      .select('parent_label, child_label')
      .eq('tenant', ten);

    if (scError) throw scError;

    const used = new Set();
    shortcuts.forEach((s) => {
      if (s.parent_label) used.add(s.parent_label);
      if (s.child_label) {
        s.child_label.split(",").forEach((x) => used.add(x.trim()));
      }
    });

    const { data: allLabels, error: lcError } = await supabase
      .from('label_colors')
      .select('name')
      .eq('tenant', ten);

    if (lcError) throw lcError;

    const toDelete = allLabels
      .filter(l => !used.has(l.name) && l.name !== "")
      .map(l => l.name);

    if (toDelete.length > 0) {
      // Supabase in() delete has a limit, but for label names it should be fine
      await supabase
        .from('label_colors')
        .delete()
        .eq('tenant', ten)
        .in('name', toDelete);
    }
  } catch (err) {
    console.error("Error cleaning up orphan labels:", err);
  }
};

const normPayload = (body) => {
  let {
    name,
    url,
    icon_url,
    parent_label,
    child_label,
    parent_color,
    child_color,
    tenant,
  } = body || {};
  if (!name || !url) throw new Error("Name/URL missing");
  try {
    if (!new URL(url).protocol.startsWith("http")) throw 0;
  } catch {
    throw new Error("Invalid URL");
  }
  return {
    tenant: normalizeTenant(tenant),
    name: String(name).trim(),
    url: String(url).trim(),
    icon_url: icon_url || "",
    parent_label: parent_label ? String(parent_label).trim() : "",
    child_label: child_label ? String(child_label).trim() : "",
    parent_color: parent_color || "",
    child_color: child_color || "",
  };
};

const genThumb = async (u) => {
  if (!u || !u.startsWith("data:image"))
    return { icon_64: null, icon_128: null, icon_256: null };
  try {
    const b = Buffer.from(u.split(",")[1], "base64");
    const [b64, b128, b256] = await Promise.all(
      [64, 128, 256].map((s) => sharp(b).resize(s, s).png().toBuffer())
    );
    return {
      icon_64: `data:image/png;base64,${b64.toString("base64")}`,
      icon_128: `data:image/png;base64,${b128.toString("base64")}`,
      icon_256: `data:image/png;base64,${b256.toString("base64")}`,
    };
  } catch {
    return { icon_64: null, icon_128: null, icon_256: null };
  }
};


// --- Routes ---

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    
    // Using supabase service role key bypasses RLS so we can select passwords
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username?.trim())
      .single();

    if (
      error || !admin ||
      crypto
        .createHash("sha256")
        .update(password || "")
        .digest("hex") !== admin.password_hash
    ) {
      return res.status(401).json({ error: "Auth failed" });
    }
    
    res.json({ success: true, role: admin.role || "admin" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/data", async (req, res) => {
  try {
    const t = normalizeTenant(req.query.tenant);
    
    const [scResult, lcResult, cfgResult] = await Promise.all([
      supabase
        .from('shortcuts')
        .select('*')
        .eq('tenant', t)
        .order('favorite', { ascending: false })
        .order('sort_index', { ascending: true })
        .order('created_at', { ascending: false }),
        
      supabase
        .from('label_colors')
        .select('name, color_class')
        .eq('tenant', t),
        
      supabase
        .from('app_config')
        .select('key, value')
    ]);

    if (scResult.error) throw scResult.error;
    if (lcResult.error) throw lcResult.error;
    if (cfgResult.error) throw cfgResult.error;

    const lcm = {};
    const ac = {};
    
    (lcResult.data || []).forEach((l) => (lcm[l.name] = l.color_class));
    (cfgResult.data || []).forEach((c) => (ac[c.key] = c.value));

    res.json({ 
      shortcuts: scResult.data || [], 
      labelColors: lcm, 
      appConfig: ac, 
      tenant: t 
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/config", async (req, res) => {
  try {
    const c = req.body;
    
    const rows = Object.entries(c).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from('app_config')
        .upsert(rows);
        
      if (error) throw error;
    }
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/config/force", async (req, res) => {
  try {
    const cfg = req.body || {};
    const version = Date.now().toString();
    
    const rows = Object.entries(cfg).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    
    rows.push({ key: 'config_version', value: version });

    if (rows.length > 0) {
      const { error } = await supabase
        .from('app_config')
        .upsert(rows);
        
      if (error) throw error;
    }
    
    res.json({ success: true, version });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/reorder", async (req, res) => {
  try {
    const { order, tenant } = req.body || {};
    const ten = normalizeTenant(tenant);
    if (!Array.isArray(order))
      return res.status(400).json({ error: "Invalid order" });
      
    // Supabase does not support bulk updates exactly like this easily without RPC
    // We will do parallel updates 
    const promises = order.map((id, idx) => {
      return supabase
        .from('shortcuts')
        .update({ sort_index: idx + 1 })
        .eq('id', id)
        .eq('tenant', ten);
    });
    
    await Promise.all(promises);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/shortcuts", async (req, res) => {
  try {
    const d = normPayload(req.body);
    const th = await genThumb(d.icon_url);
    
    const { error: scError } = await supabase
      .from('shortcuts')
      .upsert({
        tenant: d.tenant,
        name: d.name,
        url: d.url,
        icon_url: d.icon_url,
        icon_64: th.icon_64,
        icon_128: th.icon_128,
        icon_256: th.icon_256,
        parent_label: d.parent_label,
        child_label: d.child_label,
        favorite: 0,
        clicks: 0
      }, { onConflict: 'name, url, tenant' });
      
    if (scError) throw scError;

    const labelRows = [];
    if (d.parent_label && d.parent_color) {
      labelRows.push({ name: d.parent_label, tenant: d.tenant, color_class: d.parent_color });
    }
    if (d.child_label && d.child_color) {
      d.child_label.split(",").forEach((t) => {
        labelRows.push({ name: t.trim(), tenant: d.tenant, color_class: d.child_color });
      });
    }

    if (labelRows.length > 0) {
      const { error: lcError } = await supabase
        .from('label_colors')
        .upsert(labelRows, { onConflict: 'name, tenant' });
        
      if (lcError) throw lcError;
    }

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/shortcuts/:id", async (req, res) => {
  try {
    const d = normPayload(req.body);
    const id = +req.params.id;
    const th = await genThumb(d.icon_url);
    
    const { data: updated, error: scError } = await supabase
      .from('shortcuts')
      .update({
        name: d.name,
        url: d.url,
        icon_url: d.icon_url,
        icon_64: th.icon_64,
        icon_128: th.icon_128,
        icon_256: th.icon_256,
        parent_label: d.parent_label,
        child_label: d.child_label
      })
      .eq('id', id)
      .eq('tenant', d.tenant)
      .select();
      
    if (scError) throw scError;
    
    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    const labelRows = [];
    if (d.parent_label && d.parent_color) {
      labelRows.push({ name: d.parent_label, tenant: d.tenant, color_class: d.parent_color });
    }
    if (d.child_label && d.child_color) {
      d.child_label.split(",").forEach((t) => {
        labelRows.push({ name: t.trim(), tenant: d.tenant, color_class: d.child_color });
      });
    }

    if (labelRows.length > 0) {
      const { error: lcError } = await supabase
        .from('label_colors')
        .upsert(labelRows, { onConflict: 'name, tenant' });
        
      if (lcError) throw lcError;
    }
    
    await cleanupOrphanLabels(d.tenant);
    res.json({ success: true });
    
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/shortcuts/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    
    const { data: shortcut, error: fetchErr } = await supabase
      .from('shortcuts')
      .select('tenant')
      .eq('id', id)
      .single();
      
    if (fetchErr || !shortcut) {
      return res.status(404).json({ error: "Not found" });
    }
    
    const { error: delErr } = await supabase
      .from('shortcuts')
      .delete()
      .eq('id', id);
      
    if (delErr) throw delErr;

    await cleanupOrphanLabels(shortcut.tenant);
    res.json({ success: true });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/click/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    
    // We fetch current then update. Real world might use RPC for increment
    const { data: shortcut, error: fetchErr } = await supabase
      .from('shortcuts')
      .select('clicks')
      .eq('id', id)
      .single();
      
    if (!fetchErr && shortcut) {
      await supabase
        .from('shortcuts')
        .update({ clicks: shortcut.clicks + 1 })
        .eq('id', id);
    }
    
    await supabase.from('click_logs').insert([{ shortcut_id: id }]);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
});

router.post("/favorite/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    
    const { data: shortcut, error: fetchErr } = await supabase
      .from('shortcuts')
      .select('favorite')
      .eq('id', id)
      .single();
      
    if (fetchErr || !shortcut) return res.status(404).json({ error: "Not found" });
    
    const nv = shortcut.favorite ? 0 : 1;
    
    await supabase
      .from('shortcuts')
      .update({ favorite: nv })
      .eq('id', id);
      
    res.json({ success: true, favorite: nv });
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
});


// Insights query helpers relying on REST are harder than raw SQL.
// If using Supabase, calling raw SQL requires RPC.
// Or we fetch all data and process in memory, which is slow for huge datasets.
// For simplicity here, we do some basic fetching and memory processing since it's a small app.

router.get("/insights", async (req, res) => {
  try {
    // Total clicks
    const { count, error: countErr } = await supabase
      .from('click_logs')
      .select('*', { count: 'exact', head: true });
      
    // Top 10 apps
    // This usually requires a JOIN and GROUP BY in SQL.
    // In postgrest, we can do resource embedding:
    const { data: clicksData, error: clickErr } = await supabase
      .from('click_logs')
      .select(`
        shortcut_id,
        clicked_at,
        shortcuts(name)
      `);
      
    if (clickErr) throw clickErr;

    // Process top 10 apps memory-side
    const appCounts = {};
    clicksData.forEach(c => {
      const n = c.shortcuts?.name || 'Deleted';
      appCounts[n] = (appCounts[n] || 0) + 1;
    });
    
    const topApps = Object.entries(appCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentClicks = clicksData.filter(c => new Date(c.clicked_at) >= sevenDaysAgo);
    
    const timelineCounts = {};
    recentClicks.forEach(c => {
      const d = c.clicked_at.split('T')[0];
      timelineCounts[d] = (timelineCounts[d] || 0) + 1;
    });
    
    const timeline = Object.entries(timelineCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, count]) => ({ d, count }));

    // Hourly
    const hourlyCounts = {};
    clicksData.forEach(c => {
      // Supabase returns ISO format 2024-03-01T15:00:00.000000Z
      const h = new Date(c.clicked_at).getUTCHours().toString().padStart(2, '0');
      hourlyCounts[h] = (hourlyCounts[h] || 0) + 1;
    });
    
    const hourly = Object.entries(hourlyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([h, count]) => ({ h, count }));

    res.json({ totalClicks: count || 0, topApps, timeline, hourly });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get("/insights/export", async (req, res) => {
  try {
    const { data: l, error } = await supabase
      .from('click_logs')
      .select('clicked_at, shortcuts(name, tenant, parent_label, child_label, clicks)')
      .order('clicked_at', { ascending: false });

    if (error) throw error;

    const csv = [
      "Time,App,Tenant,Group,Tags,Total_Clicks",
      ...l.map(
        (r) =>
          `${r.clicked_at},"${(r.shortcuts?.name || "Deleted").replace(/"/g, '""')}",${
            r.shortcuts?.tenant || 'default'
          },${r.shortcuts?.parent_label || ""},"${(r.shortcuts?.child_label || "").replace(
            /"/g,
            '""'
          )}",${r.shortcuts?.clicks || 0}`
      ),
    ].join("\n");
    res.header("Content-Type", "text/csv");
    res.attachment(
      `insights_full_${new Date().toISOString().slice(0, 10)}.csv`
    );
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});


router.get("/insights/export/summary", async (req, res) => {
  try {
    const { data: l, error } = await supabase
      .from('click_logs')
      .select('clicked_at, shortcuts(name, tenant, parent_label, child_label)')
      
    if (error) throw error;
      
    const groups = {};
    l.forEach(c => {
        const d = c.clicked_at.split('T')[0];
        const app = c.shortcuts?.name || 'Deleted';
        const tenant = c.shortcuts?.tenant || 'default';
        const grp = c.shortcuts?.parent_label || '';
        const tags = c.shortcuts?.child_label || '';
        
        const key = `${d}|${app}|${tenant}|${grp}|${tags}`;
        groups[key] = (groups[key] || 0) + 1;
    });

    const rows = Object.entries(groups).map(([k, count]) => {
        const [date, app, tenant, grp, tags] = k.split('|');
        return `${date},"${app.replace(/"/g, '""')}",${tenant},${grp},"${tags.replace(/"/g, '""')}",${count}`;
    }).sort((a,b) => b.localeCompare(a)); // sort descending string
    
    const csv = [
      "Date,App,Tenant,Group,Tags,Clicks",
      ...rows
    ].join("\n");
    res.header("Content-Type", "text/csv");
    res.attachment(
      `insights_summary_${new Date().toISOString().slice(0, 10)}.csv`
    );
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// Import Logic
router.post("/import", async (req, res) => {
  const { shortcuts: sc, labels: lb, tenant: t } = req.body || {};
  const root = normalizeTenant(t);

  try {
    const aff = new Set();
    const scRows = [];
    
    (Array.isArray(sc) ? sc : []).forEach((s) => {
      if (!s?.name || !s?.url) return;
      let ten = normalizeTenant(s.tenant || root);
      try {
        if (!new URL(s.url).protocol.startsWith("http")) return;
      } catch {
        return;
      }

      scRows.push({
        tenant: ten,
        name: s.name.trim(),
        url: s.url.trim(),
        icon_url: s.icon_url || "",
        icon_64: s.icon_64 || null,
        icon_128: s.icon_128 || null,
        icon_256: s.icon_256 || null,
        parent_label: s.parent_label || "",
        child_label: s.child_label || "",
        favorite: s.favorite ? 1 : 0,
        clicks: Math.max(0, +s.clicks || 0)
      });
      aff.add(ten);
    });

    if (scRows.length > 0) {
        const { error } = await supabase.from('shortcuts').upsert(scRows, { onConflict: 'name, url, tenant' });
        if (error) console.error("Import shortcut error:", error);
    }

    const lbRows = [];
    (Array.isArray(lb) ? lb : []).forEach((l) => {
      if (!l?.name) return;
      let ten = normalizeTenant(l.tenant || root);
      lbRows.push({
        name: l.name.trim(),
        tenant: ten,
        color_class: l.color_class || ""
      });
      aff.add(ten);
    });
    
    if (lbRows.length > 0) {
        const { error } = await supabase.from('label_colors').upsert(lbRows, { onConflict: 'name, tenant' });
        if (error) console.error("Import labels error:", error);
    }

    // Cleanup parallel mapping
    await Promise.all(Array.from(aff).map(ten => cleanupOrphanLabels(ten)));

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Image Search - Upload temp image for Google Lens search
router.post("/image-search", async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || !image.startsWith("data:image")) {
      return res.status(400).json({ error: "Invalid image data" });
    }

    // Extract mime type and base64 data
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    const filename = `${randomUUID()}.${ext}`;
    
    // Calculate file size
    const fileBuffer = Buffer.from(base64Data, "base64");
    const fileSize = fileBuffer.length;

    // Get client info
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('temp_images')
      .upload(filename, fileBuffer, {
        contentType: `image/${matches[1]}`,
        upsert: true
      });

    if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('temp_images')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    // Log to database
    try {
      await supabase.from('image_search_logs').insert([{
          client_ip: clientIp,
          user_agent: userAgent,
          file_size: fileSize,
          file_type: `image/${matches[1]}`,
          filename: filename
      }]);
    } catch (logErr) {
      console.error("[Image Search] Failed to log:", logErr.message);
    }

    // Since this is serverless, we don't use setTimeout to delete the file
    // Ideally, a cron job or Supabase trigger cleans up the bucket, but we can't reliably setTimeout in Vercel.
    // However, since it is a small app we could fire an async delete that awaits a delay
    // Note: On vercel, the execution context dies soon after response is sent, so this is best-effort.
    setTimeout(async () => {
        try {
            await supabase.storage.from('temp_images').remove([filename]);
            console.log(`Cleaned up temp image: ${filename} from storage`);
        } catch(e) {
            console.error("Cleanup error", e);
        }
    }, 5000);

    // Return the public URL path
    res.json({
      success: true,
      url: publicUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get image search logs (admin only)
router.get("/image-search/logs", async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('image_search_logs')
      .select('id, client_ip, user_agent, file_size, file_type, filename, searched_at')
      .order('searched_at', { ascending: false })
      .limit(100);
      
    if (error) throw error;
      
    res.json({ logs: logs || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get("/health", async (req, res) => {
  try {
    // Check database connectivity
    let dbStatus = "connected";
    const { error } = await supabase.from('admins').select('username').limit(1);
    if (error) dbStatus = "error";

    // Get system info
    const memUsage = process.memoryUsage();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: dbStatus,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
        rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
      },
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: e.message,
    });
  }
});

export default router;
