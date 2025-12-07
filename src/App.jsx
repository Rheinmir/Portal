import React,{useState,useEffect,useRef,useMemo}from'react';import{Save,Trash2,Plus,Search,Activity,Copy,Check,Settings,LogOut,X,Filter,Tag,Upload,Download,FileUp,Pencil,Star,Moon,Sun,LayoutGrid,List,Image as ImageIcon,RotateCcw,BarChart as ChartIcon,Palette,Type,RefreshCw}from'lucide-react';
const COLOR_PRESETS=['#0A1A2F','#009FB8','#6D28D9','#BE123C','#059669','#C2410C','#475569'];const DEFAULT_LIGHT_TEXT='#2C2C2C',DEFAULT_DARK_TEXT='#E2E8F0';
const getGradientStyle=h=>h?{background:`linear-gradient(135deg,${h},${h}dd)`}:{};
const getContrastYIQ=(hex)=>{if(!hex)return'#fff';const h=hex.replace('#','');const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return(((r*299)+(g*587)+(b*114))/1000)>=128?'#000':'#fff'};
const normalizeTenant=t=>(t&&typeof t==='string'?t.trim():'')||'default';

// PAGINATION CONFIG
const ITEMS_PER_PAGE = 48;

export default function App(){
  const[shortcuts,setShortcuts]=useState([]),[labelColors,setLabelColors]=useState({}),[loading,setLoading]=useState(true),[darkMode,setDarkMode]=useState(()=>localStorage.getItem('darkMode')==='true'),[bgImage,setBgImage]=useState(null),[serverBg,setServerBg]=useState(null),[overlayOpacity,setOverlayOpacity]=useState(()=>{const r=localStorage.getItem('overlayOpacity');const n=parseFloat(r);return isNaN(n)?0.5:n});
  const[lightTextColor,setLightTextColor]=useState(()=>localStorage.getItem('custom_text_light')||DEFAULT_LIGHT_TEXT),[darkTextColor,setDarkTextColor]=useState(()=>localStorage.getItem('custom_text_dark')||DEFAULT_DARK_TEXT);
  const[formData,setFormData]=useState({id:null,name:'',url:'',icon_url:'',parent_label:'',parent_color:COLOR_PRESETS[0],child_label:'',child_color:COLOR_PRESETS[1],isLocal:false}),[searchTerm,setSearchTerm]=useState(''),[showFilterPanel,setShowFilterPanel]=useState(false),[activeParentFilter,setActiveParentFilter]=useState(null),[activeChildFilter,setActiveChildFilter]=useState(null),[copiedId,setCopiedId]=useState(null),[isAdmin,setIsAdmin]=useState(false),[showLoginModal,setShowLoginModal]=useState(false),[showAddModal,setShowAddModal]=useState(false),[showInsightsModal,setShowInsightsModal]=useState(false),[insightsData,setInsightsData]=useState(null),[loginCreds,setLoginCreds]=useState({username:'',password:''}),[loginError,setLoginError]=useState(''),[sortBy,setSortBy]=useState('default'),[tenant,setTenant]=useState(()=>normalizeTenant(localStorage.getItem('tenant')));
  
  // PAGINATION STATE
  const [currentPage,setCurrentPage]=useState(0),[touchStartX,setTouchStartX]=useState(null);

  const fileInputRef=useRef(null),bgInputRef=useRef(null),importInputRef=useRef(null);

  useEffect(()=>{if(darkMode)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');localStorage.setItem('darkMode',darkMode)},[darkMode]);

  const fetchData=async()=>{try{const r=await fetch('/api/data?tenant='+encodeURIComponent(tenant));const d=await r.json();const ss=d.shortcuts||[];const ls=JSON.parse(localStorage.getItem('local_shortcuts')||'[]').map(s=>({...s,isLocal:true,child_label:(s.child_label||'').includes('Personal')?s.child_label:(s.child_label?(s.child_label+', Personal'):'Personal')}));setShortcuts([...ss,...ls]);setLabelColors(d.labelColors||{});
      const c=d.appConfig||{};
      const serverVer=Number(c.config_version||0);
      const localVer=Number(localStorage.getItem('config_version')||0);
      
      if(serverVer > localVer) {
         localStorage.removeItem('custom_bg');localStorage.removeItem('custom_text_light');localStorage.removeItem('custom_text_dark');localStorage.removeItem('overlayOpacity');localStorage.removeItem('darkMode');localStorage.setItem('config_version', serverVer);
         setServerBg(c.default_background||null);setBgImage(c.default_background||null);setLightTextColor(c.text_color_light||DEFAULT_LIGHT_TEXT);setDarkTextColor(c.text_color_dark||DEFAULT_DARK_TEXT);
         const srvOpacity = c.overlay_opacity != null ? Number(c.overlay_opacity) : 0.5; setOverlayOpacity(isNaN(srvOpacity) ? 0.5 : srvOpacity);
         const srvDark = c.dark_mode_default === '1' || c.dark_mode_default === 'true'; setDarkMode(srvDark);
      } else {
         setServerBg(c.default_background||null);setBgImage(localStorage.getItem('custom_bg')||c.default_background||null);setLightTextColor(localStorage.getItem('custom_text_light')||c.text_color_light||DEFAULT_LIGHT_TEXT);setDarkTextColor(localStorage.getItem('custom_text_dark')||c.text_color_dark||DEFAULT_DARK_TEXT);
         const localOpStr = localStorage.getItem('overlayOpacity');const op = localOpStr != null ? Number(localOpStr) : (c.overlay_opacity != null ? Number(c.overlay_opacity) : 0.5);setOverlayOpacity(isNaN(op) ? 0.5 : op);
         const localDarkStr = localStorage.getItem('darkMode');if (localDarkStr != null) setDarkMode(localDarkStr === 'true');else {const srvDark = c.dark_mode_default === '1' || c.dark_mode_default === 'true';setDarkMode(srvDark);}
      }
    }catch(e){console.error(e)}finally{setLoading(false)}};

  useEffect(()=>{fetchData()},[tenant]);
  useEffect(()=>{setCurrentPage(0)},[searchTerm,activeParentFilter,activeChildFilter,sortBy,tenant]);

  const saveConfig=async(k,v)=>{try{await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({[k]:v})})}catch{}};
  const handleTextColorChange=(m,c)=>{if(m==='light'){setLightTextColor(c);localStorage.setItem('custom_text_light',c);if(isAdmin)saveConfig('text_color_light',c)}else{setDarkTextColor(c);localStorage.setItem('custom_text_dark',c);if(isAdmin)saveConfig('text_color_dark',c)}};
  const handleBgUpload=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const b=ev.target.result;setBgImage(b);if(isAdmin){if(confirm("Lưu mặc định server?")){saveConfig('default_background',b);alert("Đã lưu server!")}else localStorage.setItem('custom_bg',b)}else localStorage.setItem('custom_bg',b)};r.readAsDataURL(f)};
  const fetchInsights=async()=>{try{const r=await fetch('/api/insights');setInsightsData(await r.json());setShowInsightsModal(true)}catch{alert("Lỗi insights")}};
  const handleExportStats=()=>{window.open('/api/insights/export','_blank')};
  const handleResetBg=()=>{localStorage.removeItem('custom_bg');setBgImage(serverBg);alert("Đã reset BG")};
  const resetForm=()=>setFormData({id:null,name:'',url:'',icon_url:'',parent_label:'',parent_color:COLOR_PRESETS[0],child_label:'',child_color:COLOR_PRESETS[1],isLocal:false});
  
  const handleSubmit=async e=>{e.preventDefault();if(!formData.name.trim()||!formData.url.trim())return alert('Thiếu tên/URL');let iconToSave = formData.icon_url;if (!iconToSave) {try { const urlObj = new URL(formData.url); iconToSave = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`; } catch(e) {}}const payload = { ...formData, icon_url: iconToSave };const isLocal=!isAdmin||formData.isLocal;if(isLocal){const l=JSON.parse(localStorage.getItem('local_shortcuts')||'[]');let nl;if(formData.id&&formData.isLocal)nl=l.map(s=>s.id===formData.id?{...payload,id:formData.id}:s);else nl=[{...payload,id:Date.now(),clicks:0,favorite:0},...l];localStorage.setItem('local_shortcuts',JSON.stringify(nl));fetchData();setShowAddModal(false);resetForm()}else{try{const r=await fetch(formData.id?`/api/shortcuts/${formData.id}`:'/api/shortcuts',{method:formData.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(r.ok){await fetchData();setShowAddModal(false);resetForm()}}catch{alert('Lỗi Server')}}};
  const handleDelete=async id=>{if(!confirm('Xóa?'))return;const t=shortcuts.find(s=>s.id===id);if(t&&t.isLocal){const l=JSON.parse(localStorage.getItem('local_shortcuts')||'[]');localStorage.setItem('local_shortcuts',JSON.stringify(l.filter(s=>s.id!==id)));fetchData()}else if(isAdmin){await fetch(`/api/shortcuts/${id}`,{method:'DELETE'});fetchData()}};
  const handleToggleFavorite=async(id,e)=>{e.stopPropagation();const t=shortcuts.find(s=>s.id===id);if(t&&t.isLocal){const l=JSON.parse(localStorage.getItem('local_shortcuts')||'[]');localStorage.setItem('local_shortcuts',JSON.stringify(l.map(s=>s.id===id?{...s,favorite:s.favorite?0:1}:s)));fetchData()}else{await fetch(`/api/favorite/${id}`,{method:'POST'});fetchData()}};
  const handleLinkClick=(id,u)=>{const t=shortcuts.find(s=>s.id===id);if(!t?.isLocal)fetch(`/api/click/${id}`,{method:'POST'});window.open(u,'_blank')};
  const handleEdit=(i,e)=>{e.stopPropagation();setFormData({...i,icon_url:i.icon_url||''});setShowAddModal(true)};
  const handleLogin=e=>{e.preventDefault();if(loginCreds.username==='admin'&&loginCreds.password==='miniappadmin'){setIsAdmin(true);setShowLoginModal(false)}else setLoginError('Sai thông tin')};
  const handleImageUpload=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setFormData(p=>({...p,icon_url:ev.target.result}));r.readAsDataURL(f)}};
  const handleExportData=()=>{const d='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({version:2,timestamp:new Date().toISOString(),shortcuts:shortcuts.filter(s=>!s.isLocal),labels:labelColors}));const a=document.createElement('a');a.href=d;a.download='backup.json';document.body.appendChild(a);a.click();a.remove()};
  const handleImportData=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=async ev=>{await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(JSON.parse(ev.target.result))});alert("Import OK!");fetchData()};r.readAsText(f)}};
  
  const handleForceSync=async()=>{if(!isAdmin)return;if(confirm("Cập nhật cấu hình lên Server và ép Client tải lại?")){try{const p={text_color_light:lightTextColor,text_color_dark:darkTextColor,overlay_opacity:overlayOpacity,dark_mode_default:darkMode?'1':'0'};if(bgImage) p.default_background = bgImage;const r=await fetch('/api/config/force',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();if(d.success){if(d.version)localStorage.setItem('config_version',d.version);alert("Đã đồng bộ!");fetchData()}else alert("Lỗi: "+d.error)}catch{alert("Lỗi sync")}}};

  const uniqueParents=useMemo(()=>[...new Set(shortcuts.map(s=>s.parent_label).filter(Boolean))].sort(),[shortcuts]);
  const uniqueChildren=useMemo(()=>[...new Set(shortcuts.flatMap(s=>(s.child_label||'').split(',').map(t=>t.trim()).filter(Boolean)))].sort(),[shortcuts]);
  const filteredShortcuts=useMemo(()=>{let r=shortcuts.filter(i=>{const t=searchTerm.trim().toLowerCase(),m=(!t||i.name.toLowerCase().includes(t))&&(!activeParentFilter||i.parent_label===activeParentFilter);if(!m)return false;if(activeChildFilter){const tags=(i.child_label||'').split(',').map(s=>s.trim());if(!tags.includes(activeChildFilter))return false}return true});r.sort((a,b)=>(b.favorite-a.favorite)||(sortBy==='alpha'?a.name.localeCompare(b.name):0));return r},[shortcuts,searchTerm,activeParentFilter,activeChildFilter,sortBy]);

  // PAGINATION LOGIC
  const totalPages=Math.max(1,Math.ceil(filteredShortcuts.length/ITEMS_PER_PAGE));
  useEffect(()=>{if(currentPage>=totalPages)setCurrentPage(totalPages-1)},[totalPages,currentPage]);
  const pagedShortcuts=useMemo(()=>filteredShortcuts.slice(currentPage*ITEMS_PER_PAGE,(currentPage+1)*ITEMS_PER_PAGE),[filteredShortcuts,currentPage]);
  const goNext=()=>setCurrentPage(p=>Math.min(p+1,totalPages-1));
  const goPrev=()=>setCurrentPage(p=>Math.max(p-1,0));

  const bgClass=darkMode?'bg-gray-900':'bg-[#F4F4F4]',currentTextColor=darkMode?darkTextColor:lightTextColor;
  const cardClass=darkMode?'bg-gray-800 border-gray-700 hover:border-blue-500':'bg-white border-[#D8D8D8] hover:border-[#009FB8]';
  const inputClass=darkMode?'bg-gray-800 border-gray-700':'bg-white border-[#D8D8D8]',modalClass=darkMode?'bg-gray-900 border-gray-700':'bg-white border-[#D8D8D8]';
  const isLastPage=currentPage===totalPages-1;
  
  if(loading)return<div className={`min-h-screen flex items-center justify-center ${bgClass}`}><Activity className="w-8 h-8 animate-spin text-blue-500"/></div>;

  return (
    <div className={`min-h-screen font-light transition-all duration-300 bg-cover bg-center bg-no-repeat bg-fixed ${bgClass}`} style={{backgroundImage:bgImage?`url(${bgImage})`:'none',color:currentTextColor}}>
      <div className="min-h-screen w-full transition-colors duration-300" style={{backgroundColor:bgImage?(darkMode?`rgba(0,0,0,${overlayOpacity})`:`rgba(255,255,255,${overlayOpacity})`):''}}>
        <div className="sticky top-0 z-30 w-full flex flex-col pt-4 px-4 gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl mx-auto flex items-center justify-center gap-3">
            <div className="flex-1 flex items-center gap-2 min-w-0">
               <div className="relative group w-full max-w-lg mx-auto transition-all">
                  <Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 opacity-50" />
                  <input type="text" className={`block w-full pl-10 pr-3 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8] ${inputClass} ${bgImage?'bg-opacity-60 backdrop-blur-md':'bg-opacity-60'}`} style={{color:currentTextColor}} placeholder="Tìm kiếm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
               </div>
               <button onClick={()=>setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-full shadow-sm border ${inputClass} ${bgImage?'bg-opacity-80':''}`}><Filter size={18}/></button>
               <div className="hidden sm:flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm">
                  <button onClick={()=>setSortBy('default')} className={`p-1.5 rounded-full text-xs ${sortBy==='default'?'bg-white dark:bg-gray-700 shadow':'opacity-50'}`}><List size={14}/></button>
                  <button onClick={()=>setSortBy('alpha')} className={`p-1.5 rounded-full text-xs ${sortBy==='alpha'?'bg-white dark:bg-gray-700 shadow':'opacity-50'}`}>Aa</button>
               </div>
            </div>
          </div>
          {showFilterPanel&&(
            <div className={`pointer-events-auto w-full max-w-5xl mx-auto rounded-2xl p-3 shadow-lg flex flex-col gap-2 border ${modalClass} bg-opacity-95 backdrop-blur-md`}>
              <div className="flex flex-wrap gap-2"><span className="text-xs font-bold uppercase opacity-60">Nhóm:</span><button onClick={()=>setActiveParentFilter(null)} className={`px-3 py-1 text-xs rounded-full border ${!activeParentFilter?'bg-[#0A1A2F] text-white':''}`}>All</button>{uniqueParents.map(l=><button key={l} onClick={()=>setActiveParentFilter(l)} className={`px-3 py-1 text-xs rounded-full border ${activeParentFilter===l?'ring-2 ring-[#009FB8]':''}`} style={{background:labelColors[l],color:getContrastYIQ(labelColors[l])}}>{l}</button>)}</div>
              {uniqueChildren.length>0&&<div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/20"><span className="text-xs font-bold opacity-60">Tag:</span>{uniqueChildren.map(l=><button key={l} onClick={()=>setActiveChildFilter(activeChildFilter===l?null:l)} className={`px-2 py-0.5 text-[10px] rounded-full border ${activeChildFilter===l?'bg-[#009FB8] text-white':''}`} style={activeChildFilter===l&&labelColors[l]?{background:labelColors[l],borderColor:labelColors[l],color:getContrastYIQ(labelColors[l])}:{}}>{l}</button>)}</div>}
            </div>
          )}
        </div>

        {/* GRID WITH GESTURES */}
        <div 
           className="max-w-7xl mx-auto px-6 pb-20 pt-8 min-h-[60vh]"
           onWheel={e=>{const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)>40){if(d>0)goNext();else goPrev()}}}
           onTouchStart={e=>setTouchStartX(e.touches[0].clientX)}
           onTouchEnd={e=>{if(touchStartX===null)return;const d=e.changedTouches[0].clientX-touchStartX;if(Math.abs(d)>50){if(d<0)goNext();else goPrev()}setTouchStartX(null)}}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
            {pagedShortcuts.map(i=>(<div key={i.id} className="group relative flex flex-col items-center w-full max-w-[100px] cursor-pointer active:scale-95 transition-transform" onClick={()=>handleLinkClick(i.id,i.url)}>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90"><button onClick={e=>{e.stopPropagation();setCopiedId(i.id);navigator.clipboard.writeText(i.url);setTimeout(()=>setCopiedId(null),1000)}} className={`p-1.5 rounded-full shadow-sm border ${cardClass} bg-opacity-90`}>{copiedId===i.id?<Check size={12} className="text-green-500"/>:<Copy size={12}/>}</button>{(isAdmin||i.isLocal)&&(<><button onClick={e=>handleEdit(i,e)} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Pencil size={12}/></button><button onClick={e=>{e.stopPropagation();handleDelete(i.id)}} className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}><Trash2 size={12}/></button></>)}</div>
              <button onClick={e=>handleToggleFavorite(i.id,e)} className={`absolute -top-1 -left-1 z-10 p-1 rounded-full transition-transform hover:scale-110 ${i.favorite?'text-yellow-400':'text-gray-300 opacity-0 group-hover:opacity-100'}`}><Star size={14} fill={i.favorite?"currentColor":"none"}/></button>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md hover:shadow-lg transition-all mb-2 overflow-hidden relative backdrop-blur-sm ${i.icon_url?'bg-transparent':'bg-gradient-to-br bg-opacity-90'}`} style={i.icon_url?{}:getGradientStyle(labelColors[i.parent_label]||'#0A1A2F')}>{i.icon_url?<img src={i.icon_url} className="w-full h-full object-contain"/>:<span>{i.name.charAt(0).toUpperCase()}</span>}</div>
              <span className="text-xs text-center truncate w-full px-1 leading-tight font-light" style={{textShadow:bgImage?'0 1px 2px rgba(0,0,0,0.5)':'none'}}>{i.name}</span>
              <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                {i.parent_label&&<span className="text-[8px] px-1 py-0.5 rounded-full text-white truncate max-w-[60px] shadow-sm mb-0.5" style={{background:labelColors[i.parent_label]||'#9CA3AF',color:getContrastYIQ(labelColors[i.parent_label]||'#9CA3AF')}}>{i.parent_label}</span>}
                {(i.child_label||'').split(',').filter(Boolean).map(t=><span key={t} className={`text-[8px] px-1 py-0.5 rounded-full border truncate max-w-[60px] bg-white/50 backdrop-blur-sm ${darkMode?'border-gray-600':'border-gray-300'}`} style={{borderColor:labelColors[t?.trim()],color:labelColors[t?.trim()]||(darkMode?'#ddd':'#333')}}>{t.trim()}</span>)}
              </div>
            </div>))}
            {isLastPage && (
              <div className="flex flex-col items-center w-full max-w-[100px] cursor-pointer group" onClick={()=>{resetForm();setShowAddModal(true)}}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-2 backdrop-blur-sm bg-white/10 dark:bg-black/10 hover:bg-emerald-500/10`}><Plus size={24} className="opacity-50 font-light"/></div>
                <span className="text-xs font-light opacity-50">Thêm App</span>
              </div>
            )}
          </div>
          {totalPages>1&&(
             <div className="flex justify-center mt-8 gap-2">
               {Array.from({length:totalPages}).map((_,i)=><button key={i} onClick={()=>setCurrentPage(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i===currentPage?(darkMode?'w-6 bg-white':'w-6 bg-gray-800'):(darkMode?'w-2 bg-white/20':'w-2 bg-gray-400/40')}`}/>)}
             </div>
          )}
        </div>

        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="group/menu flex items-center justify-end gap-2 p-2 rounded-full hover:bg-white/20 hover:backdrop-blur-md transition-all">
            <div className="flex items-center gap-2">{bgImage&&<div className="flex items-center gap-1 mr-2 bg-black/40 rounded-full px-2 py-1 backdrop-blur-sm"><span className="text-[10px] text-white/90 font-bold">BG</span><input type="range" min="0" max="0.9" step="0.1" value={overlayOpacity} onChange={e=>{const v=parseFloat(e.target.value);setOverlayOpacity(v);localStorage.setItem('overlayOpacity',v);if(isAdmin)saveConfig('overlay_opacity',v)}} className="w-16 h-1 accent-[#009FB8] cursor-pointer"/></div>}
            <button onClick={()=>setDarkMode(!darkMode)} className={`p-2 rounded-full border shadow-sm ${inputClass} ${bgImage?'bg-opacity-80':''}`}>{darkMode?<Sun size={18} className="text-yellow-400"/>:<Moon size={18} className="text-gray-600"/>}</button>
            <div className={`flex items-center gap-1 p-1 rounded-full border shadow-lg ${inputClass} bg-opacity-80 backdrop-blur`}>
              <div className="flex flex-col gap-0.5 mr-1 border-r border-gray-400/30 pr-1"><div className="flex items-center gap-1" title="Text Light"><Type size={10} className="text-orange-400"/><input type="color" value={lightTextColor} onChange={e=>handleTextColorChange('light',e.target.value)} className="w-4 h-4 p-0 border-none bg-transparent cursor-pointer"/></div><div className="flex items-center gap-1" title="Text Dark"><Type size={10} className="text-blue-300"/><input type="color" value={darkTextColor} onChange={e=>handleTextColorChange('dark',e.target.value)} className="w-4 h-4 p-0 border-none bg-transparent cursor-pointer"/></div></div>
              <button onClick={()=>bgInputRef.current?.click()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><ImageIcon size={16}/></button><input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload}/>
              {isAdmin&&(<>
                <button onClick={fetchInsights} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"><ChartIcon size={16}/></button>
                <button onClick={handleForceSync} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-purple-500" title="Đồng bộ Client"><RefreshCw size={16}/></button>
                <button onClick={handleExportData} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-blue-500"><Download size={16}/></button>
                <button onClick={()=>importInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-green-500"><FileUp size={16}/></button>
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData}/>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button onClick={()=>setIsAdmin(false)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500"><LogOut size={16}/></button>
              </>)}
              {!isAdmin&&(<>
                {localStorage.getItem('custom_bg')&&<button onClick={handleResetBg} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"><RotateCcw size={16}/></button>}
                <button onClick={()=>setShowLoginModal(true)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><Settings size={18}/></button>
              </>)}
            </div></div>
          </div>
        </div>

        {showInsightsModal&&insightsData&&(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 ${modalClass}`}>
              <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-4"><h3 className="font-bold text-xl flex items-center gap-2"><ChartIcon className="text-orange-500"/> Phân tích</h3><button onClick={handleExportStats} className="text-xs flex items-center gap-1 text-blue-500 hover:underline bg-blue-500/10 px-2 py-1 rounded"><Download size={12}/> Xuất CSV đầy đủ</button></div><button onClick={()=>setShowInsightsModal(false)}><X size={24}/></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"><p className="text-sm opacity-70">Tổng Click</p><p className="text-3xl font-bold text-blue-500">{insightsData.totalClicks}</p></div><div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"><p className="text-sm opacity-70">Top 1 App</p><p className="text-xl font-bold text-purple-500 truncate">{insightsData.topApps[0]?.name||'N/A'}</p></div></div>
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-gray-500/20"><h4 className="text-sm font-bold mb-4 opacity-80">Top 10 Ứng Dụng</h4>
                  <div className="flex flex-col gap-2">{insightsData.topApps.map((a,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 truncate text-xs opacity-80">{a.name}</div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${(a.count/Math.max(...insightsData.topApps.map(x=>x.count),1))*100}%`,background:'#009FB8'}}/>
                      </div>
                      <div className="text-xs font-bold w-8 text-right">{a.count}</div>
                    </div>
                  ))}</div>
                </div>
                <div className="p-4 rounded-xl border border-gray-500/20"><h4 className="text-sm font-bold mb-4 opacity-80">Hoạt động (7 ngày qua)</h4>
                   <div className="flex items-end gap-1 h-32">{insightsData.timeline.map((d,i)=>(<div key={i} className="flex-1 flex flex-col items-center gap-1 group"><div className="w-full bg-emerald-400/60 rounded-t hover:bg-emerald-500 transition-all" style={{height:`${Math.max((d.count/Math.max(...insightsData.timeline.map(x=>x.count),1))*100, 5)}%`}} title={`${d.d}: ${d.count} clicks`}></div><div className="text-[9px] opacity-60 -rotate-45 mt-2">{d.d.slice(5)}</div></div>))}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLoginModal&&(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`rounded-2xl shadow-2xl w-full max-w-xs p-6 border ${modalClass}`}><div className="flex justify-between items-center mb-6"><h3 className="font-bold">Admin</h3><button onClick={()=>setShowLoginModal(false)}><X size={20}/></button></div><form onSubmit={handleLogin} className="space-y-4"><input type="text" placeholder="User" className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`} value={loginCreds.username} onChange={e=>setLoginCreds({...loginCreds,username:e.target.value})}/><input type="password" placeholder="Pass" className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`} value={loginCreds.password} onChange={e=>setLoginCreds({...loginCreds,password:e.target.value})}/>{loginError&&<p className="text-red-500 text-xs">{loginError}</p>}<button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg hover:bg-opacity-90">Login</button></form></div></div>
        )}
        {showAddModal&&(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border ${modalClass}`}><div className="flex justify-between items-center mb-4"><h3 className="font-bold">{formData.id?'Sửa':'Thêm'} App</h3><button onClick={()=>setShowAddModal(false)}><X size={20}/></button></div><form onSubmit={handleSubmit} className="space-y-3"><input type="text" placeholder="Tên" className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`} value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required/><input type="url" placeholder="URL" className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`} value={formData.url} onChange={e=>setFormData({...formData,url:e.target.value})} required/>
          <div onClick={() => fileInputRef.current?.click()} className={`w-full px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 border ${inputClass} hover:opacity-80`}>{formData.icon_url?<img src={formData.icon_url} className="w-10 h-10 rounded border object-cover"/>:<div className="w-10 h-10 rounded bg-gray-500/20 flex items-center justify-center"><Upload size={20}/></div>}<div><p className="text-sm font-medium">Tải icon lên</p></div></div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload}/>
          <input type="text" placeholder="Hoặc dán link ảnh (https://...)" className={`w-full px-4 py-2 rounded-xl text-sm border ${inputClass}`} value={formData.icon_url?.startsWith('data:')?'':formData.icon_url} onChange={e=>setFormData({...formData,icon_url:e.target.value})}/>
          <div className={`border-t pt-3 space-y-4 ${darkMode?'border-gray-700':'border-gray-200'}`}><div className="grid grid-cols-[1fr_auto] gap-2 items-center"><input type="text" placeholder="Nhóm lớn" className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`} value={formData.parent_label} onChange={e=>setFormData({...formData,parent_label:e.target.value})}/><div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer"><input type="color" className="absolute -top-2 -left-2 w-12 h-12" value={formData.parent_color} onChange={e=>setFormData({...formData,parent_color:e.target.value})}/></div></div><div className="grid grid-cols-[1fr_auto] gap-2 items-center"><input type="text" placeholder="Nhóm con (cách nhau phẩy)" className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`} value={formData.child_label} onChange={e=>setFormData({...formData,child_label:e.target.value})}/><div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer"><input type="color" className="absolute -top-2 -left-2 w-12 h-12" value={formData.child_color} onChange={e=>setFormData({...formData,child_color:e.target.value})}/></div></div></div><button className="w-full py-3 bg-[#0F2F55] text-white rounded-xl mt-2 hover:bg-opacity-90">Lưu</button></form></div></div>
        )}
      </div>
    </div>
  );
}
