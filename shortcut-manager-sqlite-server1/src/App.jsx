import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Trash2, Plus, Search, Activity, Copy, Check, Settings, LogOut, X, Filter, Tag, Upload, Download, FileUp, Pencil } from 'lucide-react';

const COLOR_PRESETS = ['#0A1A2F', '#009FB8', '#6D28D9', '#BE123C', '#059669', '#C2410C', '#475569'];
const getGradientStyle = (hex) => hex ? { background: `linear-gradient(135deg, ${hex}, ${hex}dd)` } : {};

export default function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [labelColors, setLabelColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: null, name: '', url: '', icon_url: '', parent_label: '', parent_color: COLOR_PRESETS[0], child_label: '', child_color: COLOR_PRESETS[1] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeParentFilter, setActiveParentFilter] = useState(null);
  const [activeChildFilter, setActiveChildFilter] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      setShortcuts(data.shortcuts || []); setLabelColors(data.labelColors || {});
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => setFormData({ id: null, name: '', url: '', icon_url: '', parent_label: '', parent_color: COLOR_PRESETS[0], child_label: '', child_color: COLOR_PRESETS[1] });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return alert('Thiếu tên hoặc URL');
    try {
      const res = await fetch(formData.id ? `/api/shortcuts/${formData.id}` : '/api/shortcuts', {
        method: formData.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: formData.name.trim(), url: formData.url.trim() })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData(); resetForm(); setShowAddModal(false);
    } catch (e) { alert(e.message || 'Lỗi server'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa?')) return;
    try { if ((await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' })).ok) await fetchData(); } catch (e) { alert('Lỗi server'); }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setFormData({ id: item.id, name: item.name, url: item.url, icon_url: item.icon_url, parent_label: item.parent_label||'', parent_color: labelColors[item.parent_label]||COLOR_PRESETS[0], child_label: item.child_label||'', child_color: labelColors[item.child_label]||COLOR_PRESETS[1] });
    setShowAddModal(true);
  };

  const handleLinkClick = (id, url) => {
    fetch(`/api/click/${id}`, { method: 'POST' }).catch(()=>{});
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, clicks: (s.clicks||0) + 1 } : s));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ version: 1, timestamp: new Date().toISOString(), shortcuts: shortcuts.map(({id,...r})=>r), labels: Object.entries(labelColors).map(([n,c])=>({name:n, color_class:c})) }, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove();
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      try {
        if ((await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(ev.target.result)) })).ok) {
          alert('Thành công!'); await fetchData();
        } else throw new Error();
      } catch { alert('Lỗi import'); } finally { e.target.value = null; }
    };
    r.readAsText(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const img = new Image(); img.onload = () => {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const ctx = c.getContext('2d'); const s = Math.max(256/img.width, 256/img.height);
        ctx.drawImage(img, (256-img.width*s)/2, (256-img.height*s)/2, img.width*s, img.height*s);
        setFormData(p => ({ ...p, icon_url: c.toDataURL('image/png') }));
      }; img.src = ev.target.result;
    }; r.readAsDataURL(file);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCreds.username === 'admin' && loginCreds.password === 'miniappadmin') { setIsAdmin(true); setShowLoginModal(false); setLoginCreds({username:'',password:''}); }
    else setLoginError('Sai thông tin!');
  };

  const uniqueParents = useMemo(() => [...new Set(shortcuts.map(s => s.parent_label).filter(Boolean))].sort(), [shortcuts]);
  const uniqueChildren = useMemo(() => [...new Set(shortcuts.map(s => s.child_label).filter(Boolean))].sort(), [shortcuts]);
  const filteredShortcuts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return shortcuts.filter(i => (!term || i.name.toLowerCase().includes(term) || i.url.toLowerCase().includes(term)) && (!activeParentFilter || i.parent_label === activeParentFilter) && (!activeChildFilter || i.child_label === activeChildFilter));
  }, [shortcuts, searchTerm, activeParentFilter, activeChildFilter]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4] text-[#5A5A5A]"><Activity className="w-8 h-8 animate-spin mx-auto mb-1" /><p className="text-sm">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans text-[#2C2C2C] selection:bg-[#D6E4F5] overflow-x-hidden">
      <div className="sticky top-0 z-30 w-full flex flex-col items-center pt-8 px-4 pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto w-full max-w-sm">
          <div className="relative group w-full transition-all duration-300">
            <Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 text-[#A0A0A0] group-focus-within:text-[#009FB8]" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-[#D8D8D8]/40 text-[#2C2C2C] focus:bg-white focus:ring-2 focus:ring-[#009FB8]/50 shadow-sm backdrop-blur-sm transition-all text-sm" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowFilterPanel(v => !v)} className={`p-2 rounded-full shadow-sm transition-all ${showFilterPanel||activeParentFilter||activeChildFilter ? 'bg-[#009FB8] text-white' : 'bg-white text-[#A0A0A0]'}`}><Filter size={18} /></button>
        </div>
        {(showFilterPanel || activeParentFilter || activeChildFilter) && (
          <div className="pointer-events-auto w-full max-w-xl bg-white/80 backdrop-blur-md border border-[#D8D8D8] rounded-2xl p-3 shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[#A0A0A0] uppercase">Nhóm:</span>
              <button onClick={() => setActiveParentFilter(null)} className={`px-3 py-1 text-xs rounded-full border transition-all ${!activeParentFilter ? 'bg-[#0A1A2F] text-white' : 'bg-transparent text-[#5A5A5A]'}`}>Tất cả</button>
              {uniqueParents.map(l => <button key={l} onClick={() => setActiveParentFilter(activeParentFilter === l ? null : l)} className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-all ${activeParentFilter === l ? 'text-white ring-2 ring-[#009FB8] border-transparent' : 'bg-white text-[#5A5A5A]'}`} style={activeParentFilter === l ? { background: labelColors[l] } : {}}>{l}</button>)}
            </div>
            {uniqueChildren.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-[#D8D8D8] pt-2"><span className="text-xs font-bold text-[#A0A0A0] uppercase">Tag:</span>
              {uniqueChildren.map(l => <button key={l} onClick={() => setActiveChildFilter(activeChildFilter === l ? null : l)} className={`px-2 py-0.5 text-[10px] rounded-md border flex items-center gap-1 transition-all ${activeChildFilter === l ? 'bg-[#009FB8] text-white' : 'bg-[#F4F4F4] text-[#5A5A5A]'}`} style={activeChildFilter === l && labelColors[l] ? { background: labelColors[l], color: 'white', borderColor: labelColors[l] } : {}}><Tag size={10} /> {l}</button>)}
            </div>}
          </div>
        )}
        <div className="fixed top-0 right-0 p-4 z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
          {isAdmin ? <div className="flex flex-col gap-2 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setShowAddModal(true); }} className="p-2 bg-[#0F2F55] text-white rounded-full hover:scale-110"><Plus size={18} /></button>
              <button onClick={handleExportData} className="p-2 bg-white text-[#0A1A2F] rounded-full hover:scale-110 border border-[#D6E4F5]"><Download size={18} /></button>
              <button onClick={() => importInputRef.current?.click()} className="p-2 bg-white text-[#009FB8] rounded-full hover:scale-110 border border-[#D6E4F5]"><FileUp size={18} /></button>
              <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
            </div>
            <button onClick={() => setIsAdmin(false)} className="p-2 w-full bg-[#BE123C]/10 text-[#BE123C] rounded-xl text-xs font-bold flex items-center justify-center gap-1"><LogOut size={14} /> LOGOUT</button>
          </div> : <button onClick={() => setShowLoginModal(true)} className="p-2 bg-white text-[#A0A0A0] hover:text-[#0F2F55] rounded-full shadow-lg border border-[#D8D8D8] hover:scale-105"><Settings size={20} /></button>}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-20 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-10 justify-items-center">
          {filteredShortcuts.map(i => (
            <div key={i.id} className="group relative flex flex-col items-center w-28 cursor-pointer active:scale-95 transition-transform" onClick={() => handleLinkClick(i.id, i.url)}>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                <button onClick={e => { e.stopPropagation(); copyToClipboard(i.url, i.id); }} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#009FB8] rounded-full shadow-sm border border-[#D8D8D8]">{copiedId === i.id ? <Check size={12} className="text-[#009FB8]" /> : <Copy size={12} />}</button>
                {isAdmin && <><button onClick={e => handleEdit(i, e)} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#0A1A2F] rounded-full shadow-sm border border-[#D8D8D8] ml-1"><Pencil size={12} /></button><button onClick={e => { e.stopPropagation(); handleDelete(i.id); }} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#0A1A2F] rounded-full shadow-sm border border-[#D8D8D8] ml-1"><Trash2 size={12} /></button></>}
              </div>
              <div className="w-20 h-20 rounded-[1.4rem] flex items-center justify-center text-white text-3xl font-bold shadow-md hover:shadow-lg transition-all mb-2 overflow-hidden relative" style={getGradientStyle(labelColors[i.parent_label] || '#0A1A2F')}>
                {i.icon_url ? <img src={i.icon_url} alt={i.name} className="w-full h-full object-cover" /> : <span>{i.name.charAt(0).toUpperCase()}</span>}
              </div>
              <span className="text-sm font-medium text-[#5A5A5A] text-center truncate w-32 px-1 group-hover:text-[#0A1A2F]">{i.name}</span>
              <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                {i.parent_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white truncate max-w-[70px]" style={{ background: labelColors[i.parent_label] || '#9CA3AF' }}>{i.parent_label}</span>}
                {i.child_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[#D8D8D8] text-[#5A5A5A] truncate max-w-[70px]" style={{ borderColor: labelColors[i.child_label] || '#E5E7EB' }}>{i.child_label}</span>}
              </div>
            </div>
          ))}
          {isAdmin && <div className="flex flex-col items-center w-28 cursor-pointer group" onClick={() => { resetForm(); setShowAddModal(true); }}><div className="w-20 h-20 rounded-[1.4rem] bg-[#D8D8D8]/40 border-2 border-dashed border-[#A0A0A0] flex items-center justify-center text-[#A0A0A0] group-hover:text-[#0F2F55] transition-all mb-3"><Plus size={32} /></div><span className="text-sm font-medium text-[#A0A0A0] group-hover:text-[#0F2F55]">Thêm App</span></div>}
        </div>
      </div>
      {showLoginModal && <div className="fixed inset-0 bg-[#0A1A2F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 border border-[#D8D8D8]">
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-[#0A1A2F]">Admin Login</h3><button onClick={() => setShowLoginModal(false)}><X size={20} /></button></div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Username" className="w-full px-4 py-2 bg-[#F4F4F4] rounded-lg" value={loginCreds.username} onChange={e => setLoginCreds(p => ({ ...p, username: e.target.value }))} />
          <input type="password" placeholder="Password" className="w-full px-4 py-2 bg-[#F4F4F4] rounded-lg" value={loginCreds.password} onChange={e => setLoginCreds(p => ({ ...p, password: e.target.value }))} />
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}<button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg">Login</button>
        </form>
      </div></div>}
      {showAddModal && <div className="fixed inset-0 bg-[#0A1A2F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold">{formData.id ? 'Sửa' : 'Thêm'} Ứng Dụng</h3><button onClick={() => setShowAddModal(false)}><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Tên App" className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
          <input type="url" placeholder="URL" className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl" value={formData.url} onChange={e => setFormData(p => ({ ...p, url: e.target.value }))} required />
          <div onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl cursor-pointer flex items-center gap-2">{formData.icon_url ? <img src={formData.icon_url} className="w-8 h-8 rounded" alt="icon" /> : <Upload size={20} />}<span className="text-sm text-gray-500">Upload Icon</span></div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <div className="border-t border-[#D8D8D8] pt-3 space-y-4">
            <div><div className="flex items-center gap-2 mb-2"><input type="text" placeholder="Nhóm lớn" className="flex-1 px-3 py-2 bg-[#F4F4F4] border border-[#D8D8D8] rounded-lg text-sm" value={formData.parent_label} onChange={e => setFormData(p => ({ ...p, parent_label: e.target.value }))} /></div>
              <div className="flex gap-2 items-center">{COLOR_PRESETS.map(c => <div key={c} onClick={() => setFormData(p => ({ ...p, parent_color: c }))} className={`w-6 h-6 rounded-full cursor-pointer border border-gray-300 ${formData.parent_color === c ? 'ring-2 ring-black' : ''}`} style={{ background: c }} />)}<div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300"><input type="color" className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value={formData.parent_color} onChange={e => setFormData(p => ({ ...p, parent_color: e.target.value }))} /></div></div></div>
            <div><div className="flex items-center gap-2 mb-2"><Tag size={14} className="text-[#A0A0A0]" /><input type="text" placeholder="Nhóm con" className="flex-1 px-3 py-2 bg-[#F4F4F4] border border-[#D8D8D8] rounded-lg text-sm" value={formData.child_label} onChange={e => setFormData(p => ({ ...p, child_label: e.target.value }))} /></div>
              <div className="flex gap-2 items-center opacity-80">{COLOR_PRESETS.map(c => <div key={c + '_child'} onClick={() => setFormData(p => ({ ...p, child_color: c }))} className={`w-5 h-5 rounded-full cursor-pointer border border-gray-300 ${formData.child_color === c ? 'ring-2 ring-black' : ''}`} style={{ background: c }} />)}<div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-300"><input type="color" className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value={formData.child_color} onChange={e => setFormData(p => ({ ...p, child_color: e.target.value }))} /></div></div></div>
          </div>
          <button className="w-full py-3 bg-[#0F2F55] text-white rounded-xl">Lưu</button>
        </form>
      </div></div>}
    </div>
  );
}
