import React from 'react';

export default function FilterPanel({
  isOpen,
  activeParentFilter,
  setActiveParentFilter,
  activeChildFilter,
  setActiveChildFilter,
  uniqueParents,
  uniqueChildren,
  labelColors,
  modalClass,
  getContrastYIQ
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`pointer-events-auto w-full max-w-5xl mx-auto rounded-2xl p-3 shadow-lg flex flex-col gap-2 border ${modalClass} bg-opacity-95 backdrop-blur-md`}
    >
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold uppercase opacity-60">Nhóm:</span>
        <button
          onClick={() => setActiveParentFilter(null)}
          className={`px-3 py-1 text-xs rounded-full border ${!activeParentFilter ? 'bg-[#0A1A2F] text-white' : ''}`}
        >
          All
        </button>
        {uniqueParents.map((l) => (
          <button
            key={l}
            onClick={() => setActiveParentFilter(l)}
            className={`px-3 py-1 text-xs rounded-full border ${activeParentFilter === l ? 'ring-2 ring-[#009FB8]' : ''}`}
            style={{
              background: labelColors[l],
              color: getContrastYIQ(labelColors[l])
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {uniqueChildren.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/20">
          <span className="text-xs font-bold opacity-60">Tag:</span>
          {uniqueChildren.map((l) => (
            <button
              key={l}
              onClick={() =>
                setActiveChildFilter(activeChildFilter === l ? null : l)
              }
              className={`px-2 py-0.5 text-[10px] rounded-full border ${activeChildFilter === l ? 'bg-[#009FB8] text-white' : ''}`}
              style={
                activeChildFilter === l && labelColors[l]
                  ? {
                      background: labelColors[l],
                      borderColor: labelColors[l],
                      color: getContrastYIQ(labelColors[l])
                    }
                  : {}
              }
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
