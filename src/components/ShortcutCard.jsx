import React, { useState } from 'react';
import { Copy, Check, Pencil, Trash2, Star } from 'lucide-react';

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
  getContrastYIQ
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e) => {
    e.stopPropagation();
    setCopiedId(item.id);
    navigator.clipboard.writeText(item.url);
    setTimeout(() => setCopiedId(null), 1000);
  };

  return (
    <div
      key={item.id}
      data-card
      draggable
      onDragStart={(e) => handleDragStart(e, item.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, item.id)}
      onDragEnd={handleDragEnd}
      className={`group relative flex flex-col items-center w-full max-w-[100px] cursor-pointer active:scale-95 transition-transform ${draggingId === item.id ? 'opacity-50 scale-90' : ''}`}
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
        className={`absolute -top-1 -left-1 z-10 p-1 rounded-full transition-transform hover:scale-110 ${item.favorite ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
      >
        <Star size={14} fill={item.favorite ? "currentColor" : "none"} />
      </button>
      {/* ICON */}
      <div
        data-icon
        className="w-16 h-16 mb-2 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ background: "transparent", boxShadow: "none" }}
      >
        {item.icon_url ? (
          <img
            src={item.icon_url}
            className="w-full h-full object-cover"
            alt={item.name}
            style={{ borderRadius: 0, boxShadow: "none", background: "transparent" }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 text-white text-xl font-semibold"
            style={{
              background: labelColors[item.parent_label] || "#4A5568",
              boxShadow: "none"
            }}
          >
            {item.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span
        className="text-xs text-center truncate w-full px-1 leading-tight font-light"
        style={{ textShadow: bgOverlay ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' }}
      >
        {item.name}
      </span>
      <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
        {item.parent_label && (
          <span
            className="text-[8px] px-1 py-0.5 rounded-full text-white truncate max-w-[60px] shadow-sm mb-0.5"
            style={{
              background: labelColors[item.parent_label] || '#9CA3AF',
              color: getContrastYIQ(labelColors[item.parent_label] || '#9CA3AF')
            }}
          >
            {item.parent_label}
          </span>
        )}
        {(item.child_label || '')
          .split(',')
          .filter(Boolean)
          .map((t) => (
            <span
              key={t}
              className={`text-[8px] px-1 py-0.5 rounded-full border truncate max-w-[60px] bg-white/50 backdrop-blur-sm ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              style={{
                borderColor: labelColors[t?.trim()],
                color: labelColors[t?.trim()] || (darkMode ? '#ddd' : '#333')
              }}
            >
              {t.trim()}
            </span>
          ))}
      </div>
    </div>
  );
}
