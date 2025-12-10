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
      <div className={`rounded-2xl shadow-2xl w-full max-w-xs p-6 border ${modalClass}`}>
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
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border ${modalClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{isEdit ? 'Sửa' : 'Thêm'} App</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Tên"
            className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="URL"
            className={`w-full px-4 py-3 rounded-xl text-sm border ${inputClass}`}
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 border ${inputClass} hover:opacity-80`}
          >
            {formData.icon_url ? (
              <img
                src={formData.icon_url}
                className="w-10 h-10 rounded border object-cover"
                alt="Icon"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-500/20 flex items-center justify-center">
                <Upload size={20} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Tải icon lên</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={onImageUpload}
          />
          <input
            type="text"
            placeholder="Hoặc dán link ảnh (https://...)"
            className={`w-full px-4 py-2 rounded-xl text-sm border ${inputClass}`}
            value={formData.icon_url?.startsWith('data:') ? '' : formData.icon_url}
            onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
          />
          <div
            className={`border-t pt-3 space-y-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input
                type="text"
                placeholder="Nhóm lớn"
                className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
                value={formData.parent_label}
                onChange={(e) => setFormData({ ...formData, parent_label: e.target.value })}
              />
              <div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer">
                <input
                  type="color"
                  className="absolute -top-2 -left-2 w-12 h-12"
                  value={formData.parent_color}
                  onChange={(e) => setFormData({ ...formData, parent_color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input
                type="text"
                placeholder="Nhóm con (cách nhau phẩy)"
                className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
                value={formData.child_label}
                onChange={(e) => setFormData({ ...formData, child_label: e.target.value })}
              />
              <div className="relative w-8 h-8 rounded-full border overflow-hidden cursor-pointer">
                <input
                  type="color"
                  className="absolute -top-2 -left-2 w-12 h-12"
                  value={formData.child_color}
                  onChange={(e) => setFormData({ ...formData, child_color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <button className="w-full py-3 bg-[#0F2F55] text-white rounded-xl mt-2 hover:bg-opacity-90">
            Lưu
          </button>
        </form>
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
      <div className={`w-full max-w-sm p-6 rounded-2xl shadow-xl transition-all ${modalClass}`} onClick={e => e.stopPropagation()}>
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
