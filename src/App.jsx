import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Plus, Search, Database, Activity, Copy, Check, Settings, LogOut, Lock, X, Filter, Image as ImageIcon, Tag, Palette, Upload, Download, FileUp, Pencil } from 'lucide-react';

const COLOR_PRESETS = [
  '#0A1A2F', '#009FB8', '#6D28D9', '#BE123C', '#059669', '#C2410C', '#475569'
];

// Helper to generate gradient from hex
const getGradientStyle = (hexColor) => {
    if (!hexColor) return {};
    // Simple logic: Use hex as start, and a calculated lighter/darker color could be complex without a library.
    // For simplicity, we'll use a linear gradient with some transparency overlay or just the solid color if complex.
    // Let's rely on standard CSS linear-gradient with the color and a hardcoded transparent mix.
    return { background: `linear-gradient(135deg, ${hexColor}, ${hexColor}dd)` };
};

export default function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [labelColors, setLabelColors] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({ 
    id: null, // New: Track ID for editing
    name: '', url: '', icon_url: '', 
    parent_label: '', parent_color: COLOR_PRESETS[0],
    child_label: '', child_color: COLOR_PRESETS[1] 
  });
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  
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

  // --- API FUNCTIONS ---
  const fetchData = async () => {
    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        setShortcuts(data.shortcuts || []);
        setLabelColors(data.labelColors || {});
        setLoading(false);
    } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const method = formData.id ? 'PUT' : 'POST';
        const url = formData.id ? `/api/shortcuts/${formData.id}` : '/api/shortcuts';
        
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        await fetchData();
        resetForm();
        setShowAddModal(false);
    } catch (err) {
        alert("Lỗi server: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
        await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
        await fetchData();
    }
  };

  const handleEdit = (item, e) => {
      e.stopPropagation(); // Prevent opening link
      setFormData({
          id: item.id,
          name: item.name,
          url: item.url,
          icon_url: item.icon_url,
          parent_label: item.parent_label || '',
          parent_color: labelColors[item.parent_label] || COLOR_PRESETS[0],
          child_label: item.child_label || '',
          child_color: labelColors[item.child_label] || COLOR_PRESETS[1],
      });
      setShowAddModal(true);
  };

  const resetForm = () => {
      setFormData({ 
        id: null,
        name: '', url: '', icon_url: '', 
        parent_label: '', parent_color: COLOR_PRESETS[0],
        child_label: '', child_color: COLOR_PRESETS[1] 
      });
  };

  const handleLinkClick = async (id, url) => {
    // Fire and forget update click count
    fetch(`/api/click/${id}`, { method: 'POST' });
    // Optimistic update
    setShortcuts(prev => prev.map(s => s.id === id ? {...s, clicks: s.clicks + 1} : s));
    window.open(url, '_blank');
  };

  const handleExportData = () => {
    const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        shortcuts: shortcuts.map(({id, ...rest}) => rest), // remove ID
        labels: Object.entries(labelColors).map(([name, color_class]) => ({name, color_class}))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_sqlite_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(importedData)
            });
            alert("Import thành công!");
            await fetchData();
        } catch (err) {
            alert("Lỗi import: " + err.message);
        }
        e.target.value = null;
    };
    reader.readAsText(file);
  };

  // --- UI HELPERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const scale = Math.max(256 / img.width, 256 / img.height);
            const x = (256 - img.width * scale) / 2;
            const y = (256 - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            setFormData({...formData, icon_url: canvas.toDataURL('image/png')});
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCreds.username === 'admin' && loginCreds.password === 'miniappadmin') {
      setIsAdmin(true); setShowLoginModal(false); setLoginCreds({ username: '', password: '' }); setLoginError('');
    } else { setLoginError('Sai tài khoản hoặc mật khẩu!'); }
  };

  const uniqueParents = [...new Set(shortcuts.map(s => s.parent_label).filter(Boolean))];
  const uniqueChildren = [...new Set(shortcuts.map(s => s.child_label).filter(Boolean))];

  const filteredShortcuts = shortcuts.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = activeParentFilter ? item.parent_label === activeParentFilter : true;
    const matchesChild = activeChildFilter ? item.child_label === activeChildFilter : true;
    return matchesSearch && matchesParent && matchesChild;
  });

  const getAppStyle = (item) => {
    const color = labelColors[item.parent_label] || '#0A1A2F'; // Default Navy
    return getGradientStyle(color);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4] text-[#5A5A5A]"><Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-[#4F7CAF]" /><p className="text-sm font-medium">Loading Database...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans text-[#2C2C2C] relative selection:bg-[#D6E4F5] selection:text-[#0A1A2F] overflow-x-hidden">
      {/* HEADER BAR */}
      <div className="sticky top-0 z-30 w-full flex flex-col items-center pt-8 px-4 pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto w-full max-w-sm">
           <div className="relative group w-full transition-all duration-300">
              <Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 text-[#A0A0A0] group-focus-within:text-[#009FB8]" />
              <input type="text" className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-[#D8D8D8]/40 text-[#2C2C2C] focus:bg-white focus:ring-2 focus:ring-[#009FB8]/50 shadow-sm backdrop-blur-sm transition-all text-sm" placeholder="Tìm kiếm ứng dụng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-full shadow-sm transition-all ${showFilterPanel || activeParentFilter ? 'bg-[#009FB8] text-white' : 'bg-white text-[#A0A0A0]'}`}><Filter size={18} /></button>
        </div>

        {/* Filter Panel */}
        {(showFilterPanel || activeParentFilter || activeChildFilter) && (
            <div className="pointer-events-auto w-full max-w-xl bg-white/80 backdrop-blur-md border border-[#D8D8D8] rounded-2xl p-3 shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
               <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#A0A0A0] uppercase">Nhóm:</span>
                  <button onClick={() => setActiveParentFilter(null)} className={`px-3 py-1 text-xs rounded-full border transition-all ${!activeParentFilter ? 'bg-[#0A1A2F] text-white' : 'bg-transparent text-[#5A5A5A]'}`}>Tất cả</button>
                  {uniqueParents.map(label => (
                    <button key={label} onClick={() => setActiveParentFilter(activeParentFilter === label ? null : label)} className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-all ${activeParentFilter === label ? 'text-white border-transparent ring-2 ring-[#009FB8]' : 'bg-white text-[#5A5A5A]'}`} style={activeParentFilter === label ? { background: labelColors[label] } : {}}>{label}</button>
                  ))}
               </div>
               {uniqueChildren.length > 0 && (
                   <div className="flex flex-wrap items-center gap-2 border-t border-[#D8D8D8] pt-2">
                      <span className="text-xs font-bold text-[#A0A0A0] uppercase">Tag:</span>
                      {uniqueChildren.map(label => (
                        <button key={label} onClick={() => setActiveChildFilter(activeChildFilter === label ? null : label)} className={`px-2 py-0.5 text-[10px] rounded-md border flex items-center gap-1 transition-all ${activeChildFilter === label ? 'bg-[#009FB8] text-white' : 'bg-[#F4F4F4] text-[#5A5A5A]'}`} style={activeChildFilter === label && labelColors[label] ? { background: labelColors[label], color: 'white', borderColor: labelColors[label] } : {}}><Tag size={10} /> {label}</button>
                      ))}
                   </div>
               )}
            </div>
        )}

        {/* ADMIN TOOLS */}
        <div className="fixed top-0 right-0 p-4 z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
            {isAdmin ? (
               <div className="flex flex-col gap-2 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
                  <div className="flex gap-2">
                      <button onClick={() => { resetForm(); setShowAddModal(true); }} className="p-2 bg-[#0F2F55] text-white rounded-full hover:scale-110 transition-transform"><Plus size={18} /></button>
                      <button onClick={handleExportData} className="p-2 bg-white text-[#0A1A2F] rounded-full hover:scale-110 transition-transform border border-[#D6E4F5]"><Download size={18} /></button>
                      <button onClick={() => importInputRef.current.click()} className="p-2 bg-white text-[#009FB8] rounded-full hover:scale-110 transition-transform border border-[#D6E4F5]"><FileUp size={18} /></button>
                      <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                  </div>
                  <button onClick={() => setIsAdmin(false)} className="p-2 w-full bg-[#BE123C]/10 text-[#BE123C] rounded-xl text-xs font-bold flex items-center justify-center gap-1"><LogOut size={14} /> LOGOUT</button>
               </div>
             ) : (
               <button onClick={() => setShowLoginModal(true)} className="p-2 bg-white text-[#A0A0A0] hover:text-[#0F2F55] rounded-full shadow-lg border border-[#D8D8D8] hover:scale-105 transition-transform"><Settings size={20} /></button>
             )}
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-6 pb-20 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-10 justify-items-center">
            {filteredShortcuts.map((item) => (
              <div key={item.id} className="group relative flex flex-col items-center w-28 cursor-pointer active:scale-95 transition-transform" onClick={() => handleLinkClick(item.id, item.url)}>
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                   <button onClick={(e) => { e.stopPropagation(); copyToClipboard(item.url, item.id); }} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#009FB8] rounded-full shadow-sm border border-[#D8D8D8]">{copiedId === item.id ? <Check size={12} className="text-[#009FB8]"/> : <Copy size={12} />}</button>
                   {isAdmin && (
                     <>
                       <button onClick={(e) => handleEdit(item, e)} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#0A1A2F] rounded-full shadow-sm border border-[#D8D8D8] ml-1"><Pencil size={12} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 bg-white text-[#A0A0A0] hover:text-[#0A1A2F] rounded-full shadow-sm border border-[#D8D8D8] ml-1"><Trash2 size={12} /></button>
                     </>
                   )}
                </div>
                <div className={`w-20 h-20 rounded-[1.4rem] flex items-center justify-center text-white text-3xl font-bold shadow-md hover:shadow-lg transition-all mb-2 overflow-hidden relative`} style={getAppStyle(item)}>
                  {item.icon_url ? <img src={item.icon_url} alt={item.name} className="w-full h-full object-cover" /> : <span>{item.name.charAt(0).toUpperCase()}</span>}
                </div>
                <span className="text-sm font-medium text-[#5A5A5A] text-center truncate w-32 px-1 group-hover:text-[#0A1A2F]">{item.name}</span>
                <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                    {item.parent_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white truncate max-w-[70px]" style={{background: labelColors[item.parent_label] || '#9CA3AF'}}>{item.parent_label}</span>}
                    {item.child_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[#D8D8D8] text-[#5A5A5A] truncate max-w-[70px]" style={{borderColor: labelColors[item.child_label] || '#E5E7EB'}}>{item.child_label}</span>}
                </div>
              </div>
            ))}
            {isAdmin && <div className="flex flex-col items-center w-28 cursor-pointer group" onClick={() => { resetForm(); setShowAddModal(true); }}><div className="w-20 h-20 rounded-[1.4rem] bg-[#D8D8D8]/40 border-2 border-dashed border-[#A0A0A0] flex items-center justify-center text-[#A0A0A0] group-hover:text-[#0F2F55] transition-all mb-3"><Plus size={32} /></div><span className="text-sm font-medium text-[#A0A0A0] group-hover:text-[#0F2F55]">Thêm App</span></div>}
        </div>
      </div>

      {/* MODALS */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#0A1A2F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 border border-[#D8D8D8]">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-[#0A1A2F]">Admin Login</h3><button onClick={() => setShowLoginModal(false)}><X size={20}/></button></div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Username" className="w-full px-4 py-2 bg-[#F4F4F4] rounded-lg" value={loginCreds.username} onChange={e => setLoginCreds({...loginCreds, username: e.target.value})} />
              <input type="password" placeholder="Password" className="w-full px-4 py-2 bg-[#F4F4F4] rounded-lg" value={loginCreds.password} onChange={e => setLoginCreds({...loginCreds, password: e.target.value})} />
              {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              <button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg">Login</button>
            </form>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0A1A2F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4"><h3 className="font-bold">{formData.id ? 'Sửa Ứng Dụng' : 'Thêm Ứng Dụng'}</h3><button onClick={() => setShowAddModal(false)}><X size={20}/></button></div>
             <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Tên App" className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input type="url" placeholder="URL" className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required />
                <div onClick={() => fileInputRef.current.click()} className="w-full px-4 py-3 bg-[#F4F4F4] rounded-xl cursor-pointer flex items-center gap-2">
                    {formData.icon_url ? <img src={formData.icon_url} className="w-8 h-8 rounded"/> : <Upload size={20}/>}
                    <span className="text-sm text-gray-500">Upload Icon</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                
                <div className="border-t border-[#D8D8D8] pt-3 space-y-4">
                  <h4 className="text-xs font-bold text-[#A0A0A0] uppercase">Phân loại & Màu sắc</h4>
                  {/* Parent Label */}
                  <div>
                      <div className="flex items-center gap-2 mb-2"><input type="text" placeholder="Nhóm lớn (VD: Work)" className="flex-1 px-3 py-2 bg-[#F4F4F4] border border-[#D8D8D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8]" value={formData.parent_label} onChange={(e) => setFormData({...formData, parent_label: e.target.value})} /></div>
                      <div className="flex gap-2 items-center">
                         {COLOR_PRESETS.map(c => (<div key={c} onClick={() => setFormData({...formData, parent_color: c})} className={`w-6 h-6 rounded-full cursor-pointer border border-gray-300 ${formData.parent_color === c ? 'ring-2 ring-black' : ''}`} style={{background: c}} />))}
                         <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300">
                            <input type="color" className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value={formData.parent_color} onChange={(e) => setFormData({...formData, parent_color: e.target.value})} />
                         </div>
                      </div>
                  </div>

                  {/* Child Label */}
                  <div>
                      <div className="flex items-center gap-2 mb-2"><Tag size={14} className="text-[#A0A0A0]" /><input type="text" placeholder="Nhóm con (VD: Dev)" className="flex-1 px-3 py-2 bg-[#F4F4F4] border border-[#D8D8D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8]" value={formData.child_label} onChange={(e) => setFormData({...formData, child_label: e.target.value})} /></div>
                      <div className="flex gap-2 items-center opacity-80">
                         {COLOR_PRESETS.map(c => (<div key={c + '_child'} onClick={() => setFormData({...formData, child_color: c})} className={`w-5 h-5 rounded-full cursor-pointer border border-gray-300 ${formData.child_color === c ? 'ring-2 ring-black' : ''}`} style={{background: c}} />))}
                         <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-300">
                            <input type="color" className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value={formData.child_color} onChange={(e) => setFormData({...formData, child_color: e.target.value})} />
                         </div>
                      </div>
                  </div>
                </div>

                <button className="w-full py-3 bg-[#0F2F55] text-white rounded-xl">Lưu</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
