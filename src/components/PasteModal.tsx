"use client";

import React, { useState } from "react";
import { X, Clipboard, Sparkles } from "lucide-react";
import { SCENARIOS, ChatScenario } from "@/lib/sample-data";

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (rawText: string) => void;
  onLoadScenario: (scenario: ChatScenario) => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  onLoadScenario,
}) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleReadClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
      }
    } catch (err) {
      console.warn("Clipboard read permission denied or not available", err);
    }
  };

  const handleImport = () => {
    if (text.trim()) {
      onConfirmImport(text.trim());
      setText("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clipboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              导入微信聊天记录
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* 预设精彩场景快捷载入 */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              快速载入真实恋爱场景体验：
            </span>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    onLoadScenario(sc);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-xs text-gray-700 hover:text-emerald-700 transition-all text-left flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{sc.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>或直接粘贴你的真实微信记录：</span>
              <button
                onClick={handleReadClipboard}
                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>一键读取剪贴板</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`支持格式示例：
林小鹿  昨天 21:35
这家店的焦糖肉桂卷真的绝了！

我  昨天 21:40
看着太诱人了，是在静安弄堂里的那家？`}
              className="w-full p-3 text-xs text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white resize-none font-mono leading-relaxed select-text"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            disabled={!text.trim()}
            onClick={handleImport}
            className={`px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors shadow-xs ${
              text.trim()
                ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            解析并合并去重
          </button>
        </div>
      </div>
    </div>
  );
};
