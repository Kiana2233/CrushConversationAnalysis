"use client";

import React, { useState } from "react";
import {
  Plus,
  Sparkles,
  Heart,
  ArrowLeftRight,
  ListChecks,
  Scale,
  FileText,
  MessageSquare,
  FlaskConical,
  PanelRight,
  Download,
} from "lucide-react";
import { OverallAnalysis } from "@/types/chat";
import { getAvatarInitial } from "@/lib/parser";
import { NavTabType } from "./Sidebar";

interface HeaderProps {
  crushName: string;
  myName: string;
  relationshipStatus: string;
  overallAnalysis?: OverallAnalysis;
  isAnalyzing: boolean;
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  onOpenPasteModal: () => void;
  onOpenSandbox: () => void;
  onChangeCrushName: (name: string) => void;
  onChangeStatus: (status: string) => void;
  onSwapRoles: () => void;
  onAnalyze: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  hasMessages?: boolean;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  crushName,
  myName,
  relationshipStatus,
  overallAnalysis,
  isAnalyzing,
  activeTab,
  onChangeTab,
  onOpenPasteModal,
  onOpenSandbox,
  onChangeCrushName,
  onChangeStatus,
  onSwapRoles,
  onAnalyze,
  isInspectorOpen,
  onToggleInspector,
  hasMessages = false,
  isSelectionMode = false,
  onToggleSelectionMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(crushName);

  const initialLetter = crushName ? getAvatarInitial(crushName, 1).toUpperCase() : "CR";

  return (
    <header className="h-14 bg-white border-b border-[#e5e7eb] px-4 md:px-5 flex items-center justify-between shrink-0 select-none z-10">
      {/* 1. Left: Profile Info & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#e8f5f0] text-[#105e46] font-bold text-xs flex items-center justify-center shrink-0 border border-[#b2e2d0]/60">
          {crushName ? initialLetter : <Heart className="w-4 h-4 text-emerald-600" />}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                autoFocus
                onBlur={() => {
                  if (tempName.trim()) onChangeCrushName(tempName.trim());
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (tempName.trim()) onChangeCrushName(tempName.trim());
                    setIsEditingName(false);
                  }
                }}
                onChange={(e) => setTempName(e.target.value)}
                className="text-xs font-bold text-gray-900 bg-white border border-[#105e46] rounded px-1.5 py-0.5 outline-none w-28"
              />
            ) : (
              <div
                onClick={() => {
                  setTempName(crushName);
                  setIsEditingName(true);
                }}
                className="text-xs font-bold text-gray-900 hover:text-[#105e46] cursor-pointer flex items-center gap-1 group truncate"
                title="点击修改备注"
              >
                <span>{crushName || "等待导入微信聊天"}</span>
              </div>
            )}

            {/* 对调角色按钮 */}
            {crushName && myName && (
              <button
                onClick={onSwapRoles}
                title={`对调身份 (我方: ${myName}, 对方: ${crushName})`}
                className="text-[10px] text-gray-500 hover:text-[#105e46] bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeftRight className="w-2.5 h-2.5" />
                <span>对调</span>
              </button>
            )}
          </div>

          <div
            onClick={() => {
              if (!crushName) return;
              const nextStatus =
                relationshipStatus === "Crush / 暧昧中"
                  ? "Crush / 刚刚认识"
                  : relationshipStatus === "Crush / 刚刚认识"
                  ? "Crush / 破冰拉扯"
                  : "Crush / 暧昧中";
              onChangeStatus(nextStatus);
            }}
            className="text-[10.5px] text-gray-400 hover:text-gray-700 cursor-pointer truncate"
            title="点击切换关系定位"
          >
            {crushName ? `${relationshipStatus} · 我方: ${myName || "我"}` : "点击快捷导入对话"}
          </div>
        </div>
      </div>

      {/* 2. Center: TraceMemo Style Tabs (报告 / 聊天 / 罗盘) */}
      <div className="flex items-center p-0.5 bg-[#f1f3f5] rounded-xl border border-gray-200/60 text-xs">
        <button
          onClick={() => onChangeTab("report")}
          className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "report"
              ? "bg-white text-[#105e46] font-bold shadow-2xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>全维报告</span>
        </button>

        <button
          onClick={() => onChangeTab("chat")}
          className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "chat"
              ? "bg-white text-[#105e46] font-bold shadow-2xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>对话记录</span>
        </button>

        <button
          onClick={() => onChangeTab("compass")}
          className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "compass"
              ? "bg-white text-[#105e46] font-bold shadow-2xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>数据罗盘</span>
        </button>
      </div>

      {/* 3. Right: Action Buttons (TraceMemo 风格) */}
      <div className="flex items-center gap-2">
        {/* 沙盒演练按钮 */}
        {hasMessages && (
          <button
            onClick={onOpenSandbox}
            className="px-2.5 h-7.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#105e46] border border-[#a7f3d0] transition-all cursor-pointer shadow-2xs"
            title="模拟推演对方反应与战术润色"
          >
            <FlaskConical className="w-3 h-3 text-[#105e46]" />
            <span className="hidden sm:inline">沙盒推演</span>
          </button>
        )}

        {/* 重新研判 */}
        {hasMessages && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-2.5 h-7.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer disabled:opacity-50"
            title="调用 AI 重新全维研判"
          >
            <Sparkles className={`w-3 h-3 text-amber-600 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isAnalyzing ? "推演中..." : "重新研判"}</span>
          </button>
        )}

        {/* 管理模式 (批量选择) */}
        {hasMessages && onToggleSelectionMode && (
          <button
            onClick={onToggleSelectionMode}
            className={`px-2 h-7.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              isSelectionMode
                ? "bg-emerald-100 text-[#105e46] border border-emerald-300"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="批量管理对话"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 导入聊天 TraceMemo 墨绿主按钮 */}
        <button
          onClick={onOpenPasteModal}
          className="px-3 h-7.5 rounded-lg bg-[#105e46] hover:bg-[#0c4a37] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          title="导入新聊天记录"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">导入聊天</span>
        </button>

        {/* 右侧属性检查器面板开关 */}
        <button
          onClick={onToggleInspector}
          className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isInspectorOpen
              ? "bg-gray-200 text-gray-900"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          }`}
          title="切换报告元数据面板"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
