"use client";

import React from "react";
import {
  FileText,
  MessageSquare,
  Scale,
  FlaskConical,
  Settings,
  FolderArchive,
  Sparkles,
  HelpCircle,
  Share2,
} from "lucide-react";

export type NavTabType = "report" | "chat" | "compass";

interface SidebarProps {
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  isSessionListOpen: boolean;
  onToggleSessionList: () => void;
  onOpenSettings: () => void;
  onOpenSandbox: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasMessages: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  isSessionListOpen,
  onToggleSessionList,
  onOpenSettings,
  onOpenSandbox,
  onAnalyze,
  isAnalyzing,
  hasMessages,
}) => {
  return (
    <aside className="w-[68px] h-screen bg-[#f3f4f6] border-r border-[#e5e7eb] flex flex-col items-center py-3.5 justify-between shrink-0 select-none z-30">
      {/* Top Group: macOS Traffic Lights & Brand Logo */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5 px-3 py-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
        </div>

        {/* TraceMemo Style Deep Emerald Brand Logo */}
        <div
          title="CrushMemo (迹恋) · 恋爱全维研判工作台"
          className="w-10 h-10 rounded-2xl bg-[#105e46] text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#0c4a37] transition-all"
        >
          <div className="relative">
            <span className="text-base font-extrabold tracking-tighter">CM</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Navigation Vertical Menu */}
        <nav className="flex flex-col items-center gap-1 w-full px-2 pt-2">
          {/* 1. 档案 / 历史记录 (Toggle Session List) */}
          <button
            onClick={onToggleSessionList}
            title={isSessionListOpen ? "收起档案列表" : "展开档案列表"}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10.5px] transition-all cursor-pointer ${
              isSessionListOpen
                ? "bg-white text-[#105e46] shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>档案</span>
          </button>

          {/* 2. 全维报告 (Report Document View) */}
          <button
            onClick={() => onChangeTab("report")}
            title="恋爱全息研判报告卡片"
            className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10.5px] transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-[#105e46] text-white shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>报告</span>
          </button>

          {/* 3. 聊天流 (WeChat Message Stream) */}
          <button
            onClick={() => onChangeTab("chat")}
            title="原始微信聊天记录流"
            className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10.5px] transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-[#105e46] text-white shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>聊天</span>
          </button>

          {/* 4. 数据罗盘 (Data Compass) */}
          <button
            onClick={() => onChangeTab("compass")}
            title="双方投入度与时段罗盘"
            className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10.5px] transition-all cursor-pointer ${
              activeTab === "compass"
                ? "bg-[#105e46] text-white shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>罗盘</span>
          </button>

          {/* 5. 沙盒演练 (Sandbox Simulator) */}
          <button
            onClick={onOpenSandbox}
            title="回复沙盒演练器 (实战对局模拟)"
            className="w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[10.5px] text-gray-500 hover:text-purple-700 hover:bg-purple-50/70 transition-all cursor-pointer group"
          >
            <FlaskConical className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>沙盒</span>
          </button>
        </nav>
      </div>

      {/* Bottom Group: Settings, Status, Avatar */}
      <div className="flex flex-col items-center gap-3 w-full px-2 text-gray-500">
        {/* Trigger Analyze if has messages */}
        {hasMessages && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            title={isAnalyzing ? "正在推演中..." : "重新研判好感度"}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isAnalyzing
                ? "bg-amber-100 text-amber-600 animate-spin"
                : "hover:bg-gray-200/60 hover:text-amber-600"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="偏好与角色设置"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-200/60 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* TraceMemo Style Bottom Avatar / Profile Badge */}
        <div
          title="当前分析专员"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-semibold text-[11px] flex items-center justify-center border-2 border-white shadow-2xs cursor-pointer select-none"
        >
          AI
        </div>
      </div>
    </aside>
  );
};
