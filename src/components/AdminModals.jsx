import React from 'react';
import { X, Upload } from 'lucide-react';

export function LoginModal({
  isOpen,
  onClose,
  creds,
  setCreds,
  onLogin,
  error,
  modalClass,
  inputClass
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl w-[95%] max-w-xs p-6 border max-h-[90vh] overflow-y-auto ${modalClass}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">Admin</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="text"
            placeholder="User"
            className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`}
            value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Pass"
            className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`}
            value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg hover:bg-opacity-90">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export function AddEditModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  fileInputRef,
  onImageUpload,
  modalClass,
  inputClass,
  darkMode,
  isEdit
}) {
  if (!isOpen) return null;
  const COLOR_PRESETS = ['#0A1A2F', '#009FB8', '#6D28D9', '#BE123C', '#059669', '#C2410C', '#475569'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`rounded-3xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col border ${modalClass} scale-100 transition-all`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50/80'}`}>
          <div>
            <h3 className="font-bold text-lg">{isEdit ? 'Chỉnh Sửa' : 'Thêm Mới'}</h3>
            <p className="text-xs opacity-60">Nhập thông tin ứng dụng của bạn</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={onSubmit} className="space-y-6">
            
            {/* Name & URL Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 ml-1">Tên ứng dụng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Google"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none ${inputClass}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 ml-1">Đường dẫn (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none ${inputClass}`}
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Icon Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-70 ml-1">Icon hiển thị</label>
              <div className="flex gap-4 items-start">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group relative overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                >
                  {formData.icon_url ? (
                    <img src={formData.icon_url} className="w-full h-full object-cover" alt="Icon" />
                  ) : (
                    <Upload size={24} className="opacity-40 group-hover:scale-110 transition-transform"/>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold">Thay đổi</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                   <div className="relative">
                      <input
                        type="text"
                        placeholder="Hoặc dán URL ảnh trực tiếp..."
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                        value={formData.icon_url?.startsWith('data:') ? '' : formData.icon_url}
                        onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><Upload size={14}/></div>
                   </div>
                   <p className="text-[10px] opacity-60 leading-relaxed">
                     Tip: App sẽ tự động lấy icon từ Google nếu bạn để trống (khi lưu). Khuyên dùng ảnh vuông hoặc PNG trong suốt.
                   </p>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageUpload} />
            </div>

            {/* Categorization */}
            <div className={`border-t pt-5 space-y-5 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              
              {/* Parent Group */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold opacity-70 ml-1">Nhóm lớn (Parent)</label>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.slice(0,5).map(c => (
                        <div key={c} onClick={() => setFormData({...formData, parent_color: c})} className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform ${formData.parent_color === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`} style={{background: c}}></div>
                      ))}
                      <input type="color" value={formData.parent_color} onChange={e=>setFormData({...formData, parent_color: e.target.value})} className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer"/>
                    </div>
                 </div>
                 <input
                    type="text"
                    placeholder="VD: Công việc, Giải trí..."
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                    value={formData.parent_label}
                    onChange={(e) => setFormData({ ...formData, parent_label: e.target.value })}
                  />
              </div>

               {/* Child Group */}
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold opacity-70 ml-1">Tag phụ (Child)</label>
                    <div className="flex gap-1.5">
                       {COLOR_PRESETS.slice(0,5).map(c => (
                        <div key={c+'_child'} onClick={() => setFormData({...formData, child_color: c})} className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform ${formData.child_color === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`} style={{background: c}}></div>
                      ))}
                      <input type="color" value={formData.child_color} onChange={e=>setFormData({...formData, child_color: e.target.value})} className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer"/>
                    </div>
                 </div>
                 <input
                    type="text"
                    placeholder="VD: Quan trọng, Cần làm ngay..."
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                    value={formData.child_label}
                    onChange={(e) => setFormData({ ...formData, child_label: e.target.value })}
                  />
              </div>

            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50/80'}`}>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-80 hover:opacity-100">
            Hủy bỏ
          </button>
          <button onClick={onSubmit} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0F2F55] text-white hover:bg-[#1a4b85] shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
            {isEdit ? 'Lưu Thay Đổi' : 'Tạo Mới'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, config, onSave, modalClass, inputClass }) {
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handleChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(localConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`w-[95%] max-w-sm p-6 rounded-2xl shadow-xl transition-all max-h-[90vh] overflow-y-auto ${modalClass}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Cài đặt hệ thống</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Múi giờ (UTC Offset)</label>
            <input 
              type="number" 
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              value={localConfig.utcOffset}
              onChange={e => handleChange('utcOffset', parseFloat(e.target.value))}
              step="0.5"
            />
            <p className="text-[10px] opacity-50 mt-1">Ví dụ: Việt Nam là 7</p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
}
