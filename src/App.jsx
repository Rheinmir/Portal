import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Trash2, Plus, Search, Activity, Copy, Check, Settings, LogOut, X, Filter, Tag, Upload, Download, FileUp, Pencil, Star, Moon, Sun, LayoutGrid, List } from 'lucide-react';

const COLOR_PRESETS = ['#0A1A2F', '#009FB8', '#6D28D9', '#BE123C', '#059669', '#C2410C', '#475569'];
const getGradientStyle = (hex) => hex ? { background: `linear-gradient(135deg, ${hex}, ${hex}dd)` } : {};

export default function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [labelColors, setLabelColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  // Sort: 'default' | 'alpha' | 'group'
  const [sortBy, setSortBy] = useState('default');

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

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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
    if (!window.confirm('Xóa ứng dụng này?')) return;
    try { if ((await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' })).ok) await fetchData(); } catch (e) { alert('Lỗi server'); }
  };

  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
        const res = await fetch(`/api/favorite/${id}`, { method: 'POST' });
        if (res.ok) {
            const { favorite } = await res.json();
            setShortcuts(prev => prev.map(s => s.id === id ? { ...s, favorite } : s));
        }
    } catch (e) { console.error(e); }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setFormData({ 
        id: item.id, name: item.name, url: item.url, 
        icon_url: item.icon_256 || item.icon_url || '', // Prefer high res
        parent_label: item.parent_label||'', parent_color: labelColors[item.parent_label]||COLOR_PRESETS[0], 
        child_label: item.child_label||'', child_color: labelColors[item.child_label]||COLOR_PRESETS[1] 
    });
    setShowAddModal(true);
  };

  const handleLinkClick = (id, url) => {
    fetch(`/api/click/${id}`, { method: 'POST' }).catch(()=>{});
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, clicks: (s.clicks||0) + 1 } : s));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
        // Just load raw base64 to preview, server handles sharp resizing
        setFormData(p => ({ ...p, icon_url: ev.target.result }));
    }; 
    r.readAsDataURL(file);
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCreds.username === 'admin' && loginCreds.password === 'miniappadmin') { setIsAdmin(true); setShowLoginModal(false); setLoginCreds({username:'',password:''}); }
    else setLoginError('Sai thông tin!');
  };

  // --- FILTERS & SORTING ---
  const uniqueParents = useMemo(() => [...new Set(shortcuts.map(s => s.parent_label).filter(Boolean))].sort(), [shortcuts]);
  const uniqueChildren = useMemo(() => [...new Set(shortcuts.map(s => s.child_label).filter(Boolean))].sort(), [shortcuts]);
  
  const filteredShortcuts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = shortcuts.filter(i => 
        (!term || i.name.toLowerCase().includes(term) || i.url.toLowerCase().includes(term)) && 
        (!activeParentFilter || i.parent_label === activeParentFilter) && 
        (!activeChildFilter || i.child_label === activeChildFilter)
    );

    // Sort Logic
    result.sort((a, b) => {
        // Always prioritize favorites first
        if (a.favorite !== b.favorite) return b.favorite - a.favorite;
        
        if (sortBy === 'alpha') return a.name.localeCompare(b.name);
        if (sortBy === 'group') {
            const pA = a.parent_label || 'zz'; // Put no-label at bottom
            const pB = b.parent_label || 'zz';
            return pA.localeCompare(pB) || a.name.localeCompare(b.name);
        }
        // Default: created_at DESC (handled by SQL usually, but fallback here)
        return 0; 
    });

    return result;
  }, [shortcuts, searchTerm, activeParentFilter, activeChildFilter, sortBy]);

  // Common styles
  const bgClass = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#F4F4F4] text-[#2C2C2C]';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-[#D8D8D8] hover:border-[#009FB8]';
  const inputClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-[#D8D8D8] text-[#2C2C2C]';
  const modalClass = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-[#D8D8D8] text-[#2C2C2C]';

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bgClass}`}><Activity className="w-8 h-8 animate-spin mx-auto mb-1"/><p className="text-sm">Loading...</p></div>;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bgClass}`}>
      {/* HEADER: Flex layout handles mobile overlapping better */}
      <div className="sticky top-0 z-30 w-full flex flex-col pt-4 px-4 gap-2 pointer-events-none">
        
        <div className="pointer-events-auto w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* LEFT: Search & Filters */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
             <div className="relative group w-full max-w-sm transition-all duration-300">
                <Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 text-gray-400" />
                <input type="text" className={`block w-full pl-10 pr-3 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8] ${inputClass}`} placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             
             {/* Mobile Filter Toggle */}
             <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-full shadow-sm border transition-all shrink-0 ${showFilterPanel||activeParentFilter||activeChildFilter ? 'bg-[#009FB8] text-white' : inputClass}`}>
                <Filter size={18} />
             </button>

             {/* Sort Toggle (Desktop mainly, icon on mobile) */}
             <div className="hidden sm:flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-full p-1">
                <button onClick={() => setSortBy('default')} className={`p-1.5 rounded-full text-xs ${sortBy === 'default' ? 'bg-white dark:bg-gray-700 shadow' : 'opacity-50'}`} title="Mặc định"><List size={14}/></button>
                <button onClick={() => setSortBy('alpha')} className={`p-1.5 rounded-full text-xs ${sortBy === 'alpha' ? 'bg-white dark:bg-gray-700 shadow' : 'opacity-50'}`} title="A-Z">Aa</button>
                <button onClick={() => setSortBy('group')} className={`p-1.5 rounded-full text-xs ${sortBy === 'group' ? 'bg-white dark:bg-gray-700 shadow' : 'opacity-50'}`} title="Nhóm"><LayoutGrid size={14}/></button>
             </div>
          </div>

          {/* RIGHT: Settings/Admin & DarkMode */}
          <div className="flex items-center gap-2 shrink-0">
             <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full border shadow-sm ${inputClass}`}>
                {darkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-gray-600"/>}
             </button>
             {isAdmin ? (
                <div className={`flex items-center gap-2 px-2 py-1 rounded-full border shadow-lg ${modalClass}`}>
                   <button onClick={() => { resetForm(); setShowAddModal(true); }} className="p-1.5 bg-[#0F2F55] text-white rounded-full hover:scale-110" title="Thêm mới"><Plus size={16}/></button>
                   <button onClick={handleExportData} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-500" title="Xuất dữ liệu"><Download size={16}/></button>
                   <button onClick={() => importInputRef.current?.click()} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-green-500" title="Nhập dữ liệu"><FileUp size={16}/></button>
                   <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                   <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                   <button onClick={() => setIsAdmin(false)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500" title="Đăng xuất"><LogOut size={16}/></button>
                </div>
             ) : (
                <button onClick={() => setShowLoginModal(true)} className={`p-2 rounded-full border shadow-lg hover:scale-105 transition-transform ${inputClass}`}>
                   <Settings size={18} />
                </button>
             )}
          </div>
        </div>

        {/* Filter Panel (Expandable) */}
        {(showFilterPanel || activeParentFilter || activeChildFilter) && (
            <div className={`pointer-events-auto w-full max-w-5xl mx-auto rounded-2xl p-3 shadow-lg flex flex-col gap-3 border ${modalClass}`}>
               <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase opacity-60">Nhóm:</span>
                  <button onClick={() => setActiveParentFilter(null)} className={`px-3 py-1 text-xs rounded-full border transition-all ${!activeParentFilter ? 'bg-[#0A1A2F] text-white border-[#0A1A2F]' : 'bg-transparent border-gray-300'}`}>All</button>
                  {uniqueParents.map(l => <button key={l} onClick={() => setActiveParentFilter(activeParentFilter === l ? null : l)} className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-all ${activeParentFilter === l ? 'text-white border-transparent ring-2 ring-[#009FB8]' : 'bg-transparent border-gray-300'}`} style={activeParentFilter === l ? { background: labelColors[l] } : {}}>{l}</button>)}
               </div>
               
               {/* Mobile Sort Options inside panel */}
               <div className="sm:hidden flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold uppercase opacity-60">Sắp xếp:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`text-xs p-1 rounded border ${inputClass}`}>
                     <option value="default">Mặc định (Mới nhất)</option>
                     <option value="alpha">Tên (A-Z)</option>
                     <option value="group">Theo Nhóm</option>
                  </select>
               </div>

               {uniqueChildren.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-2"><span className="text-xs font-bold uppercase opacity-60">Tag:</span>
                  {uniqueChildren.map(l => <button key={l} onClick={() => setActiveChildFilter(activeChildFilter === l ? null : l)} className={`px-2 py-0.5 text-[10px] rounded-md border flex items-center gap-1 transition-all ${activeChildFilter === l ? 'bg-[#009FB8] text-white border-[#009FB8]' : 'bg-transparent border-gray-300'}`} style={activeChildFilter === l && labelColors[l] ? { background: labelColors[l], color: 'white', borderColor: labelColors[l] } : {}}><Tag size={10} /> {l}</button>)}
               </div>}
            </div>
        )}
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-6 pb-20 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-10 justify-items-center">
            {filteredShortcuts.map((item) => (
              <div key={item.id} className="group relative flex flex-col items-center w-28 cursor-pointer active:scale-95 transition-transform" onClick={() => handleLinkClick(item.id, item.url)}>
                
                {/* Actions Overlay */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                   <button onClick={(e) => { e.stopPropagation(); setCopiedId(item.id); navigator.clipboard.writeText(item.url); setTimeout(() => setCopiedId(null), 1000); }} className={`p-1.5 rounded-full shadow-sm border ${cardClass}`}>
                        {copiedId === item.id ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
                   </button>
                   {isAdmin && <><button onClick={e => handleEdit(item, e)} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Pencil size={12}/></button><button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Trash2 size={12}/></button></>}
                </div>

                {/* Favorite Button */}
                <button onClick={(e) => handleToggleFavorite(item.id, e)} className={`absolute -top-1 -left-1 z-10 p-1 rounded-full transition-transform hover:scale-110 ${item.favorite ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}>
                    <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
                </button>

                {/* Icon Box */}
                <div className={`w-20 h-20 rounded-[1.4rem] bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold shadow-md hover:shadow-lg transition-all mb-2 overflow-hidden relative`} 
                     style={getGradientStyle(labelColors[item.parent_label] || '#0A1A2F')}>
                  {item.icon_256 || item.icon_128 || item.icon_url ? <img src={item.icon_256 || item.icon_128 || item.icon_url} alt={item.name} className="w-full h-full object-cover" /> : <span>{item.name.charAt(0).toUpperCase()}</span>}
                </div>
                
                <span className={`text-sm font-medium text-center truncate w-32 px-1 leading-tight ${darkMode ? 'text-gray-300' : 'text-[#5A5A5A]'}`}>{item.name}</span>
                
                <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                    {item.parent_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white truncate max-w-[70px]" style={{ background: labelColors[item.parent_label] || '#9CA3AF' }}>{item.parent_label}</span>}
                    {item.child_label && <span className={`text-[9px] px-1.5 py-0.5 rounded-full border truncate max-w-[70px] ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} style={{ borderColor: labelColors[item.child_label] }}>{item.child_label}</span>}
                </div>
              </div>
            ))}
            
            {isAdmin && (
              <div className="flex flex-col items-center w-28 cursor-pointer group" onClick={() => { resetForm(); setShowAddModal(true); }}>
                  <div className={`w-20 h-20 rounded-[1.4rem] border-2 border-dashed flex items-center justify-center transition-all mb-3 ${darkMode ? 'border-gray-700 bg-gray-800 hover:border-gray-500' : 'border-gray-300 bg-gray-100 hover:border-[#009FB8]'}`}>
                    <Plus size={32} className="opacity-50"/>
                  </div>
                  <span className="text-sm font-medium opacity-50">Thêm App</span>
              </div>
            )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-xs p-6 border ${modalClass}`}>
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold">Đăng nhập Admin</h3><button onClick={() => setShowLoginModal(false)}><X size={20}/></button></div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Username" className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`} value={loginCreds.username} onChange={e => setLoginCreds({...loginCreds, username: e.target.value})} />
              <input type="password" placeholder="Password" className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`} value={loginCreds.password} onChange={e => setLoginCreds({...loginCreds, password: e.target.value})} />
              {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              <button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg hover:bg-opacity-90">Đăng nhập</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border ${modalClass}`}>
             <div className="flex justify-between items-center mb-4"><h3 className="font-bold">{formData.id ? 'Sửa' : 'Thêm'} Ứng Dụng</h3><button onClick={() => setShowAddModal(false)}><X size={20}/></button></div>
             <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Tên App" className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input type="url" placeholder="URL" className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required />
                
                {/* Upload Area */}
                <div onClick={() => fileInputRef.current?.click()} className={`w-full px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 border ${inputClass} hover:opacity-80`}>
                    {formData.icon_url ? <img src={formData.icon_url} className="w-10 h-10 rounded border object-cover"/> : <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><Upload size={20}/></div>}
                    <div>
                        <p className="text-sm font-medium">Tải icon lên</p>
                        <p className="text-xs opacity-60">Tự động resize & tạo thumbnail</p>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                
                <div className={`border-t pt-3 space-y-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                        <input type="text" placeholder="Nhóm lớn" className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`} value={formData.parent_label} onChange={e => setFormData({...formData, parent_label: e.target.value})} />
                        <div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer">
                            <input type="color" className="absolute -top-2 -left-2 w-12 h-12" value={formData.parent_color} onChange={e => setFormData({...formData, parent_color: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                        <input type="text" placeholder="Nhóm con" className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`} value={formData.child_label} onChange={e => setFormData({...formData, child_label: e.target.value})} />
                        <div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer">
                            <input type="color" className="absolute -top-2 -left-2 w-12 h-12" value={formData.child_color} onChange={e => setFormData({...formData, child_color: e.target.value})} />
                        </div>
                    </div>
                </div>
                <button className="w-full py-3 bg-[#0F2F55] text-white rounded-xl mt-2 hover:bg-opacity-90">Lưu thay đổi</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
