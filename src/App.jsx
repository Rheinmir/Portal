import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Trash2, Plus, Search, Activity, Copy, Check, Settings, LogOut, X, Filter, Tag, Upload, Download, FileUp, Pencil, Star, Moon, Sun, LayoutGrid, List, Image as ImageIcon, RotateCcw } from 'lucide-react';

const COLOR_PRESETS = ['#0A1A2F', '#009FB8', '#6D28D9', '#BE123C', '#059669', '#C2410C', '#475569'];
const getGradientStyle = (hex) => hex ? { background: `linear-gradient(135deg, ${hex}, ${hex}dd)` } : {};

export default function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [labelColors, setLabelColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  // Background State
  const [bgImage, setBgImage] = useState(null);
  const [serverBg, setServerBg] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(() => parseFloat(localStorage.getItem('overlayOpacity')) ?? 0.5);

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
  const bgInputRef = useRef(null);
  const importInputRef = useRef(null);

  // Init Data
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode);
    fetchData();
  }, [darkMode]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      setShortcuts(data.shortcuts || []);
      setLabelColors(data.labelColors || {});
      
      const serverDefault = data.appConfig?.default_background || null;
      setServerBg(serverDefault);

      const localBg = localStorage.getItem('custom_bg');
      if (localBg) { setBgImage(localBg); } 
      else if (serverDefault) { setBgImage(serverDefault); }
      else { setBgImage(null); }

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleBgUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
          const base64 = ev.target.result;
          setBgImage(base64);
          if (isAdmin) {
              if(confirm("Bạn đang là Admin. Đặt hình này làm mặc định cho toàn hệ thống?")) {
                  try { await fetch('/api/config/background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ background_url: base64 }) }); alert("Đã lưu Server!"); } catch(err) {}
              } else { localStorage.setItem('custom_bg', base64); }
          } else { localStorage.setItem('custom_bg', base64); }
      };
      reader.readAsDataURL(file);
  };

  const handleResetBg = () => { localStorage.removeItem('custom_bg'); setBgImage(serverBg); alert("Đã đặt lại hình nền."); };
  const resetForm = () => setFormData({ id: null, name: '', url: '', icon_url: '', parent_label: '', parent_color: COLOR_PRESETS[0], child_label: '', child_color: COLOR_PRESETS[1] });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return alert('Thiếu tên/URL');
    try {
      const res = await fetch(formData.id ? `/api/shortcuts/${formData.id}` : '/api/shortcuts', { method: formData.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if(res.ok) { await fetchData(); setShowAddModal(false); resetForm(); }
    } catch(e) { alert('Lỗi'); }
  };
  const handleDelete = async (id) => { if(confirm('Xóa?')) { await fetch(`/api/shortcuts/${id}`, {method:'DELETE'}); fetchData(); }};
  const handleToggleFavorite = async (id,e) => { e.stopPropagation(); await fetch(`/api/favorite/${id}`, {method:'POST'}); fetchData(); };
  const handleLinkClick = (id, url) => { fetch(`/api/click/${id}`, {method:'POST'}); window.open(url, '_blank'); };
  const handleEdit = (item, e) => { e.stopPropagation(); setFormData({...item, icon_url: item.icon_url || ''}); setShowAddModal(true); };
  const handleLogin = (e) => { e.preventDefault(); if(loginCreds.username==='admin' && loginCreds.password==='miniappadmin'){ setIsAdmin(true); setShowLoginModal(false); } else setLoginError('Sai thông tin'); };
  const handleImageUpload = (e) => { const f=e.target.files[0]; if(f) { const r=new FileReader(); r.onload=(ev)=>setFormData(p=>({...p, icon_url:ev.target.result})); r.readAsDataURL(f); } };
  
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ version: 1, timestamp: new Date().toISOString(), shortcuts: shortcuts.map(({id,...r})=>r), labels: Object.entries(labelColors).map(([n,c])=>({name:n, color_class:c})) }));
    const a = document.createElement('a'); a.href = dataStr; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove();
  };
  const handleImportData = (e) => { const f=e.target.files[0]; if(f) { const r=new FileReader(); r.onload=async(ev)=>{ try { await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(ev.target.result)) }); alert("Import OK!"); fetchData(); } catch(x) { alert("Lỗi import"); } e.target.value=null; }; r.readAsText(f); }};

  const uniqueParents = useMemo(() => [...new Set(shortcuts.map(s => s.parent_label).filter(Boolean))].sort(), [shortcuts]);
  const uniqueChildren = useMemo(() => [...new Set(shortcuts.map(s => s.child_label).filter(Boolean))].sort(), [shortcuts]);
  const filteredShortcuts = useMemo(() => {
    let res = shortcuts.filter(i => (!searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase())) && (!activeParentFilter || i.parent_label === activeParentFilter) && (!activeChildFilter || i.child_label === activeChildFilter));
    res.sort((a,b) => (b.favorite - a.favorite) || (sortBy==='alpha'?a.name.localeCompare(b.name) : 0));
    return res;
  }, [shortcuts, searchTerm, activeParentFilter, activeChildFilter, sortBy]);

  const bgClass = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#F4F4F4] text-[#2C2C2C]';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-[#D8D8D8] hover:border-[#009FB8]';
  const inputClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-[#D8D8D8] text-[#2C2C2C]';
  const modalClass = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-[#D8D8D8] text-[#2C2C2C]';

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bgClass}`}><Activity className="w-8 h-8 animate-spin"/></div>;

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 bg-cover bg-center bg-no-repeat bg-fixed ${bgClass}`} style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}>
      <div className={`min-h-screen w-full transition-colors duration-300`} style={{ backgroundColor: bgImage ? (darkMode ? `rgba(0,0,0,${overlayOpacity})` : `rgba(255,255,255,${overlayOpacity})`) : '' }}>
          
          {/* HEADER */}
          <div className="sticky top-0 z-30 w-full flex flex-col pt-4 px-4 gap-2 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                 <div className="relative group w-full max-w-sm transition-all">
                    <Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 text-gray-400" />
                    <input type="text" className={`block w-full pl-10 pr-3 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8] ${inputClass} ${bgImage ? 'bg-opacity-80 backdrop-blur-md' : ''}`} placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-full shadow-sm border ${inputClass} ${bgImage ? 'bg-opacity-80' : ''}`}><Filter size={18} /></button>
                 <div className="hidden sm:flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm">
                    <button onClick={() => setSortBy('default')} className={`p-1.5 rounded-full text-xs ${sortBy === 'default' ? 'bg-white dark:bg-gray-700 shadow' : 'opacity-50'}`}><List size={14}/></button>
                    <button onClick={() => setSortBy('alpha')} className={`p-1.5 rounded-full text-xs ${sortBy === 'alpha' ? 'bg-white dark:bg-gray-700 shadow' : 'opacity-50'}`}>Aa</button>
                 </div>
              </div>

              {/* RIGHT: Hidden Control Panel (Hover to reveal) */}
              <div className="flex items-center justify-end">
                 <div className="group/menu flex items-center gap-2 p-2 rounded-full hover:bg-white/20 hover:backdrop-blur-md transition-all">
                     
                     {/* The Hidden Controls */}
                     <div className="opacity-0 group-hover/menu:opacity-100 flex items-center gap-2 transition-opacity duration-300">
                        {/* Opacity Slider */}
                        {bgImage && (
                            <div className="flex items-center gap-1 mr-2 bg-black/20 rounded-full px-2 py-1 backdrop-blur-sm">
                                <span className="text-[10px] text-white/90 font-bold">BG</span>
                                <input type="range" min="0" max="0.9" step="0.1" value={overlayOpacity} onChange={(e) => { const val = parseFloat(e.target.value); setOverlayOpacity(val); localStorage.setItem('overlayOpacity', val); }} className="w-16 h-1 accent-[#009FB8] cursor-pointer" />
                            </div>
                        )}

                        <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full border shadow-sm ${inputClass} ${bgImage ? 'bg-opacity-80' : ''}`}>
                            {darkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-gray-600"/>}
                        </button>

                        {isAdmin ? (
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full border shadow-lg ${modalClass} bg-opacity-90 backdrop-blur`}>
                               <button onClick={() => { resetForm(); setShowAddModal(true); }} className="p-1.5 bg-[#0F2F55] text-white rounded-full hover:scale-110"><Plus size={16}/></button>
                               <button onClick={handleExportData} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-blue-500" title="Xuất"><Download size={16}/></button>
                               <button onClick={() => importInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-green-500" title="Nhập"><FileUp size={16}/></button>
                               <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                               <button onClick={() => bgInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-purple-500" title="Đổi BG"><ImageIcon size={16}/></button>
                               <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                               <div className="w-px h-4 bg-gray-300 mx-1"></div>
                               <button onClick={() => setIsAdmin(false)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500"><LogOut size={16}/></button>
                            </div>
                         ) : (
                            <div className={`flex items-center gap-1 p-1 rounded-full border shadow-lg ${inputClass} bg-opacity-80 backdrop-blur`}>
                                <button onClick={() => bgInputRef.current?.click()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><ImageIcon size={16}/></button>
                                <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                                {localStorage.getItem('custom_bg') && <button onClick={handleResetBg} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"><RotateCcw size={16}/></button>}
                                <button onClick={() => setShowLoginModal(true)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><Settings size={18} /></button>
                            </div>
                         )}
                     </div>
                     {/* Subtle Trigger Icon (visible when idle) */}
                     <div className="w-8 h-8 flex items-center justify-center group-hover/menu:hidden text-gray-400/50">
                        <Settings size={20} className="animate-pulse" />
                     </div>
                 </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
                <div className={`pointer-events-auto w-full max-w-5xl mx-auto rounded-2xl p-3 shadow-lg flex flex-col gap-2 border ${modalClass} bg-opacity-95 backdrop-blur-md`}>
                   <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-bold uppercase opacity-60">Nhóm:</span>
                      <button onClick={() => setActiveParentFilter(null)} className={`px-3 py-1 text-xs rounded-full border ${!activeParentFilter ? 'bg-[#0A1A2F] text-white' : ''}`}>All</button>
                      {uniqueParents.map(l => <button key={l} onClick={() => setActiveParentFilter(l)} className={`px-3 py-1 text-xs rounded-full border ${activeParentFilter === l ? 'ring-2 ring-[#009FB8]' : ''}`} style={{ background: labelColors[l] }}>{l}</button>)}
                   </div>
                   {uniqueChildren.length > 0 && <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/20"><span className="text-xs font-bold opacity-60">Tag:</span>
                      {uniqueChildren.map(l => <button key={l} onClick={() => setActiveChildFilter(activeChildFilter === l ? null : l)} className={`px-2 py-0.5 text-[10px] rounded border ${activeChildFilter===l?'bg-[#009FB8] text-white':''}`}>{l}</button>)}
                   </div>}
                </div>
            )}
          </div>

          {/* GRID CONTENT */}
          <div className="max-w-7xl mx-auto px-6 pb-20 pt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-10 justify-items-center">
                {filteredShortcuts.map((item) => (
                  <div key={item.id} className="group relative flex flex-col items-center w-28 cursor-pointer active:scale-95 transition-transform" onClick={() => handleLinkClick(item.id, item.url)}>
                    
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                       <button onClick={(e) => { e.stopPropagation(); setCopiedId(item.id); navigator.clipboard.writeText(item.url); setTimeout(()=>setCopiedId(null),1000); }} className={`p-1.5 rounded-full shadow-sm border ${cardClass} bg-opacity-90`}>
                            {copiedId === item.id ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
                       </button>
                       {isAdmin && <><button onClick={e => handleEdit(item, e)} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Pencil size={12}/></button><button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Trash2 size={12}/></button></>}
                    </div>

                    <button onClick={(e) => handleToggleFavorite(item.id, e)} className={`absolute -top-1 -left-1 z-10 p-1 rounded-full transition-transform hover:scale-110 ${item.favorite ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}>
                        <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
                    </button>

                    <div className={`w-20 h-20 rounded-[1.4rem] bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold shadow-md hover:shadow-lg transition-all mb-2 overflow-hidden relative backdrop-blur-sm bg-opacity-90`} 
                         style={getGradientStyle(labelColors[item.parent_label] || '#0A1A2F')}>
                      {item.icon_url ? <img src={item.icon_url} className="w-full h-full object-cover" /> : <span>{item.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    
                    <span className={`text-sm font-medium text-center truncate w-32 px-1 leading-tight ${darkMode ? 'text-gray-200' : 'text-[#2C2C2C] font-semibold'}`} style={{textShadow: bgImage ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'}}>{item.name}</span>
                    
                    <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                        {item.parent_label && <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white truncate max-w-[70px] shadow-sm" style={{ background: labelColors[item.parent_label] || '#9CA3AF' }}>{item.parent_label}</span>}
                        {item.child_label && <span className={`text-[9px] px-1.5 py-0.5 rounded-full border truncate max-w-[70px] bg-white/50 backdrop-blur-sm ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} style={{ borderColor: labelColors[item.child_label] }}>{item.child_label}</span>}
                    </div>
                  </div>
                ))}
                
                {isAdmin && (
                  <div className="flex flex-col items-center w-28 cursor-pointer group" onClick={() => { resetForm(); setShowAddModal(true); }}>
                      <div className={`w-20 h-20 rounded-[1.4rem] border-2 border-dashed flex items-center justify-center transition-all mb-3 ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-white/50 hover:border-[#009FB8]'}`}>
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
                    
                    <div onClick={() => fileInputRef.current?.click()} className={`w-full px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 border ${inputClass} hover:opacity-80`}>
                        {formData.icon_url ? <img src={formData.icon_url} className="w-10 h-10 rounded border object-cover"/> : <div className="w-10 h-10 rounded bg-gray-500/20 flex items-center justify-center"><Upload size={20}/></div>}
                        <div><p className="text-sm font-medium">Tải icon lên</p></div>
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
    </div>
  );
}
