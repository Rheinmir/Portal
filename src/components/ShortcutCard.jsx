import React, { useState } from "react";
import { Copy, Check, Pencil, Trash2, Star } from "lucide-react";

export default function ShortcutCard({
  item,
  isAdmin,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleLinkClick,
  handleEdit,
  handleDelete,
  handleToggleFavorite,
  cardClass,
  labelColors,
  bgOverlay,
  draggingId,
  darkMode,
  getContrastYIQ,
  viewMode,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    setCopiedId(item.id);
    navigator.clipboard.writeText(item.url);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const isLaunchpad = viewMode === "launchpad";
  const containerClass = isLaunchpad
    ? "max-w-[130px]" // Larger container
    : "max-w-[100px]";
  const iconSizeClass = isLaunchpad
    ? "w-24 h-24 rounded-3xl"
    : "w-16 h-16 rounded-2xl"; // Larger icon
  const textSizeClass = isLaunchpad ? "text-sm" : "text-xs"; // Slightly larger text

  return (
    <div
      key={item.id}
      data-card
      draggable
      onDragStart={(e) => handleDragStart(e, item.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, item.id)}
      onDragEnd={handleDragEnd}
      className={`group relative flex flex-col items-center w-full ${containerClass} cursor-pointer active:scale-95 transition-transform ${
        draggingId === item.id ? "opacity-50 scale-90" : ""
      }`}
      onClick={() => handleLinkClick(item.id, item.url)}
    >
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-full shadow-sm border ${cardClass} bg-opacity-90`}
        >
          {copiedId === item.id ? (
            <Check size={12} className="text-green-500" />
          ) : (
            <Copy size={12} />
          )}
        </button>
        {(isAdmin || item.isLocal) && (
          <>
            <button
              onClick={(e) => handleEdit(item, e)}
              className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className={`p-1.5 rounded-full shadow-sm border ml-1 ${cardClass}`}
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
      <button
        onClick={(e) => handleToggleFavorite(item.id, e)}
        className={`absolute -top-1 -left-1 z-10 p-1 rounded-full transition-transform hover:scale-110 ${
          item.favorite
            ? "text-yellow-400"
            : "text-gray-300 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Star size={14} fill={item.favorite ? "currentColor" : "none"} />
      </button>
      {/* ICON */}
      <div
        data-icon
        className={`${iconSizeClass} mb-2 overflow-hidden flex items-center justify-center transition-all`}
        style={{ background: "transparent", boxShadow: "none" }}
      >
        {item.icon_url ? (
          <img
            src={item.icon_url}
            className="w-full h-full object-cover"
            alt={item.name}
            style={{
              borderRadius: 0,
              boxShadow: "none",
              background: "transparent",
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white ${
              isLaunchpad ? "text-3xl rounded-3xl" : "text-xl rounded-2xl"
            } font-semibold`}
            style={{
              background: labelColors[item.parent_label] || "#4A5568",
              boxShadow: "none",
            }}
          >
            {item.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span
        className={`${textSizeClass} text-center truncate w-full px-1 leading-tight font-light`}
        style={{ textShadow: bgOverlay ? "0 1px 2px rgba(0,0,0,0.5)" : "none" }}
      >
        {item.name}
      </span>
      <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
        {item.parent_label && (
          <span
            className="text-[8px] px-1 py-0.5 rounded-full text-white truncate max-w-[60px] shadow-sm mb-0.5"
            style={{
              background: labelColors[item.parent_label] || "#9CA3AF",
              color: getContrastYIQ(
                labelColors[item.parent_label] || "#9CA3AF"
              ),
            }}
          >
            {item.parent_label}
          </span>
        )}
        {(() => {
          const tags = (item.child_label || "")
            .split(",")
            .filter((t) => t.trim());
          if (tags.length === 0) return null;

          // If showing all or only 1 tag, simple map
          if (showAllTags || tags.length === 1) {
            return tags.map((t) => (
              <span
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tags.length > 1) setShowAllTags(!showAllTags);
                }}
                className={`text-[8px] px-1 py-0.5 rounded-full border truncate max-w-[60px] bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white/80 ${
                  darkMode ? "border-gray-600" : "border-gray-300"
                }`}
                style={{
                  borderColor: labelColors[t?.trim()],
                  color: labelColors[t?.trim()] || (darkMode ? "#ddd" : "#333"),
                }}
                title={tags.length > 1 ? "Click to collapse" : ""}
              >
                {t.trim()}
              </span>
            ));
          }

          // Compact view: Show first tag + " +"
          const firstTag = tags[0].trim();
          return (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowAllTags(true);
              }}
              className={`text-[8px] px-1 py-0.5 rounded-full border truncate max-w-[60px] bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white/80 flex items-center gap-0.5 ${
                darkMode ? "border-gray-600" : "border-gray-300"
              }`}
              style={{
                borderColor: labelColors[firstTag],
                color: labelColors[firstTag] || (darkMode ? "#ddd" : "#333"),
              }}
              title="Click to show all tags"
            >
              {firstTag} <span className="font-bold opacity-70 ml-0.5">+</span>
            </span>
          );
        })()}
      </div>
    </div>
  );
}
