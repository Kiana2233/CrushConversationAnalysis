"use client";

import React from "react";
import { X, Sparkles, MessageCircle, Heart } from "lucide-react";
import { Message } from "@/types/chat";

interface MessageDetailModalProps {
  message: Message | null;
  onClose: () => void;
  crushName: string;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  onClose,
  crushName,
}) => {
  if (!message) return null;

  const isMe = message.isMe;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4 select-none">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-semibold text-gray-800">
              单句心理学潜台词洞察
            </h4>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs">
          {/* 原话回显 */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>{isMe ? "【我方发言】" : `【${crushName || "对方"}发言】`}</span>
              <span>{message.timestamp}</span>
            </div>
            <p className="text-sm font-medium text-gray-800 select-text">
              {message.content}
            </p>
          </div>

          {!isMe ? (
            // 对方发言洞察
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100">
                  <span className="text-[10px] text-amber-700 block mb-0.5">表层情绪</span>
                  <span className="font-semibold text-gray-800">
                    {message.analysis?.emotion || "分析中"}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-rose-700 block mb-0.5">潜台词意图</span>
                  <span className="font-semibold text-gray-800">
                    {message.analysis?.intent || "分析中"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/70 space-y-1">
                <span className="text-[10px] font-semibold text-indigo-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  深度心理学剖析
                </span>
                <p className="text-[11.5px] text-gray-700 leading-relaxed">
                  {message.analysis?.subtext || "正在结合上下文进一步推演中..."}
                </p>
              </div>
            </div>
          ) : (
            // 我方发言点评
            <div className="space-y-2.5">
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-[10px] font-semibold text-emerald-900">
                  发言得失点评
                </span>
                <p className="text-[11.5px] text-gray-700 leading-relaxed">
                  {message.analysis?.feedback || "表达自然，契合当下语境。"}
                </p>
              </div>

              {message.analysis?.subtext && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-400">沟通学建议</span>
                  <p className="text-[11.5px] text-gray-600 leading-relaxed">
                    {message.analysis.subtext}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
