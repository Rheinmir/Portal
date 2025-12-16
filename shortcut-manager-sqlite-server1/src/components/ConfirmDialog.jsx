import React from 'react';

export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 min-w-[300px] max-w-sm border border-gray-100 dark:border-gray-700 transform scale-100 transition-all">
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Confirm</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[#0F2F55] text-white hover:bg-blue-900 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
