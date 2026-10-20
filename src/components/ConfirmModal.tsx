"use client";

import React from "react";
import { Shield, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

// 通用二次确认弹窗（TraceMemo 翡翠绿极简风，与 SettingsModal 同款骨架）
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  icon,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {icon ?? <Shield className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#105e46] hover:bg-[#0c4a37] rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
