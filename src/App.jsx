import React,{useState,useEffect,useRef,useMemo}from'react';import { Trash2, Plus, Grip, Search, Moon, Sun, Settings, Key, BarChart as ChartIcon, Image as ImageIcon, X, Palette, Type, Link, Upload, RefreshCw, Filter, Tag, Download, FileUp, Pencil, Star, LayoutGrid, List, RotateCcw, LogOut } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
const ShortcutCard = React.lazy(() => import('./components/ShortcutCard'));
const InsightsModal = React.lazy(() => import('./components/InsightsModal'));
const FilterPanel = React.lazy(() => import('./components/FilterPanel'));
const Clock = React.lazy(() => import('./components/Clock'));
const ConfirmDialog = React.lazy(() => import('./components/ConfirmDialog'));

// Lazy load named exports
const LoginModal = React.lazy(() => import('./components/AdminModals').then(module => ({ default: module.LoginModal })));
const AddEditModal = React.lazy(() => import('./components/AdminModals').then(module => ({ default: module.AddEditModal })));
const SettingsModal = React.lazy(() => import('./components/AdminModals').then(module => ({ default: module.SettingsModal })));

const COLOR_PRESETS=['#0A1A2F','#009FB8','#6D28D9','#BE123C','#059669','#C2410C','#475569'];const DEFAULT_LIGHT_TEXT='#2C2C2C',DEFAULT_DARK_TEXT='#E2E8F0';
const getContrastYIQ=(hex)=>{if(!hex)return'#fff';const h=hex.replace('#','');const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return(((r*299)+(g*587)+(b*114))/1000)>=128?'#000':'#fff'};
const normalizeTenant=t=>(t&&typeof t==='string'?t.trim():'')||'default';
const DEFAULT_ITEMS_PER_PAGE=48;const isVideoFile=s=>typeof s==='string'&&/\.(mp4|webm|ogg)(\?|$)/i.test(s);const isYoutubeEmbed=s=>typeof s==='string'&&s.includes('youtube.com/embed/');

function normalizeYoutube(url) {
  if (!url) return url;
  const watch = url.match(/v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

export default function App(){
  const { t, lang, setLang } = useLanguage();
  const[shortcuts,setShortcuts]=useState([]),[labelColors,setLabelColors]=useState({}),[loading,setLoading]=useState(true),[darkMode,setDarkMode]=useState(()=>localStorage.getItem('darkMode')==='true'),[bgImage,setBgImage]=useState(null),[serverBg,setServerBg]=useState(null),[bgVideo,setBgVideo]=useState(null),[bgEmbed,setBgEmbed]=useState(null),[overlayOpacity,setOverlayOpacity]=useState(()=>{const r=localStorage.getItem('overlayOpacity');const n=parseFloat(r);return isNaN(n)?0.5:n});
  const[lightTextColor,setLightTextColor]=useState(()=>localStorage.getItem('custom_text_light')||DEFAULT_LIGHT_TEXT),[darkTextColor,setDarkTextColor]=useState(()=>localStorage.getItem('custom_text_dark')||DEFAULT_DARK_TEXT);
  const[formData,setFormData]=useState({id:null,name:'',url:'',icon_url:'',parent_label:'',parent_color:COLOR_PRESETS[0],child_label:'',child_color:COLOR_PRESETS[1],isLocal:false}),[searchTerm,setSearchTerm]=useState(''),[debouncedSearchTerm,setDebouncedSearchTerm]=useState(''),[showFilterPanel,setShowFilterPanel]=useState(false),[activeParentFilter,setActiveParentFilter]=useState(null),[activeChildFilter,setActiveChildFilter]=useState(null),[isAdmin,setIsAdmin]=useState(false),[showLoginModal,setShowLoginModal]=useState(false),[showAddModal,setShowAddModal]=useState(false),[showInsightsModal,setShowInsightsModal]=useState(false),[showSettingsModal,setShowSettingsModal]=useState(false),[insightsData,setInsightsData]=useState(null),[loginCreds,setLoginCreds]=useState({username:'',password:''}),[loginError,setLoginError]=useState(''),[sortBy,setSortBy]=useState('default'),[tenant,setTenant]=useState(()=>normalizeTenant(localStorage.getItem('tenant'))),
  [bgUrlInput,setBgUrlInput]=useState(''),[isEditingPage,setIsEditingPage]=useState(false),[pageInput,setPageInput]=useState('');
  const [utcOffset, setUtcOffset] = useState(7);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });

  const [currentPage,setCurrentPage]=useState(0),[touchStartX,setTouchStartX]=useState(null),[itemsPerPage,setItemsPerPage]=useState(DEFAULT_ITEMS_PER_PAGE);
  const [clientOrder,setClientOrder]=useState(()=>{const r=localStorage.getItem('shortcut_order_'+tenant);return r?JSON.parse(r):[]}),[draggingId,setDraggingId]=useState(null);
  const fileInputRef=useRef(null),bgInputRef=useRef(null),importInputRef=useRef(null),gridWrapperRef=useRef(null),gridRef=useRef(null);

  useEffect(()=>{
    const html=document.documentElement; const body=document.body;
    const p1=html.style.overflow; const p2=body.style.overflow;
    html.style.overflow='hidden'; body.style.overflow='hidden';
    return()=>{html.style.overflow=p1;body.style.overflow=p2}
  },[]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColorPicker && !e.target.closest('.color-picker-popover') && !e.target.closest('.color-picker-trigger')) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  useEffect(()=>{if(darkMode)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');localStorage.setItem('darkMode',darkMode)},[darkMode]);
  useEffect(()=>{const r=localStorage.getItem('shortcut_order_'+tenant);setClientOrder(r?JSON.parse(r):[])},[tenant]);
  useEffect(()=>{setCurrentPage(0)},[debouncedSearchTerm,activeParentFilter,activeChildFilter,sortBy,tenant]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const applyBackgroundSource=(src,isFromServer=false)=>{
    if(isFromServer)setServerBg(src);
    if(!src){setBgImage(null);setBgVideo(null);setBgEmbed(null);return}
    if(isYoutubeEmbed(src)){setBgEmbed(src);setBgImage(null);setBgVideo(null)}else if(isVideoFile(src)){setBgVideo(src);setBgImage(null);setBgEmbed(null)}else{setBgImage(src);setBgVideo(null);setBgEmbed(null)}
  };
  const fetchData=async()=>{try{const r=await fetch('/api/data?tenant='+encodeURIComponent(tenant));const d=await r.json();const ss=d.shortcuts||[];const ls=JSON.parse(localStorage.getItem('local_shortcuts')||'[]').map(s=>({...s,isLocal:true,child_label:(s.child_label||'').includes('Personal')?s.child_label:(s.child_label?(s.child_label+', Personal'):'Personal')}));setShortcuts([...ss,...ls]);setLabelColors(d.labelColors||{});const c=d.appConfig||{};const serverVer=Number(c.config_version||0);const localVer=Number(localStorage.getItem('config_version')||0);
      
      const srvUtc = c.utc_offset != null ? Number(c.utc_offset) : 7;
      setUtcOffset(srvUtc);

      if(serverVer > localVer) {localStorage.removeItem('custom_bg');localStorage.removeItem('custom_text_light');localStorage.removeItem('custom_text_dark');localStorage.removeItem('overlayOpacity');localStorage.removeItem('darkMode');localStorage.setItem('config_version', serverVer);applyBackgroundSource(c.default_background||null,true);setLightTextColor(c.text_color_light||DEFAULT_LIGHT_TEXT);setDarkTextColor(c.text_color_dark||DEFAULT_DARK_TEXT);const srvOpacity = c.overlay_opacity != null ? Number(c.overlay_opacity) : 0.5; setOverlayOpacity(isNaN(srvOpacity) ? 0.5 : srvOpacity);const srvDark = c.dark_mode_default === '1' || c.dark_mode_default === 'true'; setDarkMode(srvDark);
      } else {setServerBg(c.default_background||null);const localBg = localStorage.getItem('custom_bg');const activeBg = localBg || c.default_background || null;applyBackgroundSource(activeBg, false);setLightTextColor(localStorage.getItem('custom_text_light')||c.text_color_light||DEFAULT_LIGHT_TEXT);setDarkTextColor(localStorage.getItem('custom_text_dark')||c.text_color_dark||DEFAULT_DARK_TEXT);const localOpStr = localStorage.getItem('overlayOpacity');const op = localOpStr != null ? Number(localOpStr) : (c.overlay_opacity != null ? Number(c.overlay_opacity) : 0.5);setOverlayOpacity(isNaN(op) ? 0.5 : op);const localDarkStr = localStorage.getItem('darkMode');if (localDarkStr != null) setDarkMode(localDarkStr === 'true');else {const srvDark = c.dark_mode_default === '1' || c.dark_mode_default === 'true';setDarkMode(srvDark);}}
    }catch(e){console.error(e)}finally{setLoading(false)}};
  useEffect(()=>{fetchData()},[tenant]);

  const saveConfig=async(k,v)=>{try{await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({[k]:v})})}catch{}};
  const handleTextColorChange=(m,c)=>{if(m==='light'){setLightTextColor(c);localStorage.setItem('custom_text_light',c);if(isAdmin)saveConfig('text_color_light',c)}else{setDarkTextColor(c);localStorage.setItem('custom_text_dark',c);if(isAdmin)saveConfig('text_color_dark',c)}};
  const handleBgUpload=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const b=ev.target.result;
    const isVideo = f.type.startsWith('video/');
    const proceed = () => {
       if(isVideo){setBgVideo(b);setBgImage(null);setBgEmbed(null);}else{setBgImage(b);setBgVideo(null);setBgEmbed(null);}
       if(isAdmin) { saveConfig('default_background',b); alert(t('saved_to_server')); } else { localStorage.setItem('custom_bg',b); }
       setConfirmState({isOpen:false});
    };
    
    if(isAdmin){
      setConfirmState({
        isOpen: true,
        message: t('confirm_save_server_bg'),
        onConfirm: proceed,
        onCancel: () => { if(isVideo){setBgVideo(b);setBgImage(null);setBgEmbed(null);}else{setBgImage(b);setBgVideo(null);setBgEmbed(null);} localStorage.setItem('custom_bg',b); setConfirmState({isOpen:false}); }
      });
    } else {
      if(isVideo){setBgVideo(b);setBgImage(null);setBgEmbed(null);}else{setBgImage(b);setBgVideo(null);setBgEmbed(null);}
      localStorage.setItem('custom_bg',b);
    }
  };r.readAsDataURL(f)};
  
  const applyBgUrl=()=>{
    const url = normalizeYoutube(bgUrlInput.trim());
    if(!url)return;
    
    const proceed = () => {
      applyBackgroundSource(url);
      if(isAdmin) { saveConfig('default_background',url); alert(t('saved_to_server')); } else { localStorage.setItem('custom_bg',url); }
      setConfirmState({isOpen:false});
    };

    if(isAdmin){
       setConfirmState({
        isOpen: true,
        message: t('confirm_save_server_bg'),
        onConfirm: proceed,
        onCancel: () => { applyBackgroundSource(url); localStorage.setItem('custom_bg',url); setConfirmState({isOpen:false}); }
       });
    } else {
       applyBackgroundSource(url);
       localStorage.setItem('custom_bg',url);
    }
  };
  
  const handleResetBg=()=>{localStorage.removeItem('custom_bg');applyBackgroundSource(serverBg);alert(t('bg_reset'))};
  
  const handleClearMedia=async()=>{
    setConfirmState({
      isOpen: true,
      message: t('confirm_clear_media'),
      onConfirm: async () => {
        localStorage.removeItem('custom_bg');setBgImage(null);setBgVideo(null);setBgEmbed(null);
        if(isAdmin){try{await saveConfig('default_background','');alert(t('server_and_local_bg_cleared'))}catch{alert(t('error_clearing_server_bg'))}}else{alert(t('local_bg_cleared'))}
        setConfirmState({isOpen:false});
      }
    });
  };

  const handleForceSync=async()=>{
    if(!isAdmin)return;
    setConfirmState({
      isOpen: true,
      message: t('confirm_force_sync'),
      onConfirm: async () => {
        try{
          const p={
            text_color_light:lightTextColor,
            text_color_dark:darkTextColor,
            overlay_opacity:overlayOpacity,
            dark_mode_default:darkMode?'1':'0',
            utc_offset:utcOffset
          };
          const currentBg = bgEmbed || bgVideo || bgImage;
          if(currentBg) p.default_background = currentBg;
          
          const r=await fetch('/api/config/force',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
          const d=await r.json();
          if(d.success){
            if(d.version)localStorage.setItem('config_version',d.version);
            let serverList=shortcuts.filter(s=>!s.isLocal);
            if(clientOrder.length){
              const idxMap=new Map(clientOrder.map((id,i)=>[id,i]));
              serverList=[...serverList].sort((a,b)=>{
                const ia=idxMap.has(a.id)?idxMap.get(a.id):Infinity;
                const ib=idxMap.has(b.id)?idxMap.get(b.id):Infinity;
                if(ia!==ib)return ia-ib;
                return (b.favorite-a.favorite)||(sortBy==='alpha'?a.name.localeCompare(b.name):0)
              });
            }else{
              serverList=[...serverList].sort((a,b)=>(b.favorite-a.favorite)||(sortBy==='alpha'?a.name.localeCompare(b.name):0));
            }
            const order=serverList.map(s=>s.id);
            await fetch('/api/reorder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenant,order})});
            alert(t('sync_successful'));
            fetchData()
          }else alert(t('error') + ": "+d.error);
        }catch{
          alert(t('error_sync'))
        }
        setConfirmState({isOpen:false});
      }
    });
  };

  const handleSaveSettings = async (newConfig) => {
    try {
      if (newConfig.utcOffset !== utcOffset) {
        setUtcOffset(newConfig.utcOffset);
        await saveConfig('utc_offset', newConfig.utcOffset);
      }
      setShowSettingsModal(false);
      alert(t('settings_saved'));
    } catch (e) {
      alert(t('error_saving_settings'));
    }
  };

  const fetchInsights=async()=>{try{const r=await fetch('/api/insights');setInsightsData(await r.json());setShowInsightsModal(true)}catch{alert(t('error_insights'))}};
  const handleExportStats=()=>{window.open('/api/insights/export','_blank')};
  const handleExportSummary=()=>{window.open('/api/insights/export/summary','_blank')};

  const resetForm=()=>setFormData({id:null,name:'',url:'',icon_url:'',parent_label:'',parent_color:COLOR_PRESETS[0],child_label:'',child_color:COLOR_PRESETS[1],isLocal:false});
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return alert(t('error_server')); // Using generic error for simplicity or add specific key

    // 1. Prepare Data
    let iconToSave = formData.icon_url;
    if (!iconToSave) {
      try {
        const urlObj = new URL(formData.url);
        iconToSave = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      } catch (e) {}
    }

    const payload = { ...formData, icon_url: iconToSave };
    const isEdit = !!formData.id;
    
    // 2. Optimistic Update
    const previousShortcuts = [...shortcuts];
    const tempId = isEdit ? formData.id : Date.now(); // Temp ID for new item
    const optimisticItem = {
      ...payload,
      id: tempId,
      clicks: isEdit ? (shortcuts.find(s => s.id === formData.id)?.clicks || 0) : 0,
      favorite: isEdit ? (shortcuts.find(s => s.id === formData.id)?.favorite || 0) : 0,
    };

    // Update Local State Immediately
    if (isEdit) {
      setShortcuts(prev => prev.map(s => s.id === formData.id ? optimisticItem : s));
    } else {
      setShortcuts(prev => [optimisticItem, ...prev]);
    }

    // Close Modal Immediately
    setShowAddModal(false);
    resetForm();

    // 3. Background Sync
    const isLocal = !isAdmin || formData.isLocal;
    
    try {
      if (isLocal) {
        // Local Storage Sync
        const l = JSON.parse(localStorage.getItem('local_shortcuts') || '[]');
        let nl;
        if (isEdit && formData.isLocal) {
          nl = l.map(s => s.id === formData.id ? optimisticItem : s);
        } else {
          nl = [optimisticItem, ...l];
        }
        localStorage.setItem('local_shortcuts', JSON.stringify(nl));
        // No fetch needed for local, just update state (already done)
      } else {
        // Server Sync
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/api/shortcuts/${formData.id}` : '/api/shortcuts';
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Sync failed");

        // Silent Refetch to get real ID (crucial for new items)
        // We wait a bit or just call it.
        // For new items, if we don't get the real ID, subsequent edits/deletes will fail.
        await fetchData(); 
      }
    } catch (err) {
      // 4. Rollback on Error
      setShortcuts(previousShortcuts);
      alert(t('error_saving_data') + ": " + err.message);
    }
  };
  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      message: t('confirm_delete'),
      onConfirm: async () => {
        // 1. Optimistic Update
        const previousShortcuts = [...shortcuts];
        setShortcuts(prev => prev.filter(s => s.id !== id));

        try {
          const t = previousShortcuts.find(s => s.id === id);
          if (t && t.isLocal) {
            // Local Sync
            const l = JSON.parse(localStorage.getItem('local_shortcuts') || '[]');
            localStorage.setItem('local_shortcuts', JSON.stringify(l.filter(s => s.id !== id)));
            // done
          } else if (isAdmin) {
            // Server Sync
            const res = await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
          }
        } catch (err) {
          // Rollback
          setShortcuts(previousShortcuts);
          alert(t('error_deleting') + ": " + err.message);
        }
        setConfirmState({isOpen:false});
      }
    });
  };
  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    // 1. Optimistic Update
    const previousShortcuts = [...shortcuts];
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s));

    try {
      // 2. Local Storage Sync (for local items)
      const t = shortcuts.find(s => s.id === id);
      if (t && t.isLocal) {
        const l = JSON.parse(localStorage.getItem('local_shortcuts') || '[]');
        localStorage.setItem('local_shortcuts', JSON.stringify(l.map(s => s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s)));
        return; // Local update done
      }

      // 3. Server Sync
      const res = await fetch(`/api/favorite/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to sync");
      
      // Success: Do nothing, UI is already correct.
    } catch (err) {
      // 4. Rollback on Error
      setShortcuts(previousShortcuts);
      alert(t('error_syncing_favorite') + ": " + err.message);
    }
  };
  const handleLinkClick=(id,u)=>{const t=shortcuts.find(s=>s.id===id);if(!t?.isLocal)fetch(`/api/click/${id}`,{method:'POST'});window.open(u,'_blank')};
  const handleEdit=(i,e)=>{e.stopPropagation();setFormData({...i,icon_url:i.icon_url||''});setShowAddModal(true)};
  const handleLogin=e=>{e.preventDefault();if(loginCreds.username==='admin'&&loginCreds.password==='miniappadmin'){setIsAdmin(true);setShowLoginModal(false)}else setLoginError(t('invalid_credentials'))};
  const handleImageUpload=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setFormData(p=>({...p,icon_url:ev.target.result}));r.readAsDataURL(f)}};
  const handleExportData=()=>{const d='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({version:2,timestamp:new Date().toISOString(),shortcuts:shortcuts.filter(s=>!s.isLocal),labels:labelColors}));const a=document.createElement('a');a.href=d;a.download='backup.json';document.body.appendChild(a);a.click();a.remove()};
  const handleImportData=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=async ev=>{await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(JSON.parse(ev.target.result))});alert(t('import_successful'));fetchData()};r.readAsText(f)}};
  const handleDragStart=(e,id)=>{setDraggingId(id);e.dataTransfer.effectAllowed='move';const iconEl=e.currentTarget.querySelector('[data-icon]');if(iconEl&&e.dataTransfer.setDragImage){const rect=iconEl.getBoundingClientRect();const clone=iconEl.cloneNode(true);clone.style.width=rect.width+'px';clone.style.height=rect.height+'px';clone.style.borderRadius='16px';clone.style.overflow='hidden';clone.style.position='absolute';clone.style.top='-1000px';clone.style.left='-1000px';clone.style.zIndex='9999';document.body.appendChild(clone);e.dataTransfer.setDragImage(clone,rect.width/2,rect.height/2);setTimeout(()=>{document.body.removeChild(clone)},0)}};
  const handleDragOver=e=>{e.preventDefault();e.dataTransfer.dropEffect='move'};
  const handleDrop=(e,targetId)=>{e.preventDefault();if(!draggingId||draggingId===targetId)return;setClientOrder(prev=>{const baseIds=filteredShortcuts.map(s=>s.id);let current=prev&&prev.length?prev.filter(id=>baseIds.includes(id)):baseIds.slice();baseIds.forEach(id=>{if(!current.includes(id))current.push(id)});const from=current.indexOf(draggingId);const to=current.indexOf(targetId);if(from===-1||to===-1)return prev;const next=current.slice();next.splice(from,1);next.splice(to,0,draggingId);localStorage.setItem('shortcut_order_'+tenant,JSON.stringify(next));return next});setDraggingId(null)};
  const handleDragEnd=()=>{setDraggingId(null)};

  const uniqueParents=useMemo(()=>[...new Set(shortcuts.map(s=>s.parent_label).filter(Boolean))].sort(),[shortcuts]);
  const uniqueChildren=useMemo(()=>[...new Set(shortcuts.flatMap(s=>(s.child_label||'').split(',').map(t=>t.trim()).filter(Boolean)))].sort(),[shortcuts]);
  
  // FIX: Sorting Logic now prioritizes explicit SortBy unless it is 'default'
  const filteredShortcuts=useMemo(()=>{
    let r=shortcuts.filter(i=>{const t=debouncedSearchTerm.trim().toLowerCase(),m=(!t||i.name.toLowerCase().includes(t))&&(!activeParentFilter||i.parent_label===activeParentFilter);if(!m)return false;if(activeChildFilter){const tags=(i.child_label||'').split(',').map(s=>s.trim());if(!tags.includes(activeChildFilter))return false}return true});
    
    // First, always apply alpha or favorite sort as base
    r.sort((a,b)=>(b.favorite-a.favorite)||(a.name.localeCompare(b.name)));
    
    // If we are in default mode (list), we TRY to use custom order
    if(sortBy==='default' && clientOrder.length){
        const idxMap=new Map(clientOrder.map((id,i)=>[id,i]));
        return[...r].sort((a,b)=>{
            const ia=idxMap.has(a.id)?idxMap.get(a.id):999999;
            const ib=idxMap.has(b.id)?idxMap.get(b.id):999999;
             // If both have custom order, use it. If not, fall back to comparison.
             // Note: idx default is high so new items go to end
            if(ia!==ib)return ia-ib;
            return 0; 
        });
    } else if (sortBy === 'alpha') {
        // Explicit Alpha Sort
        return [...r].sort((a,b) => a.name.localeCompare(b.name));
    }

    return r; // Fallback
},[shortcuts,debouncedSearchTerm,activeParentFilter,activeChildFilter,sortBy,clientOrder]);

  useEffect(()=>{
    const calcItemsPerPage=()=>{if(!gridWrapperRef.current||!gridRef.current)return;const style=getComputedStyle(gridRef.current);const colCount=style.gridTemplateColumns.split(' ').length||1;const cardEl=gridRef.current.querySelector('[data-card]');const cardHeight=cardEl?cardEl.getBoundingClientRect().height:140;const wrapperRect=gridWrapperRef.current.getBoundingClientRect();const availableHeight=window.innerHeight-wrapperRect.top-80;const rows=Math.max(1,Math.floor(availableHeight/cardHeight));setItemsPerPage(Math.max(colCount*rows,colCount))};
    calcItemsPerPage();window.addEventListener('resize',calcItemsPerPage);return()=>window.removeEventListener('resize',calcItemsPerPage)
  },[filteredShortcuts.length,darkMode,bgImage,bgVideo,bgEmbed]);
  const totalPages=Math.max(1,Math.ceil(filteredShortcuts.length/Math.max(1,itemsPerPage)));
  useEffect(()=>{if(currentPage>=totalPages)setCurrentPage(totalPages-1)},[totalPages,currentPage]);
  const pagedShortcuts=useMemo(()=>filteredShortcuts.slice(currentPage*itemsPerPage,(currentPage+1)*itemsPerPage),[filteredShortcuts,currentPage,itemsPerPage]);
  const goNext=()=>setCurrentPage(p=>Math.min(p+1,totalPages-1));const goPrev=()=>setCurrentPage(p=>Math.max(p-1,0));
  const bgClass=darkMode?'bg-gray-900':'bg-[#F4F4F4]',currentTextColor=darkMode?darkTextColor:lightTextColor;
  const cardClass=darkMode?'bg-gray-800 border-gray-700 hover:border-blue-500':'bg-white border-[#D8D8D8] hover:border-[#009FB8]';
  const inputClass=darkMode?'bg-gray-800 border-gray-700':'bg-white border-[#D8D8D8]',modalClass=darkMode?'bg-gray-900 border-gray-700':'bg-white border-[#D8D8D8]';
  const isLastPage=currentPage===totalPages-1;
  if(loading)return<div className={`min-h-screen flex items-center justify-center ${bgClass}`}><span className="loader"></span></div>;

  // New Pagination Helpers
  const maxDots=6;
  let dotStart=0;
  if(totalPages>maxDots){
    if(currentPage<3) dotStart=0;
    else if(currentPage>totalPages-4) dotStart=totalPages-maxDots;
    else dotStart=currentPage-2;
  }
  const visibleDots=Array.from({length:Math.min(totalPages,maxDots)}).map((_,i)=>dotStart+i);

  return (
    <div className={`min-h-screen font-light transition-all duration-300 bg-cover bg-center bg-no-repeat bg-fixed ${bgClass}`} style={{backgroundImage:bgImage?`url(${bgImage})`:'none',color:currentTextColor}}>
      {bgVideo&&<video className="fixed inset-0 w-full h-full object-cover -z-10" src={bgVideo} autoPlay loop muted playsInline/>}
      {bgEmbed&&<iframe className="fixed inset-0 w-full h-full -z-20 pointer-events-none" src={bgEmbed+(bgEmbed.includes('?')?'&':'?')+'autoplay=1&mute=1&loop=1&controls=0&playsinline=1'+(bgEmbed.match(/\/embed\/([^?]+)/)?'&playlist='+bgEmbed.match(/\/embed\/([^?]+)/)[1]:'')} title="Background" frameBorder="0" allow="autoplay; fullscreen"/>}
      <div className="min-h-screen w-full transition-colors duration-300" style={{backgroundColor:(bgImage||bgVideo||bgEmbed)?(darkMode?`rgba(0,0,0,${overlayOpacity})`:`rgba(255,255,255,${overlayOpacity})`):''}}>
        <div className="sticky top-0 z-30 w-full flex flex-col pt-4 px-4 gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between gap-3 relative">
            {/* CLOCK DESKTOP: Now responsive, on the left */}
            <div className="hidden sm:block min-w-[120px]">
              <React.Suspense fallback={<div className="h-8 w-24 bg-gray-200/20 rounded animate-pulse"/>}>
                <Clock utcOffset={utcOffset} />
              </React.Suspense>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 max-w-2xl">
               <div className="relative group w-full transition-all"><Search className="absolute inset-y-0 left-0 pl-3 h-full w-7 opacity-50"/><input type="text" className={`block w-full pl-10 pr-3 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009FB8] ${inputClass} ${(bgImage||bgVideo||bgEmbed)?'bg-opacity-60 backdrop-blur-md':'bg-opacity-60'}`} style={{color:currentTextColor}} placeholder={t('search_placeholder')} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
               <React.Suspense fallback={<div className="w-9 h-9 bg-gray-200/50 rounded-full"/>}>
                 <button onClick={()=>setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-full shadow-sm border ${inputClass} ${(bgImage||bgVideo||bgEmbed)?'bg-opacity-80':''}`}><Filter size={18}/></button>
               </React.Suspense>
               <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm"><button onClick={()=>setSortBy('default')} className={`p-1.5 rounded-full text-xs ${sortBy==='default'?'bg-white dark:bg-gray-700 shadow':'opacity-50'}`}><List size={14}/></button><button onClick={()=>setSortBy('alpha')} className={`p-1.5 rounded-full text-xs ${sortBy==='alpha'?'bg-white dark:bg-gray-700 shadow':'opacity-50'}`}>Aa</button></div>
            </div>

            {/* Spacer for potential right-side elements or keeping it centered */}
             <div className="hidden sm:block min-w-[120px]"></div>
          </div>
          
          {/* PAGINATION & CLOCK MOBILE */}
          {totalPages>1&&(
            <div className="pointer-events-auto w-full max-w-2xl mx-auto flex justify-center mb-1 relative">
               {/* CLOCK MOBILE: Left of Pagination */}
               <div className="sm:hidden absolute left-6 top-1/2 -translate-y-1/2">
                <React.Suspense fallback={null}>
                 <Clock utcOffset={utcOffset} className="text-sm" />
                </React.Suspense>
               </div>

              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 border border-gray-300/60 dark:border-gray-700/60 backdrop-blur-sm shadow-sm">
                {totalPages>6&&(
                  isEditingPage?(
                    <input autoFocus className="w-12 bg-transparent border-b border-blue-500 text-center text-[11px] outline-none" value={pageInput} onChange={e=>setPageInput(e.target.value)} onBlur={()=>{setIsEditingPage(false);setPageInput('')}} onKeyDown={e=>{if(e.key==='Enter'){const p=parseInt(pageInput)-1;if(!isNaN(p)&&p>=0&&p<totalPages)setCurrentPage(p);setIsEditingPage(false)}}}/>
                  ):(
                    <span className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer font-medium min-w-[60px] text-center" onClick={()=>{setIsEditingPage(true);setPageInput(String(currentPage+1))}} title={t('enter_page_number')}>{t('page')} {currentPage+1}/{totalPages}</span>
                  )
                )}
                <div className="flex items-center gap-1.5">
                  {visibleDots.map(i=>(<button key={i} onClick={()=>setCurrentPage(i)} className={`w-2 h-2 rounded-full transition-all duration-300 border ${i===currentPage?(darkMode?'bg-white border-white scale-125':'bg-gray-800 border-gray-800 scale-125'):(darkMode?'bg-white/20 border-white/20 hover:bg-white/40':'bg-gray-400/40 border-gray-400/40 hover:bg-gray-400/60')}`}/>))}
                </div>
              </div>
            </div>
          )}

          <React.Suspense fallback={null}>
            <FilterPanel 
              isOpen={showFilterPanel}
              activeParentFilter={activeParentFilter}
              setActiveParentFilter={setActiveParentFilter}
              activeChildFilter={activeChildFilter}
              setActiveChildFilter={setActiveChildFilter}
              uniqueParents={uniqueParents}
              uniqueChildren={uniqueChildren}
              labelColors={labelColors}
              modalClass={modalClass}
              getContrastYIQ={getContrastYIQ}
            />
          </React.Suspense>
        </div>
        
        {/* GRID */}
        <div ref={gridWrapperRef} className="max-w-7xl mx-auto px-6 pb-32 pt-8 min-h-[60vh]" style={{overflow:"hidden"}} onWheel={e=>{e.preventDefault();if(e.deltaY>0||e.deltaX>0)goNext();else goPrev()}} onTouchStart={e=>setTouchStartX(e.touches[0].clientX)} onTouchMove={e=>e.preventDefault()} onTouchEnd={e=>{if(touchStartX===null)return;const d=e.changedTouches[0].clientX-touchStartX;if(Math.abs(d)>50){if(d<0)goNext();else goPrev()}setTouchStartX(null)}}>
          <div ref={gridRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
            {pagedShortcuts.map(i=>(
              <React.Suspense key={i.id} fallback={<div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"/>}>
              <ShortcutCard 
                item={i}
                isAdmin={isAdmin}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                handleLinkClick={handleLinkClick}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleToggleFavorite={handleToggleFavorite}
                cardClass={cardClass}
                labelColors={labelColors}
                bgOverlay={(bgImage||bgVideo||bgEmbed)}
                draggingId={draggingId}
                darkMode={darkMode}
                getContrastYIQ={getContrastYIQ}
              />
              </React.Suspense>
            ))}
            {isLastPage&&(
              <div className="flex flex-col items-center w-full max-w-[100px] cursor-pointer group" onClick={()=>{resetForm();setShowAddModal(true)}}><div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-2 backdrop-blur-sm bg-white/10 dark:bg-black/10 hover:bg-emerald-500/10`}><Plus size={24} className="opacity-50 font-light"/></div><span className="text-xs font-light opacity-50">{t('add_app')}</span></div>
            )}
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300 max-w-[calc(100vw-3rem)]">
          <div className="group/menu flex flex-wrap items-center justify-end gap-2 p-2 rounded-3xl hover:bg-white/20 hover:backdrop-blur-md transition-all">
            {(bgImage||bgVideo||bgEmbed)&&<div className="flex items-center gap-1 mr-2 bg-black/40 rounded-full px-2 py-1 backdrop-blur-sm"><span className="text-[10px] text-white/90 font-bold">BG</span><input type="range" min="0" max="0.9" step="0.1" value={overlayOpacity} onChange={e=>{const v=parseFloat(e.target.value);setOverlayOpacity(v);localStorage.setItem('overlayOpacity',v);if(isAdmin)saveConfig('overlay_opacity',v)}} className="w-16 h-1 accent-[#009FB8] cursor-pointer"/></div>}
            <div className="flex flex-wrap items-center gap-2 justify-end">
             <button onClick={()=>setDarkMode(!darkMode)} className={`p-2 rounded-full border shadow-sm ${inputClass} ${(bgImage||bgVideo||bgEmbed)?'bg-opacity-80':''}`}>{darkMode?<Sun size={18} className="text-yellow-400"/>:<Moon size={18} className="text-gray-600"/>}</button>
             <div className={`flex flex-wrap items-center gap-1 p-1 rounded-3xl border shadow-lg ${inputClass} bg-opacity-80 backdrop-blur relative justify-end`}>
              
              {/* NEW PALETTE POPOVER TRIGGER */}
              <div className="relative z-50">
                <button 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`color-picker-trigger p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full ${showColorPicker ? 'bg-blue-100 dark:bg-blue-900 text-blue-500' : ''}`} 
                  title={t('text_color')}
                >
                  <Palette size={16}/>
                </button>

                {showColorPicker && (
                    <div className="color-picker-popover absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 min-w-[120px] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                            <input type="color" value={lightTextColor} onChange={e=>handleTextColorChange('light',e.target.value)} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden"/>
                            <span className="text-[10px] font-medium opacity-70">{t('text_light')}</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                             <input type="color" value={darkTextColor} onChange={e=>handleTextColorChange('dark',e.target.value)} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden"/>
                             <span className="text-[10px] font-medium opacity-70">{t('text_dark')}</span>
                        </div>
                        {/* Little triangle arrow */}
// This is a placeholder. I need to see the file content first to know what to replace.
                    </div>
                )}
              </div>
              
              <div className="w-px h-4 bg-gray-300 mx-1"></div>

              {/* Media Controls */}
              <button onClick={()=>bgInputRef.current?.click()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><ImageIcon size={16}/></button><input type="file" ref={bgInputRef} className="hidden" accept="image/*,video/*" onChange={handleBgUpload}/>
              <div className="hidden sm:flex items-center gap-1 ml-1"><input type="text" placeholder={t('image_gif_link')} className={`px-2 py-1 text-[11px] rounded-full border max-w-[120px] ${inputClass}`} value={bgUrlInput} onChange={e=>setBgUrlInput(e.target.value)}/><button type="button" onClick={applyBgUrl} className="px-2 py-1 text-[11px] rounded-full border border-gray-400/50 hover:bg-gray-200 dark:hover:bg-gray-700">{t('set')}</button></div>
              
              {/* Language Switcher */}
              <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 mr-2 gap-1">
                 {['vn','en','de'].map(l=>(<button key={l} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full transition-all ${lang===l?'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm':'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} onClick={()=>setLang(l)}>{l}</button>))}
              </div>

              {isAdmin&&(<>
                <button onClick={fetchInsights} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"><ChartIcon size={16}/></button>
                <button onClick={handleForceSync} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-purple-500" title="Đồng bộ Client"><RefreshCw size={16}/></button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button onClick={handleExportData} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-blue-500"><Download size={16}/></button>
                <button onClick={()=>importInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-green-500"><FileUp size={16}/></button>
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData}/>
                <button onClick={handleClearMedia} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500" title="Xóa nền"><Trash2 size={16}/></button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button onClick={()=>setShowSettingsModal(true)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title={t('app_config')}><Settings size={16}/></button>
                <button onClick={()=>setIsAdmin(false)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500"><LogOut size={16}/></button>
              </>)}
              {!isAdmin&&(<>
                <button onClick={handleClearMedia} className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500" title="Xóa nền"><Trash2 size={16}/></button>
                {localStorage.getItem('custom_bg')&&<button onClick={handleResetBg} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"><RotateCcw size={16}/></button>}
                <button onClick={()=>setShowLoginModal(true)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title={t('admin_login')}><Key size={18}/></button>
              </>)}
            </div></div>
            <div className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white shadow-lg cursor-pointer group-hover/menu:hidden absolute bottom-0 right-0 pointer-events-none"><Grip size={20} className="opacity-80"/></div>
          </div>
        </div>
        
        <React.Suspense fallback={null}>
        <InsightsModal 
          isOpen={showInsightsModal} 
          onClose={() => setShowInsightsModal(false)}
          data={insightsData}
          onExportStats={handleExportStats}
          onExportSummary={handleExportSummary}
          modalClass={modalClass}
        />
        </React.Suspense>

        <React.Suspense fallback={null}>
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          creds={loginCreds}
          setCreds={setLoginCreds}
          onLogin={handleLogin}
          error={loginError}
          modalClass={modalClass}
          inputClass={inputClass}
        />
        </React.Suspense>

        <React.Suspense fallback={null}>
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          config={{ utcOffset }}
          onSave={handleSaveSettings}
          modalClass={modalClass}
          inputClass={inputClass}
        />
        </React.Suspense>

        <React.Suspense fallback={null}>
        <AddEditModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
          modalClass={modalClass}
          inputClass={inputClass}
          darkMode={darkMode}
          isEdit={!!formData.id}
        />
        </React.Suspense>
        <React.Suspense fallback={null}>
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
          confirmText={t('yes')}
          cancelText={t('no')}
        />
        </React.Suspense>
      </div>
    </div>
  );
}
