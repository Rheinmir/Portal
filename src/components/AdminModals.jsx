import React, { useState } from "react";
import { X, Upload, ChevronDown } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function LoginModal({
  isOpen,
  onClose,
  creds,
  setCreds,
  onLogin,
  error,
  modalClass,
  inputClass,
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl w-[95%] max-w-xs p-6 border max-h-[90vh] overflow-y-auto ${modalClass}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">{t("login_title")}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="text"
            placeholder={t("user_placeholder")}
            className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`}
            value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })}
          />
          <input
            type="password"
            placeholder={t("pass_placeholder")}
            className={`w-full px-4 py-2 rounded-lg text-sm border ${inputClass}`}
            value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button className="w-full py-2 bg-[#0F2F55] text-white rounded-lg hover:bg-opacity-90">
            {t("login_btn")}
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
  isEdit,
  isAdmin,
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(isAdmin || isEdit);
  if (!isOpen) return null;
  const COLOR_PRESETS = [
    "#0A1A2F",
    "#009FB8",
    "#6D28D9",
    "#BE123C",
    "#059669",
    "#C2410C",
    "#475569",
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col border ${modalClass} scale-100 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex justify-between items-center ${
            darkMode
              ? "border-gray-700 bg-gray-900/50"
              : "border-gray-100 bg-gray-50/80"
          }`}
        >
          <div>
            <h3 className="font-bold text-lg">
              {isEdit ? t("edit") : t("add_new")}
            </h3>
            <p className="text-xs opacity-60">{t("enter_app_info")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name & URL Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 ml-1">
                  {t("name")}
                </label>
                <input
                  type="text"
                  placeholder={t("example_name")}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none ${inputClass}`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 ml-1">
                  {t("url")}
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none ${inputClass}`}
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Icon Section - Conditional Rendering */}
            {isExpanded ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-semibold opacity-70 ml-1">
                  {t("icon_label")}
                </label>
                <div className="flex gap-4 items-start">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#3B82F6";
                      e.currentTarget.style.backgroundColor =
                        "rgba(59, 130, 246, 0.1)";
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.backgroundColor = "";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.backgroundColor = "";
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData((prev) => ({
                              ...prev,
                              icon_url: ev.target.result,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                    className={`w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group relative overflow-hidden ${
                      darkMode ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    {formData.icon_url ? (
                      <img
                        src={formData.icon_url}
                        className="w-full h-full object-cover"
                        alt="Icon"
                      />
                    ) : (
                      <Upload
                        size={24}
                        className="opacity-40 group-hover:scale-110 transition-transform"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-bold">
                        {t("change")}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t("or_paste_url")}
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                        value={
                          formData.icon_url?.startsWith("data:")
                            ? ""
                            : formData.icon_url
                        }
                        onChange={(e) =>
                          setFormData({ ...formData, icon_url: e.target.value })
                        }
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                        <Upload size={14} />
                      </div>
                    </div>
                    <p className="text-[10px] opacity-60 leading-relaxed">
                      {t("tip_icon")}
                    </p>
                  </div>
                </div>
                {/* File input is shared */}
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-10 h-10 flex-shrink-0 rounded-xl border flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors overflow-hidden ${
                    darkMode ? "border-gray-700" : "border-gray-300"
                  }`}
                  title={t("icon_label")}
                >
                  {formData.icon_url ? (
                    <img
                      src={formData.icon_url}
                      className="w-full h-full object-cover"
                      alt="Icon"
                    />
                  ) : (
                    <Upload size={16} className="opacity-50" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder={t("or_paste_url")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                  value={
                    formData.icon_url?.startsWith("data:")
                      ? ""
                      : formData.icon_url
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, icon_url: e.target.value })
                  }
                />
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={onImageUpload}
            />

            {/* Categorization & Expand */}
            {isExpanded ? (
              <div
                className={`border-t pt-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  darkMode ? "border-gray-700" : "border-gray-100"
                }`}
              >
                {/* Parent Group */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold opacity-70 ml-1">
                      {t("parent_group")}
                    </label>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.slice(0, 5).map((c) => (
                        <div
                          key={c}
                          onClick={() =>
                            setFormData({ ...formData, parent_color: c })
                          }
                          className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                            formData.parent_color === c
                              ? "ring-2 ring-offset-1 ring-blue-500"
                              : ""
                          }`}
                          style={{ background: c }}
                        ></div>
                      ))}
                      <input
                        type="color"
                        value={formData.parent_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parent_color: e.target.value,
                          })
                        }
                        className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={t("example_parent")}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                    value={formData.parent_label}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_label: e.target.value })
                    }
                  />
                </div>

                {/* Child Group */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold opacity-70 ml-1">
                      {t("child_tags")}
                    </label>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.slice(0, 5).map((c) => (
                        <div
                          key={c + "_child"}
                          onClick={() =>
                            setFormData({ ...formData, child_color: c })
                          }
                          className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                            formData.child_color === c
                              ? "ring-2 ring-offset-1 ring-blue-500"
                              : ""
                          }`}
                          style={{ background: c }}
                        ></div>
                      ))}
                      <input
                        type="color"
                        value={formData.child_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            child_color: e.target.value,
                          })
                        }
                        className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={t("example_child")}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500/50 outline-none ${inputClass}`}
                    value={formData.child_label}
                    onChange={(e) =>
                      setFormData({ ...formData, child_label: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
                >
                  {t("expand_more") || "Expand"} <ChevronDown size={14} />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex justify-end gap-3 ${
            darkMode
              ? "border-gray-700 bg-gray-900/50"
              : "border-gray-100 bg-gray-50/80"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-80 hover:opacity-100"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0F2F55] text-white hover:bg-[#1a4b85] shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isEdit ? t("save") : t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
  modalClass,
  inputClass,
}) {
  const { t } = useLanguage();
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handleChange = (key, value) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(localConfig);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-[95%] max-w-sm p-6 rounded-2xl shadow-xl transition-all max-h-[90vh] overflow-y-auto ${modalClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">{t("app_config")}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">
              {t("timezone") || "Timezone (UTC)"}
            </label>
            <input
              type="number"
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              value={localConfig.utcOffset}
              onChange={(e) =>
                handleChange("utcOffset", parseFloat(e.target.value))
              }
              step="0.5"
            />
            <p className="text-[10px] opacity-50 mt-1">
              {t("timezone_tip") || "Ex: VN = 7"}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
