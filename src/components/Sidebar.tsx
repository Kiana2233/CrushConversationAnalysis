"use client";

import React from "react";
import { MessageSquare, Heart, Settings, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";

interface SidebarProps {
  onOpenSettings: () => void;
  onClear: () => void;
  hasMessages: boolean;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isSessionListOpen: boolean;
  onToggleSessionList: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings,
  onClear,
  hasMessages,
  onAnalyze,
  isAnalyzing,
  isSessionListOpen,
  onToggleSessionList,
}) => {
  return (
    <aside className="w-14 h-screen bg-[#e9e9ea] border-r border-[#dcdcdc] flex flex-col items-center py-4 justify-between shrink-0 select-none">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-5">
        {/* User Mini Avatar / Status */}
        <div className="w-9 h-9 rounded bg-[#d0d0d2] text-[#4a4a4a] text-xs font-semibold flex items-center justify-center shadow-xs">
          略
        </div>

        {/* Chat Tab / Session List Toggle */}
        <button
          onClick={onToggleSessionList}
          title={isSessionListOpen ? "收起历史会话列表" : "展开历史会话列表"}
          className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors relative ${
            isSessionListOpen
              ? "bg-[#dededf] text-[#07c160]"
              : "text-[#55565a] hover:bg-[#dededf] hover:text-[#07c160]"
          }`}
        >
          <MessageSquare className="w-5 h-5 fill-[#07c160]/20" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#07c160]" />
        </button>

        {/* Trigger AI Analysis */}
        {hasMessages && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            title={isAnalyzing ? "正在深度推演中..." : "重新分析好感度"}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
              isAnalyzing
                ? "bg-amber-100 text-amber-600 animate-spin"
                : "text-amber-500 hover:bg-[#dededf] hover:text-amber-600"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-4 text-[#737373]">
        {hasMessages && (
          <button
            onClick={onClear}
            title="清空记录并重置"
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#dededf] hover:text-rose-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          title="身份偏好设置"
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#dededf] hover:text-[#1c1c1e] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div
          title="本地剪贴板解析 · 绝不外传聊天隐私"
          className="w-8 h-8 flex items-center justify-center text-[#999999]"
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>
    </aside>
  );
};
