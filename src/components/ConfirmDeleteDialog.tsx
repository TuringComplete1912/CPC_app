"use client";

import { useState } from "react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
}

export default function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName
}: ConfirmDeleteDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const confirmText = "确定移除";

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue === confirmText) {
      onConfirm();
      setInputValue("");
      onClose();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">{description}</p>
          {itemName && (
            <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
              {itemName}
            </p>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm font-medium">
            ⚠️ 警告：此操作无法恢复！
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            请输入 <span className="font-bold text-red-600">{confirmText}</span> 以确认删除
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={confirmText}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={inputValue !== confirmText}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              inputValue === confirmText
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
