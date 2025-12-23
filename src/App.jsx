import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Trash2,
  Plus,
  Grip,
  Search,
  Moon,
  Sun,
  Settings,
  Key,
  BarChart as ChartIcon,
  Image as ImageIcon,
  X,
  Palette,
  Type,
  Link,
  Upload,
  RefreshCw,
  Filter,
  Tag,
  Download,
  FileUp,
  Pencil,
  Star,
  LayoutGrid,
  List,
  RotateCcw,
  LogOut,
  Camera,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
const ShortcutCard = React.lazy(() => import("./components/ShortcutCard"));
const InsightsModal = React.lazy(() => import("./components/InsightsModal"));
const FilterPanel = React.lazy(() => import("./components/FilterPanel"));
const Clock = React.lazy(() => import("./components/Clock"));
const ConfirmDialog = React.lazy(() => import("./components/ConfirmDialog"));

// Lazy load named exports
const LoginModal = React.lazy(() =>
  import("./components/AdminModals").then((module) => ({
    default: module.LoginModal,
  }))
);
const AddEditModal = React.lazy(() =>
  import("./components/AdminModals").then((module) => ({
    default: module.AddEditModal,
  }))
);
const SettingsModal = React.lazy(() =>
  import("./components/AdminModals").then((module) => ({
    default: module.SettingsModal,
  }))
);

const COLOR_PRESETS = [
  "#0A1A2F",
  "#009FB8",
  "#6D28D9",
  "#BE123C",
  "#059669",
  "#C2410C",
  "#475569",
];
const DEFAULT_LIGHT_TEXT = "#2C2C2C",
  DEFAULT_DARK_TEXT = "#E2E8F0";
const getContrastYIQ = (hex) => {
  if (!hex) return "#fff";
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16),
    g = parseInt(h.substr(2, 2), 16),
    b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128
    ? DEFAULT_LIGHT_TEXT
    : "#fff";
};
const normalizeTenant = (t) =>
  (t && typeof t === "string" ? t.trim() : "") || "default";
const DEFAULT_ITEMS_PER_PAGE = 48;
const isVideoFile = (s) =>
  typeof s === "string" && /\.(mp4|webm|ogg)(\?|$)/i.test(s);
const isYoutubeEmbed = (s) =>
  typeof s === "string" && s.includes("youtube.com/embed/");

function normalizeYoutube(url) {
  if (!url) return url;
  const watch = url.match(/v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const [shortcuts, setShortcuts] = useState([]),
    [labelColors, setLabelColors] = useState({}),
    [loading, setLoading] = useState(true),
    [darkMode, setDarkMode] = useState(
      () => localStorage.getItem("darkMode") === "true"
    ),
    [bgImage, setBgImage] = useState(null),
    [serverBg, setServerBg] = useState(null),
    [bgVideo, setBgVideo] = useState(null),
    [bgEmbed, setBgEmbed] = useState(null),
    [overlayOpacity, setOverlayOpacity] = useState(() => {
      const r = localStorage.getItem("overlayOpacity");
      const n = parseFloat(r);
      return isNaN(n) ? 0.5 : n;
    });
  const [lightTextColor, setLightTextColor] = useState(
      () => localStorage.getItem("custom_text_light") || DEFAULT_LIGHT_TEXT
    ),
    [darkTextColor, setDarkTextColor] = useState(
      () => localStorage.getItem("custom_text_dark") || DEFAULT_DARK_TEXT
    );
  const [formData, setFormData] = useState({
      id: null,
      name: "",
      url: "",
      icon_url: "",
      parent_label: "",
      parent_color: COLOR_PRESETS[0],
      child_label: "",
      child_color: COLOR_PRESETS[1],
      isLocal: false,
    }),
    [searchTerm, setSearchTerm] = useState(""),
    [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""),
    [showFilterPanel, setShowFilterPanel] = useState(false),
    [activeParentFilter, setActiveParentFilter] = useState(null),
    [activeChildFilter, setActiveChildFilter] = useState(null),
    [isAdmin, setIsAdmin] = useState(false),
    [showLoginModal, setShowLoginModal] = useState(false),
    [showAddModal, setShowAddModal] = useState(false),
    [showInsightsModal, setShowInsightsModal] = useState(false),
    [showSettingsModal, setShowSettingsModal] = useState(false),
    [insightsData, setInsightsData] = useState(null),
    [loginCreds, setLoginCreds] = useState({ username: "", password: "" }),
    [loginError, setLoginError] = useState(""),
    [showConfig, setShowConfig] = useState(false),
    [showMenu, setShowMenu] = useState(false),
    [sortBy, setSortBy] = useState("default"),
    [tenant, setTenant] = useState(() =>
      normalizeTenant(localStorage.getItem("tenant"))
    ),
    [bgUrlInput, setBgUrlInput] = useState(""),
    [isEditingPage, setIsEditingPage] = useState(false),
    [pageInput, setPageInput] = useState("");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("viewMode") || "default"
  );
  const [utcOffset, setUtcOffset] = useState(7);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [searchFile, setSearchFile] = useState(null);
  const [searchPreview, setSearchPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const searchFileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(0),
    [touchStartX, setTouchStartX] = useState(null),
    [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [colCount, setColCount] = useState(6); // Default estimation
  const [clientOrder, setClientOrder] = useState(() => {
      const r = localStorage.getItem("shortcut_order_" + tenant);
      return r ? JSON.parse(r) : [];
    }),
    [draggingId, setDraggingId] = useState(null);
  const [isGrouped, setIsGrouped] = useState(false);

  const fileInputRef = useRef(null),
    bgInputRef = useRef(null),
    importInputRef = useRef(null),
    gridWrapperRef = useRef(null),
    gridRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const p1 = html.style.overflow;
    const p2 = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = p1;
      body.style.overflow = p2;
    };
  }, []);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showColorPicker &&
        !e.target.closest(".color-picker-popover") &&
        !e.target.closest(".color-picker-trigger")
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      // Only trigger if dragging files
      if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    };
    window.addEventListener("dragenter", handleWindowDragEnter);
    return () => window.removeEventListener("dragenter", handleWindowDragEnter);
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);
  useEffect(() => {
    const r = localStorage.getItem("shortcut_order_" + tenant);
    setClientOrder(r ? JSON.parse(r) : []);
  }, [tenant]);
  useEffect(() => {
    setCurrentPage(0);
  }, [
    debouncedSearchTerm,
    activeParentFilter,
    activeChildFilter,
    sortBy,
    tenant,
    isGrouped, // Reset page when grouping changes
  ]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const applyBackgroundSource = (src, isFromServer = false) => {
    if (isFromServer) setServerBg(src);
    if (!src) {
      setBgImage(null);
      setBgVideo(null);
      setBgEmbed(null);
      return;
    }
    if (isYoutubeEmbed(src)) {
      setBgEmbed(src);
      setBgImage(null);
      setBgVideo(null);
    } else if (isVideoFile(src)) {
      setBgVideo(src);
      setBgImage(null);
      setBgEmbed(null);
    } else {
      setBgImage(src);
      setBgVideo(null);
      setBgEmbed(null);
    }
  };
  const fetchData = async () => {
    try {
      const r = await fetch("/api/data?tenant=" + encodeURIComponent(tenant));
      const d = await r.json();
      const ss = d.shortcuts || [];
      const ls = JSON.parse(
        localStorage.getItem("local_shortcuts") || "[]"
      ).map((s) => ({
        ...s,
        isLocal: true,
        child_label: (s.child_label || "").includes("Personal")
          ? s.child_label
          : s.child_label
          ? s.child_label + ", Personal"
          : "Personal",
      }));
      const deletedIds = JSON.parse(
        localStorage.getItem("deleted_shortcuts") || "[]"
      );
      const lsIds = new Set(ls.map((s) => s.id));
      const filteredServer = ss.filter(
        (s) => !deletedIds.includes(s.id) && !lsIds.has(s.id)
      );
      setShortcuts([...filteredServer, ...ls]);
      setLabelColors(d.labelColors || {});
      const c = d.appConfig || {};
      const serverVer = Number(c.config_version || 0);
      const localVer = Number(localStorage.getItem("config_version") || 0);

      const srvUtc = c.utc_offset != null ? Number(c.utc_offset) : 7;
      setUtcOffset(srvUtc);

      if (serverVer > localVer) {
        localStorage.removeItem("custom_bg");
        localStorage.removeItem("custom_text_light");
        localStorage.removeItem("custom_text_dark");
        localStorage.removeItem("overlayOpacity");
        localStorage.removeItem("darkMode");
        localStorage.setItem("config_version", serverVer);
        applyBackgroundSource(c.default_background || null, true);
        setLightTextColor(c.text_color_light || DEFAULT_LIGHT_TEXT);
        setDarkTextColor(c.text_color_dark || DEFAULT_DARK_TEXT);
        const srvOpacity =
          c.overlay_opacity != null ? Number(c.overlay_opacity) : 0.5;
        setOverlayOpacity(isNaN(srvOpacity) ? 0.5 : srvOpacity);
        const srvDark =
          c.dark_mode_default === "1" || c.dark_mode_default === "true";
        setDarkMode(srvDark);
      } else {
        setServerBg(c.default_background || null);
        const localBg = localStorage.getItem("custom_bg");
        const activeBg = localBg || c.default_background || null;
        applyBackgroundSource(activeBg, false);
        setLightTextColor(
          localStorage.getItem("custom_text_light") ||
            c.text_color_light ||
            DEFAULT_LIGHT_TEXT
        );
        setDarkTextColor(
          localStorage.getItem("custom_text_dark") ||
            c.text_color_dark ||
            DEFAULT_DARK_TEXT
        );
        const localOpStr = localStorage.getItem("overlayOpacity");
        if (localOpStr != null) {
          const op = Number(localOpStr);
          setOverlayOpacity(isNaN(op) ? 0.5 : op);
        } else if (c.overlay_opacity != null) {
          const op = Number(c.overlay_opacity);
          setOverlayOpacity(isNaN(op) ? 0.5 : op);
        } else {
          setOverlayOpacity(0.5);
        }
        const localDarkStr = localStorage.getItem("darkMode");
        if (localDarkStr != null) setDarkMode(localDarkStr === "true");
        else {
          const srvDark =
            c.dark_mode_default === "1" || c.dark_mode_default === "true";
          setDarkMode(srvDark);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [tenant]);

  const saveConfig = async (k, v) => {
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [k]: v }),
      });
    } catch {}
  };
  const handleTextColorChange = (m, c) => {
    if (m === "light") {
      setLightTextColor(c);
      localStorage.setItem("custom_text_light", c);
      if (isAdmin) saveConfig("text_color_light", c);
    } else {
      setDarkTextColor(c);
      localStorage.setItem("custom_text_dark", c);
      if (isAdmin) saveConfig("text_color_dark", c);
    }
  };
  const handleBgUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const b = ev.target.result;
      const isVideo = f.type.startsWith("video/");
      const proceed = () => {
        setConfirmState({ isOpen: false }); // Close first
        if (isVideo) {
          setBgVideo(b);
          setBgImage(null);
          setBgEmbed(null);
        } else {
          setBgImage(b);
          setBgVideo(null);
          setBgEmbed(null);
        }
        if (isAdmin) {
          saveConfig("default_background", b);
          alert(t("saved_to_server"));
        } else {
          localStorage.setItem("custom_bg", b);
        }
      };

      if (isAdmin) {
        setConfirmState({
          isOpen: true,
          message: t("confirm_save_server_bg"),
          onConfirm: proceed,
          onCancel: () => {
            if (isVideo) {
              setBgVideo(b);
              setBgImage(null);
              setBgEmbed(null);
            } else {
              setBgImage(b);
              setBgVideo(null);
              setBgEmbed(null);
            }
            localStorage.setItem("custom_bg", b);
            setConfirmState({ isOpen: false });
          },
        });
      } else {
        if (isVideo) {
          setBgVideo(b);
          setBgImage(null);
          setBgEmbed(null);
        } else {
          setBgImage(b);
          setBgVideo(null);
          setBgEmbed(null);
        }
        localStorage.setItem("custom_bg", b);
      }
    };
    r.readAsDataURL(f);
  };

  const applyBgUrl = () => {
    const url = normalizeYoutube(bgUrlInput.trim());
    if (!url) return;

    const proceed = () => {
      setConfirmState({ isOpen: false }); // Close first
      applyBackgroundSource(url);
      if (isAdmin) {
        saveConfig("default_background", url);
        alert(t("saved_to_server"));
      } else {
        localStorage.setItem("custom_bg", url);
      }
    };

    if (isAdmin) {
      setConfirmState({
        isOpen: true,
        message: t("confirm_save_server_bg"),
        onConfirm: proceed,
        onCancel: () => {
          applyBackgroundSource(url);
          localStorage.setItem("custom_bg", url);
          setConfirmState({ isOpen: false });
        },
      });
    } else {
      applyBackgroundSource(url);
      localStorage.setItem("custom_bg", url);
    }
  };

  const handleResetBg = () => {
    localStorage.removeItem("custom_bg");
    applyBackgroundSource(serverBg);
    alert(t("bg_reset"));
  };

  const handleClearMedia = async () => {
    setConfirmState({
      isOpen: true,
      message: t("confirm_clear_media"),
      onConfirm: async () => {
        setConfirmState({ isOpen: false }); // Close first
        localStorage.removeItem("custom_bg");
        setBgImage(null);
        setBgVideo(null);
        setBgEmbed(null);
        if (isAdmin) {
          try {
            await saveConfig("default_background", "");
            alert(t("server_and_local_bg_cleared"));
          } catch {
            alert(t("error_clearing_server_bg"));
          }
        } else {
          alert(t("local_bg_cleared"));
        }
      },
    });
  };

  const handleForceSync = async () => {
    if (!isAdmin) return;
    setConfirmState({
      isOpen: true,
      message: t("confirm_force_sync"),
      onConfirm: async () => {
        setConfirmState({ isOpen: false }); // Close first
        try {
          const p = {
            text_color_light: lightTextColor,
            text_color_dark: darkTextColor,
            overlay_opacity: overlayOpacity,
            dark_mode_default: darkMode ? "1" : "0",
            utc_offset: utcOffset,
          };
          const currentBg = bgEmbed || bgVideo || bgImage;
          if (currentBg) p.default_background = currentBg;

          const r = await fetch("/api/config/force", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });
          const d = await r.json();
          if (d.success) {
            if (d.version) localStorage.setItem("config_version", d.version);
            let serverList = shortcuts.filter((s) => !s.isLocal);
            if (clientOrder.length) {
              const idxMap = new Map(clientOrder.map((id, i) => [id, i]));
              serverList = [...serverList].sort((a, b) => {
                const ia = idxMap.has(a.id) ? idxMap.get(a.id) : Infinity;
                const ib = idxMap.has(b.id) ? idxMap.get(b.id) : Infinity;
                if (ia !== ib) return ia - ib;
                return (
                  b.favorite - a.favorite ||
                  (sortBy === "alpha" ? a.name.localeCompare(b.name) : 0)
                );
              });
            } else {
              serverList = [...serverList].sort(
                (a, b) =>
                  b.favorite - a.favorite ||
                  (sortBy === "alpha" ? a.name.localeCompare(b.name) : 0)
              );
            }
            const order = serverList.map((s) => s.id);
            await fetch("/api/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tenant, order }),
            });
            alert(t("sync_successful"));
            fetchData();
          } else alert(t("error") + ": " + d.error);
        } catch {
          alert(t("error_sync"));
        }
      },
    });
  };

  const handleSaveSettings = async (newConfig) => {
    try {
      if (newConfig.utcOffset !== undefined) {
        localStorage.setItem("utc_offset", newConfig.utcOffset);
        setUtcOffset(newConfig.utcOffset);
        if (isAdmin) saveConfig("utc_offset", newConfig.utcOffset);
      }
      alert(t("settings_saved"));
      setShowSettingsModal(false);
    } catch (err) {
      alert(t("error_saving_settings"));
    }
  };

  const handleSearchImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSearchFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setSearchPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle paste event for image search
  const handleSearchPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setSearchFile(file);
          const reader = new FileReader();
          reader.onload = (ev) => setSearchPreview(ev.target.result);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSearchFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setSearchPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSearchSubmit = async () => {
    if (searchFile || searchPreview) {
      // Upload image to server, get public URL, open Google Lens with URL
      try {
        // Show loading toast
        const loadingToast = document.createElement("div");
        loadingToast.textContent = "🔍 " + (t("searching") || "Searching...");
        loadingToast.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(loadingToast);

        // Compression Helper
        const compressImage = (dataUrl, maxWidth = 800, quality = 0.7) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              let width = img.width;
              let height = img.height;

              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", quality));
            };
          });
        };

        const compressedImage = await compressImage(searchPreview);

        // Upload image to server
        const response = await fetch("/api/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedImage }),
        });

        const data = await response.json();

        if (!data.success || !data.url) {
          throw new Error(data.error || "Upload failed");
        }

        // Build full public URL
        const publicUrl = window.location.origin + data.url;

        // Open Google Lens with the image URL
        window.open(
          `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(
            publicUrl
          )}`,
          "_blank"
        );

        // Remove loading toast
        document.body.removeChild(loadingToast);

        // Clear the search image
        setSearchFile(null);
        setSearchPreview(null);
        if (searchFileInputRef.current) searchFileInputRef.current.value = "";
      } catch (err) {
        console.error("Image search failed:", err);
        // Fallback to clipboard approach
        try {
          if (searchFile) {
            await navigator.clipboard.write([
              new ClipboardItem({
                [searchFile.type]: searchFile,
              }),
            ]);
          }
          window.open("https://lens.google.com/", "_blank");

          const hint =
            t("image_copied_hint") ||
            "Image copied! Press Ctrl+V → Enter in the new tab.";

          const toast = document.createElement("div");
          toast.textContent = "📋 " + hint;
          toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `;
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s";
            setTimeout(() => document.body.removeChild(toast), 300);
          }, 4000);

          setSearchFile(null);
          setSearchPreview(null);
          if (searchFileInputRef.current) searchFileInputRef.current.value = "";
        } catch (clipErr) {
          alert(
            t("error_copy_image") || "Could not search image. Please try again."
          );
        }
      }
    } else if (searchTerm.trim()) {
      window.open(
        "https://www.google.com/search?q=" + encodeURIComponent(searchTerm),
        "_blank"
      );
    }
  };

  const clearSearchImage = (e) => {
    e.stopPropagation();
    setSearchFile(null);
    setSearchPreview(null);
    if (searchFileInputRef.current) searchFileInputRef.current.value = "";
  };

  const fetchInsights = async () => {
    try {
      const r = await fetch("/api/insights");
      const insightsResult = await r.json();

      // Also fetch image search logs for admin
      if (isAdmin) {
        try {
          const logsRes = await fetch("/api/image-search/logs");
          const logsData = await logsRes.json();
          insightsResult.imageSearchLogs = logsData.logs || [];
        } catch {
          insightsResult.imageSearchLogs = [];
        }
      }

      setInsightsData(insightsResult);
      setShowInsightsModal(true);
    } catch {
      alert(t("error_insights"));
    }
  };
  const handleExportStats = () => {
    window.open("/api/insights/export", "_blank");
  };
  const handleExportSummary = () => {
    window.open("/api/insights/export/summary", "_blank");
  };

  const resetForm = () =>
    setFormData({
      id: null,
      name: "",
      url: "",
      icon_url: "",
      parent_label: "",
      parent_color: COLOR_PRESETS[0],
      child_label: "",
      child_color: COLOR_PRESETS[1],
      isLocal: false,
    });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim())
      return alert(t("error_server")); // Using generic error for simplicity or add specific key

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

    // 3. Determine Local Status First
    const isTargetLocal = !isAdmin || formData.isLocal;

    // 2. Optimistic Update
    const previousShortcuts = [...shortcuts];
    const tempId = isEdit ? formData.id : Date.now(); // Temp ID for new item
    const optimisticItem = {
      ...payload,
      id: tempId,
      isLocal: isTargetLocal,
      clicks: isEdit
        ? shortcuts.find((s) => s.id === formData.id)?.clicks || 0
        : 0,
      favorite: isEdit
        ? shortcuts.find((s) => s.id === formData.id)?.favorite || 0
        : 0,
    };

    // Update Local State Immediately
    if (isEdit) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === formData.id ? optimisticItem : s))
      );
    } else {
      setShortcuts((prev) => [optimisticItem, ...prev]);
    }

    // Close Modal Immediately
    setShowAddModal(false);
    resetForm();

    // 3. Background Sync
    try {
      if (isTargetLocal) {
        // Local Storage Sync
        const l = JSON.parse(localStorage.getItem("local_shortcuts") || "[]");
        let nl;
        if (isEdit && formData.isLocal) {
          nl = l.map((s) => (s.id === formData.id ? optimisticItem : s));
        } else {
          nl = [optimisticItem, ...l];
        }
        localStorage.setItem("local_shortcuts", JSON.stringify(nl));
        // No fetch needed for local, just update state (already done)
      } else {
        // Server Sync
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `/api/shortcuts/${formData.id}` : "/api/shortcuts";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
      alert(t("error_saving_data") + ": " + err.message);
    }
  };
  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      message: t("confirm_delete"),
      onConfirm: async () => {
        setConfirmState({ isOpen: false }); // Close first

        // 1. Optimistic Update
        const previousShortcuts = [...shortcuts];
        setShortcuts((prev) => prev.filter((s) => s.id !== id));

        try {
          const t = previousShortcuts.find((s) => s.id === id);
          if (t && t.isLocal) {
            // Local Sync
            const l = JSON.parse(
              localStorage.getItem("local_shortcuts") || "[]"
            );
            localStorage.setItem(
              "local_shortcuts",
              JSON.stringify(l.filter((s) => s.id !== id))
            );
          }

          if (isAdmin) {
            if (!t || !t.isLocal) {
              // Server Sync
              const res = await fetch(`/api/shortcuts/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) throw new Error("Delete failed");
            }
          } else {
            // Non-admin: mark as deleted locally
            const del = JSON.parse(
              localStorage.getItem("deleted_shortcuts") || "[]"
            );
            if (!del.includes(id)) {
              del.push(id);
              localStorage.setItem("deleted_shortcuts", JSON.stringify(del));
            }
          }
        } catch (err) {
          // Rollback
          setShortcuts(previousShortcuts);
          alert(t("error_deleting") + ": " + err.message);
        }
      },
    });
  };
  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    // 1. Optimistic Update
    const previousShortcuts = [...shortcuts];
    setShortcuts((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s
      )
    );

    try {
      // 2. Local Storage Sync (for local items)
      const t = shortcuts.find((s) => s.id === id);
      if (t && t.isLocal) {
        const l = JSON.parse(localStorage.getItem("local_shortcuts") || "[]");
        localStorage.setItem(
          "local_shortcuts",
          JSON.stringify(
            l.map((s) =>
              s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s
            )
          )
        );
        return; // Local update done
      }

      // 3. Server Sync
      const res = await fetch(`/api/favorite/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync");

      // Success: Do nothing, UI is already correct.
    } catch (err) {
      // 4. Rollback on Error
      setShortcuts(previousShortcuts);
      alert(t("error_syncing_favorite") + ": " + err.message);
    }
  };
  const handleLinkClick = (id, u) => {
    const t = shortcuts.find((s) => s.id === id);
    if (!t?.isLocal) fetch(`/api/click/${id}`, { method: "POST" });
    window.open(u, "_blank");
  };
  const handleEdit = (i, e) => {
    e.stopPropagation();
    setFormData({ ...i, icon_url: i.icon_url || "" });
    setShowAddModal(true);
  };
  const handleLogin = (e) => {
    e.preventDefault();
    if (
      loginCreds.username === "admin" &&
      loginCreds.password === "miniappadmin"
    ) {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else setLoginError(t("invalid_credentials"));
  };
  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) =>
        setFormData((p) => ({ ...p, icon_url: ev.target.result }));
      r.readAsDataURL(f);
    }
  };
  const handleExportData = () => {
    const d =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify({
          version: 2,
          timestamp: new Date().toISOString(),
          shortcuts: shortcuts.filter((s) => !s.isLocal),
          labels: labelColors,
        })
      );
    const a = document.createElement("a");
    a.href = d;
    a.download = "backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const handleImportData = (e) => {
    const f = e.target.files[0];
    if (f) {
      const r = new FileReader();
      r.onload = async (ev) => {
        await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(JSON.parse(ev.target.result)),
        });
        alert(t("import_successful"));
        fetchData();
      };
      r.readAsText(f);
    }
  };
  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    const iconEl = e.currentTarget.querySelector("[data-icon]");
    if (iconEl && e.dataTransfer.setDragImage) {
      const rect = iconEl.getBoundingClientRect();
      const clone = iconEl.cloneNode(true);
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.borderRadius = "16px";
      clone.style.overflow = "hidden";
      clone.style.position = "absolute";
      clone.style.top = "-1000px";
      clone.style.left = "-1000px";
      clone.style.zIndex = "9999";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    setClientOrder((prev) => {
      const baseIds = filteredShortcuts.map((s) => s.id);
      let current =
        prev && prev.length
          ? prev.filter((id) => baseIds.includes(id))
          : baseIds.slice();
      baseIds.forEach((id) => {
        if (!current.includes(id)) current.push(id);
      });
      const from = current.indexOf(draggingId);
      const to = current.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      const next = current.slice();
      next.splice(from, 1);
      next.splice(to, 0, draggingId);
      localStorage.setItem("shortcut_order_" + tenant, JSON.stringify(next));
      return next;
    });
    setDraggingId(null);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const uniqueParents = useMemo(
    () =>
      [...new Set(shortcuts.map((s) => s.parent_label).filter(Boolean))].sort(),
    [shortcuts]
  );
  const uniqueChildren = useMemo(
    () =>
      [
        ...new Set(
          shortcuts.flatMap((s) =>
            (s.child_label || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        ),
      ].sort(),
    [shortcuts]
  );

  // FIX: Sorting Logic now prioritizes explicit SortBy unless it is 'default'
  const filteredShortcuts = useMemo(() => {
    let r = shortcuts.filter((i) => {
      const t = debouncedSearchTerm.trim().toLowerCase(),
        m =
          (!t || i.name.toLowerCase().includes(t)) &&
          (!activeParentFilter || i.parent_label === activeParentFilter);
      if (!m) return false;
      if (activeChildFilter) {
        const tags = (i.child_label || "").split(",").map((s) => s.trim());
        if (!tags.includes(activeChildFilter)) return false;
      }
      return true;
    });

    // First, always apply alpha or favorite sort as base
    r.sort((a, b) => b.favorite - a.favorite || a.name.localeCompare(b.name));

    // If we are in default mode (list), we TRY to use custom order
    if (sortBy === "default" && clientOrder.length) {
      const idxMap = new Map(clientOrder.map((id, i) => [id, i]));
      return [...r].sort((a, b) => {
        const ia = idxMap.has(a.id) ? idxMap.get(a.id) : 999999;
        const ib = idxMap.has(b.id) ? idxMap.get(b.id) : 999999;
        // If both have custom order, use it. If not, fall back to comparison.
        // Note: idx default is high so new items go to end
        if (ia !== ib) return ia - ib;
        return 0;
      });
    } else if (sortBy === "alpha") {
      // Explicit Alpha Sort
      return [...r].sort((a, b) => a.name.localeCompare(b.name));
    }

    return r; // Fallback
  }, [
    shortcuts,
    debouncedSearchTerm,
    activeParentFilter,
    activeChildFilter,
    sortBy,
    clientOrder,
  ]);

  useEffect(() => {
    const calcItemsPerPage = () => {
      if (!gridWrapperRef.current || !gridRef.current) return;
      const style = getComputedStyle(gridRef.current);
      const colCount = style.gridTemplateColumns.split(" ").length || 1;
      const cardEl = gridRef.current.querySelector("[data-card]");
      const cardHeight = cardEl ? cardEl.getBoundingClientRect().height : 140;
      const wrapperRect = gridWrapperRef.current.getBoundingClientRect();
      // Reduced buffer for launchpad to fill gap (pagination is compact at bottom)
      const bottomBuffer = viewMode === "launchpad" ? 60 : 80;
      const availableHeight =
        window.innerHeight - wrapperRect.top - bottomBuffer;
      const gap = 16; // gap-4 is 1rem = 16px
      const rows = Math.max(
        1,
        Math.floor((availableHeight + gap) / (cardHeight + gap))
      );
      const cols = colCount; // from style above

      setColCount(cols);
      setItemsPerPage(Math.max(cols * rows, cols));
    };
    calcItemsPerPage();
    window.addEventListener("resize", calcItemsPerPage);
    return () => window.removeEventListener("resize", calcItemsPerPage);
  }, [
    filteredShortcuts.length,
    darkMode,
    bgImage,
    bgVideo,
    bgEmbed,
    isGrouped,
    showFilterPanel,
    viewMode,
  ]);

  const partitionedPages = useMemo(() => {
    if (!itemsPerPage) return [];

    // Default / Ungrouped behavior
    if (!isGrouped) {
      const pages = [];
      for (let i = 0; i < filteredShortcuts.length; i += itemsPerPage) {
        pages.push(filteredShortcuts.slice(i, i + itemsPerPage));
      }
      return pages.length ? pages : [[]];
    }

    // Grouped Behavior
    const groups = {};
    const uncategorizedKey = t("uncategorized") || "Other";

    filteredShortcuts.forEach((item) => {
      const key = item.parent_label || uncategorizedKey;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === uncategorizedKey) return 1;
      if (b === uncategorizedKey) return -1;
      return a.localeCompare(b);
    });

    const pages = [];
    const MAX_CAPACITY = itemsPerPage;
    const GROUP_OVERHEAD = colCount;

    let currentCapacity = 0;
    let currentPageBucket = [];

    const commitPage = () => {
      if (currentPageBucket.length) pages.push(currentPageBucket);
      currentPageBucket = [];
      currentCapacity = 0;
    };

    sortedKeys.forEach((key) => {
      let groupItems = [...groups[key]];
      // Flag to track if we have already paid the overhead for this group on the *current* page
      // Actually, since we process groupItems in a loop, each iteration is a "chunk" or "whole".
      // We only pay overhead once per page for a group.

      // If the entire group fits on a fresh page AND it doesn't fit on the current partial page,
      // we should prefer to push it to the fresh page.

      const totalCostIfFresh = GROUP_OVERHEAD + groupItems.length;

      // Check if we should push to next page immediately
      if (currentCapacity > 0) {
        const fitsCurrent = currentCapacity + totalCostIfFresh <= MAX_CAPACITY;
        const fitsFresh = totalCostIfFresh <= MAX_CAPACITY;

        // If it doesn't fit current, but FITS a fresh page, push it.
        if (!fitsCurrent && fitsFresh) {
          commitPage();
        }
        // If it doesn't fit EITHER (huge group), or fits BOTH, or fits Current, we proceed to fill logic.
      }

      while (groupItems.length > 0) {
        // Try to fit on current page
        // Overhead is required if we are starting a block for this group on this page.
        // (In this loop, we always correspond to a block).

        const slotsRemaining = MAX_CAPACITY - currentCapacity;

        // Do we have space for even the header?
        if (slotsRemaining < GROUP_OVERHEAD + 1) {
          // Require at least 1 item + header
          commitPage();
          continue;
        }

        // We have space for header + at least 1 item.
        // Pay tax
        const availableForItems = slotsRemaining - GROUP_OVERHEAD;

        // Take what we can
        const countToTake = Math.min(groupItems.length, availableForItems);

        const chunk = groupItems.splice(0, countToTake);
        currentPageBucket.push(...chunk);
        currentCapacity += GROUP_OVERHEAD + chunk.length;

        if (currentCapacity >= MAX_CAPACITY) {
          commitPage();
        }
      }
    });

    commitPage();
    return pages.length ? pages : [[]];
  }, [filteredShortcuts, itemsPerPage, isGrouped, t, colCount]);

  const totalPages = Math.max(1, partitionedPages.length);

  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(totalPages - 1);
  }, [totalPages, currentPage]);

  const pagedShortcuts = partitionedPages[currentPage] || [];
  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 0));
  const bgClass = darkMode ? "bg-gray-900" : "bg-[#F4F4F4]",
    currentTextColor = darkMode ? darkTextColor : lightTextColor;
  const cardClass = darkMode
    ? "bg-gray-800 border-gray-700 hover:border-blue-500"
    : "bg-white border-[#D8D8D8] hover:border-[#009FB8]";
  const inputClass = darkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-[#D8D8D8]",
    modalClass = darkMode
      ? "bg-gray-900 border-gray-700"
      : "bg-white border-[#D8D8D8]";
  const isLastPage = currentPage === totalPages - 1;
  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass}`}
      >
        <span className="loader"></span>
      </div>
    );

  // New Pagination Helpers
  const maxDots = 6;
  let dotStart = 0;
  if (totalPages > maxDots) {
    if (currentPage < 3) dotStart = 0;
    else if (currentPage > totalPages - 4) dotStart = totalPages - maxDots;
    else dotStart = currentPage - 2;
  }
  const visibleDots = Array.from({ length: Math.min(totalPages, maxDots) }).map(
    (_, i) => dotStart + i
  );

  return (
    <div
      className={`min-h-screen font-light transition-all duration-300 bg-cover bg-center bg-no-repeat bg-fixed ${bgClass}`}
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : "none",
        color: currentTextColor,
      }}
    >
      {/* Global Drag Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            // Avoid flickering when going over children by checking relatedTarget (mostly works)
            // Or just simple close.
            if (e.currentTarget.contains(e.relatedTarget)) return;
            setIsDragging(false);
          }}
          onDrop={handleGlobalDrop}
        >
          <div className="w-4/5 h-4/5 border-4 border-dashed border-white/30 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white/5 pointer-events-none">
            <div className="bg-white/10 p-8 rounded-full animate-bounce">
              <Camera size={64} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-wide">
              {t("drop_to_search") || "Drop Image to Search"}
            </h2>
          </div>
        </div>
      )}

      {bgVideo && (
        <video
          className="fixed inset-0 w-full h-full object-cover -z-10"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {bgEmbed && (
        <iframe
          className="fixed inset-0 w-full h-full -z-20 pointer-events-none"
          src={
            bgEmbed +
            (bgEmbed.includes("?") ? "&" : "?") +
            "autoplay=1&mute=1&loop=1&controls=0&playsinline=1" +
            (bgEmbed.match(/\/embed\/([^?]+)/)
              ? "&playlist=" + bgEmbed.match(/\/embed\/([^?]+)/)[1]
              : "")
          }
          title="Background"
          frameBorder="0"
          allow="autoplay; fullscreen"
        />
      )}
      <div
        className="min-h-screen w-full transition-colors duration-300"
        style={{
          backgroundColor:
            bgImage || bgVideo || bgEmbed
              ? darkMode
                ? `rgba(0,0,0,${overlayOpacity})`
                : `rgba(255,255,255,${overlayOpacity})`
              : "",
        }}
      >
        <div className="sticky top-0 z-30 w-full flex flex-col pt-4 px-4 gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between gap-3 relative">
            {/* CLOCK DESKTOP: Hidden on mobile/tablet */}
            <div className="hidden lg:block min-w-[120px]">
              {viewMode !== "launchpad" && (
                <React.Suspense
                  fallback={
                    <div className="h-8 w-24 bg-gray-200/20 rounded animate-pulse" />
                  }
                >
                  <Clock utcOffset={utcOffset} />
                </React.Suspense>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 max-w-2xl">
              <div
                className={`relative group/search transition-all flex items-center bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 focus-within:!bg-white dark:focus-within:!bg-gray-800 rounded-full border shadow-sm overflow-hidden ${"w-2/3 max-w-lg h-10 shadow-md"}`}
                style={{ borderColor: darkMode ? "#374151" : "#D8D8D8" }}
              >
                <button
                  onClick={handleSearchSubmit}
                  className={`pl-3 pr-2 h-full opacity-50 hover:opacity-100 hover:text-[#009FB8] transition-colors cursor-pointer z-10`}
                >
                  <Search size={18} />
                </button>

                {searchPreview && (
                  <div className="flex items-center gap-1 pl-1">
                    <div className="relative group/preview">
                      <img
                        src={searchPreview}
                        className="h-6 w-6 rounded object-cover border"
                      />
                      <button
                        onClick={clearSearchImage}
                        className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 opacity-0 group-hover/preview:opacity-100 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  className={`block w-full px-2 py-2 text-sm focus:outline-none bg-transparent ${
                    bgImage || bgVideo || bgEmbed
                      ? "bg-opacity-60 backdrop-blur-md"
                      : ""
                  }`}
                  style={{ color: currentTextColor }}
                  placeholder={
                    searchPreview
                      ? "Google Image Search..."
                      : t("search_placeholder")
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  onPaste={handleSearchPaste}
                />

                {/* Image Upload Trigger */}
                <div
                  className={`pr-1 opacity-0 group-hover/search:opacity-100 transition-opacity flex items-center ${
                    searchPreview ? "opacity-100" : ""
                  }`}
                >
                  <button
                    onClick={() => searchFileInputRef.current?.click()}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    title="Search by Image"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    type="file"
                    ref={searchFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleSearchImageSelect}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div
                  className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    showMenu
                      ? "max-w-[500px] opacity-100 mr-2"
                      : "max-w-0 opacity-0 mr-0"
                  }`}
                >
                  {/* Mode Toggle Button */}
                  <button
                    onClick={() =>
                      setViewMode(
                        viewMode === "default" ? "launchpad" : "default"
                      )
                    }
                    className={`p-2 rounded-full shadow-sm border transition-colors ${
                      viewMode === "launchpad"
                        ? "bg-white dark:bg-gray-800 text-blue-500 border-blue-500/50"
                        : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80"
                    } ${
                      bgImage || bgVideo || bgEmbed ? "backdrop-blur-sm" : ""
                    }`}
                    title={
                      viewMode === "default"
                        ? "Switch to Launchpad Mode"
                        : "Switch to Default Mode"
                    }
                  >
                    {viewMode === "default" ? (
                      <Grip size={18} />
                    ) : (
                      <LayoutGrid size={18} />
                    )}
                  </button>

                  <React.Suspense
                    fallback={
                      <div className="w-9 h-9 bg-gray-200/50 rounded-full" />
                    }
                  >
                    <button
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                      className={`p-2 rounded-full shadow-sm border transition-colors ${
                        showFilterPanel
                          ? "bg-white dark:bg-gray-800 text-blue-500 border-blue-500/50"
                          : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80"
                      } ${
                        bgImage || bgVideo || bgEmbed ? "backdrop-blur-sm" : ""
                      }`}
                    >
                      <Filter size={18} />
                    </button>
                  </React.Suspense>
                  <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm">
                    <button
                      onClick={() => {
                        const newMode =
                          viewMode === "default" ? "launchpad" : "default";
                        setViewMode(newMode);
                        localStorage.setItem("viewMode", newMode);
                      }}
                      className={`p-1.5 rounded-full text-xs transition-all ${
                        viewMode === "launchpad"
                          ? "bg-white dark:bg-gray-700 shadow text-[#009FB8]"
                          : "opacity-50"
                      }`}
                      title={
                        viewMode === "default"
                          ? "Switch to Launchpad Mode"
                          : "Switch to Default Mode"
                      }
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <div className="w-px h-3 bg-gray-400/50 mx-0.5" />
                    <button
                      onClick={() => setIsGrouped(!isGrouped)}
                      className={`p-1.5 rounded-full text-xs transition-all ${
                        isGrouped
                          ? "bg-white dark:bg-gray-700 shadow text-[#009FB8]"
                          : "opacity-50"
                      }`}
                      title={t("group_by_tag") || "Group by Tag"}
                    >
                      <Layers size={14} />
                    </button>
                    <div className="w-px h-3 bg-gray-400/50 mx-0.5" />
                    <button
                      onClick={() => setSortBy("default")}
                      className={`p-1.5 rounded-full text-xs ${
                        sortBy === "default"
                          ? "bg-white dark:bg-gray-700 shadow"
                          : "opacity-50"
                      }`}
                    >
                      <List size={14} />
                    </button>
                    <button
                      onClick={() => setSortBy("alpha")}
                      className={`p-1.5 rounded-full text-xs ${
                        sortBy === "alpha"
                          ? "bg-white dark:bg-gray-700 shadow"
                          : "opacity-50"
                      }`}
                    >
                      Aa
                    </button>
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-full shadow-sm border transition-all duration-300 ${
                    showMenu
                      ? "bg-white dark:bg-gray-800 text-blue-500 border-blue-500/50"
                      : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80"
                  } ${bgImage || bgVideo || bgEmbed ? "backdrop-blur-sm" : ""}`}
                >
                  <ChevronLeft
                    size={18}
                    className={`transition-transform duration-300 ${
                      showMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Spacer for potential right-side elements or keeping it centered */}
            <div className="hidden sm:block min-w-[120px]"></div>
          </div>

          {/* CLOCK MOBILE/TABLET: Below search bar on narrow screens */}
          {viewMode !== "launchpad" && (
            <div className="lg:hidden w-full flex justify-center mt-1">
              <React.Suspense fallback={null}>
                <Clock utcOffset={utcOffset} className="text-sm opacity-80" />
              </React.Suspense>
            </div>
          )}

          {/* PAGINATION & CLOCK MOBILE */}

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
        <div
          ref={gridWrapperRef}
          className="max-w-7xl mx-auto px-6 pb-48 pt-8 min-h-[60vh] outline-none"
          style={{ overflow: "hidden" }}
          onWheel={(e) => {
            e.preventDefault();
            if (e.deltaY > 0 || e.deltaX > 0) goNext();
            else goPrev();
          }}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchMove={(e) => e.preventDefault()}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const d = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(d) > 50) {
              if (d < 0) goNext();
              else goPrev();
            }
            setTouchStartX(null);
          }}
        >
          {!isGrouped ? (
            <div
              ref={gridRef}
              className={`grid gap-4 justify-items-center ${
                viewMode === "launchpad"
                  ? "grid-cols-4 md:grid-cols-5 lg:grid-cols-7"
                  : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
              }`}
            >
              {pagedShortcuts.map((i) => (
                <React.Suspense
                  key={i.id}
                  fallback={
                    <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  }
                >
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
                    bgOverlay={bgImage || bgVideo || bgEmbed}
                    draggingId={draggingId}
                    darkMode={darkMode}
                    getContrastYIQ={getContrastYIQ}
                    viewMode={viewMode}
                  />
                </React.Suspense>
              ))}
              {isLastPage && (
                <div
                  className="flex flex-col items-center w-full max-w-[100px] cursor-pointer group"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-2 backdrop-blur-sm bg-white/10 dark:bg-black/10 hover:bg-emerald-500/10`}
                  >
                    <Plus size={24} className="opacity-50 font-light" />
                  </div>
                  <span className="text-xs font-light opacity-50">
                    {t("add_app")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* When grouped, we still use the pagedShortcuts to maintain pagination performance, OR we could show all. 
                    However, pagination logic is based on items. Let's group the CURRENT PAGE items. 
                    If the user wants to group ALL, they should disable pagination? 
                    For now, grouping typicaly applies to the view. We will group the *paged* items.
                */}
              {(() => {
                const groups = pagedShortcuts.reduce((acc, item) => {
                  const key =
                    item.parent_label || t("uncategorized") || "Other";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                }, {});

                // Sort groups
                const sortedKeys = Object.keys(groups).sort((a, b) => {
                  if (a === (t("uncategorized") || "Other")) return 1;
                  if (b === (t("uncategorized") || "Other")) return -1;
                  return a.localeCompare(b);
                });

                return sortedKeys.map((groupName, gIdx) => {
                  const baseColor =
                    labelColors[groupName] ||
                    (darkMode ? "#ffffff" : "#000000");
                  const bgWithOpacity = baseColor + "1A"; // 10% opacity
                  const items = groups[groupName];

                  return (
                    <div
                      key={groupName}
                      className="relative rounded-3xl p-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
                      style={{
                        backgroundColor: bgWithOpacity,
                        border: `1px solid ${baseColor}30`,
                      }}
                    >
                      <div
                        className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md"
                        style={{
                          backgroundColor: baseColor,
                          color: getContrastYIQ(baseColor),
                        }}
                      >
                        {groupName}
                      </div>

                      <div
                        ref={gIdx === 0 ? gridRef : null}
                        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-4 justify-items-center mt-2"
                      >
                        {items.map((i) => (
                          <React.Suspense
                            key={i.id}
                            fallback={
                              <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            }
                          >
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
                              bgOverlay={bgImage || bgVideo || bgEmbed}
                              draggingId={draggingId}
                              darkMode={darkMode}
                              getContrastYIQ={getContrastYIQ}
                            />
                          </React.Suspense>
                        ))}
                        {isLastPage && gIdx === sortedKeys.length - 1 && (
                          <div
                            className="flex flex-col items-center w-full max-w-[100px] cursor-pointer group"
                            onClick={() => {
                              resetForm();
                              setShowAddModal(true);
                            }}
                          >
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-2 backdrop-blur-sm bg-white/10 dark:bg-black/10 hover:bg-emerald-500/10`}
                            >
                              <Plus
                                size={24}
                                className="opacity-50 font-light"
                              />
                            </div>
                            <span className="text-xs font-light opacity-50">
                              {t("add_app")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* PAGINATION - Global Fixed Position */}
        {totalPages > 1 && (
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 pt-10 bg-gradient-to-t from-transparent to-transparent">
            <div className="pointer-events-auto">
              <div
                className={`flex items-center gap-3 px-3 py-1.5 rounded-full transition-all ${
                  viewMode === "launchpad" ? "transform scale-110" : ""
                }`}
              >
                {totalPages > 6 &&
                  (isEditingPage ? (
                    <input
                      autoFocus
                      className="w-12 bg-transparent border-b border-blue-500 text-center text-[11px] outline-none"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={() => {
                        setIsEditingPage(false);
                        setPageInput("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const p = parseInt(pageInput) - 1;
                          if (!isNaN(p) && p >= 0 && p < totalPages)
                            setCurrentPage(p);
                          setIsEditingPage(false);
                        }
                      }}
                    />
                  ) : (
                    <span
                      className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer font-medium min-w-[60px] text-center"
                      onClick={() => {
                        setIsEditingPage(true);
                        setPageInput(String(currentPage + 1));
                      }}
                      title={t("enter_page_number")}
                    >
                      {t("page")} {currentPage + 1}/{totalPages}
                    </span>
                  ))}
                <div className="flex items-center gap-1.5">
                  {visibleDots.map((i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 border ${
                        i === currentPage
                          ? darkMode
                            ? "bg-white border-white scale-125"
                            : "bg-gray-800 border-gray-800 scale-125"
                          : darkMode
                          ? "bg-white/20 border-white/20 hover:bg-white/40"
                          : "bg-gray-400/40 border-gray-400/40 hover:bg-gray-400/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center group/panel pointer-events-none">
          {/* Trigger Handle - Invisible by default, reveals on hover */}
          <div
            className="pointer-events-auto w-6 h-24 flex items-center justify-end pr-0 cursor-pointer peer transition-all duration-300"
            onClick={() => setShowConfig(!showConfig)}
          >
            <div
              className={`w-1.5 h-16 bg-gray-400/40 opacity-0 group-hover/panel:opacity-100 hover:!bg-gray-400/60 backdrop-blur-[1px] rounded-l-full transition-all duration-300 ${
                showConfig ? "bg-gray-400/60 opacity-100" : ""
              }`}
            />
          </div>

          {/* Config Menu - Reveals on hover of trigger or menu itself OR if functionality toggled */}
          <div
            className={`pointer-events-auto flex flex-col items-center gap-2 p-2 rounded-l-3xl border shadow-lg ${inputClass} bg-opacity-90 backdrop-blur-md transition-all duration-300 translate-x-full opacity-0 peer-hover:translate-x-0 peer-hover:opacity-100 hover:translate-x-0 hover:opacity-100 mr-0 ${
              showConfig ? "!translate-x-0 !opacity-100" : ""
            }`}
          >
            {/* BG Control */}
            {(bgImage || bgVideo || bgEmbed) && (
              <div className="flex flex-col items-center gap-1 bg-black/40 rounded-2xl px-1 py-2 backdrop-blur-sm">
                <span className="text-[9px] text-white/90 font-bold tracking-wider">
                  BG
                </span>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setOverlayOpacity(v);
                    localStorage.setItem("overlayOpacity", v);
                    if (isAdmin) saveConfig("overlay_opacity", v);
                  }}
                  className="h-16 w-1 accent-[#009FB8] cursor-pointer appearance-none -order-1"
                  style={{
                    writingMode: "bt-lr",
                    WebkitAppearance: "slider-vertical",
                  }}
                />
              </div>
            )}

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              {darkMode ? (
                <Sun size={18} className="text-yellow-400" />
              ) : (
                <Moon size={18} className="text-gray-600" />
              )}
            </button>

            <div className="h-px w-4 bg-gray-300 my-1"></div>

            {/* Text Color Picker */}
            <div className="relative z-50">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`color-picker-trigger p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full ${
                  showColorPicker
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-500"
                    : ""
                }`}
                title={t("text_color")}
              >
                <Palette size={16} />
              </button>

              {showColorPicker && (
                <div className="color-picker-popover absolute right-full mr-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 min-w-[120px] flex flex-col gap-2 animate-in fade-in slide-in-from-right-2">
                  <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                    <input
                      type="color"
                      value={lightTextColor}
                      onChange={(e) =>
                        handleTextColorChange("light", e.target.value)
                      }
                      className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden"
                    />
                    <span className="text-[10px] font-medium opacity-70">
                      {t("text_light")}
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                    <input
                      type="color"
                      value={darkTextColor}
                      onChange={(e) =>
                        handleTextColorChange("dark", e.target.value)
                      }
                      className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden"
                    />
                    <span className="text-[10px] font-medium opacity-70">
                      {t("text_dark")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px w-4 bg-gray-300 my-1"></div>

            {/* Media Controls */}
            <button
              onClick={() => bgInputRef.current?.click()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <ImageIcon size={16} />
            </button>
            <input
              type="file"
              ref={bgInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleBgUpload}
            />
            {/* Link input hidden in vertical mode or changed to popover? For simplicity, hiding it or using a prompt might be better, OR a popover. Given the tight space, let's make it a popover trigger or just keep it simple. Actually, the original code had an input field. In vertical mode, an input field ruins the width. Let's make it a button that toggles a popover for the input. */}

            <div className="relative group/bg-link">
              <button
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                title={t("image_gif_link")}
              >
                <Link size={16} />
              </button>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover/bg-link:flex items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder={t("image_gif_link")}
                  className={`px-2 py-1 text-[11px] rounded-lg border w-32 ${inputClass}`}
                  value={bgUrlInput}
                  onChange={(e) => setBgUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={applyBgUrl}
                  className="px-2 py-1 text-[11px] rounded-lg border border-gray-400/50 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {t("set")}
                </button>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="relative group/lang">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className={`appearance-none bg-transparent w-8 text-xs font-bold uppercase text-center cursor-pointer outline-none hover:text-blue-500 transition-all text-gray-700 dark:text-gray-300 border-none p-0`}
              >
                {["vn", "en", "de", "kz", "ka", "ru"].map((l) => (
                  <option key={l} value={l} className="text-black">
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <>
                <div className="h-px w-4 bg-gray-300 my-1"></div>
                <button
                  onClick={fetchInsights}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"
                >
                  <ChartIcon size={16} />
                </button>
                <button
                  onClick={handleForceSync}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-purple-500"
                  title="Đồng bộ Client"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={handleExportData}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-blue-500"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-green-500"
                >
                  <FileUp size={16} />
                </button>
                <input
                  type="file"
                  ref={importInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleImportData}
                />
                <div className="h-px w-4 bg-gray-300 my-1"></div>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  title={t("app_config")}
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
            {!isAdmin && (
              <>
                <div className="h-px w-4 bg-gray-300 my-1"></div>
                <button
                  onClick={handleResetBg}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-orange-500"
                  title={t("reset_bg")}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleClearMedia}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-red-500"
                  title="Xóa nền"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  title={t("admin_login")}
                >
                  <Key size={18} />
                </button>
              </>
            )}
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
            isAdmin={isAdmin}
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
            isAdmin={isAdmin}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <ConfirmDialog
            isOpen={confirmState.isOpen}
            message={confirmState.message}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
            confirmText={t("yes")}
            cancelText={t("no")}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
