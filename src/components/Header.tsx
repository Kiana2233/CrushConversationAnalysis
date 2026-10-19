"use client";

import React, { useState } from "react";
import { Plus, ChevronRight, Sparkles, Heart, ArrowLeftRight, ListChecks, Scale } from "lucide-react";
import { OverallAnalysis } from "@/types/chat";
import { getAvatarInitial } from "@/lib/parser";

interface HeaderProps {
  crushName: string;
  myName: string;
  relationshipStatus: string;
  overallAnalysis?: OverallAnalysis;
  isAnalyzing: boolean;
  onOpenPasteModal: () => void;
  onOpenAnalysisDetail: () => void;
  onChangeCrushName: (name: string) => void;
  onChangeStatus: (status: string) => void;
  onSwapRoles: () => void;
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
  onOpenPasteModal,
  onOpenAnalysisDetail,
  onChangeCrushName,
  onChangeStatus,
  onSwapRoles,
  hasMessages = false,
  isSelectionMode = false,
  onToggleSelectionMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(crushName);

  const affectionScore = overallAnalysis?.affectionScore ?? null;
  const affectionStage = overallAnalysis?.affectionStage ?? null;

  // 根据分数计算进度条颜色
  const getAffectionColor = (score: number | null) => {
    if (score === null) return "bg-gray-300";
    if (score >= 80) return "bg-[#e05656]"; // 暖红/暧昧
    if (score >= 65) return "bg-[#ea7a56]"; // 活力橙
    if (score >= 50) return "bg-amber-400";
    return "bg-slate-400";
  };

  const initialLetter = crushName ? getAvatarInitial(crushName, 1).toUpperCase() : "CR";

  return (
    <header className="h-16 bg-[#f7f7f8] border-b border-[#e5e5e7] px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Crush Profile Info */}
      <div className="flex items-center gap-3">
        {/* Square Avatar */}
        <div className="w-10 h-10 rounded bg-[#e8e9ec] text-[#55565a] font-medium text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
          {crushName ? (
            initialLetter
          ) : (
            <Heart className="w-4 h-4 text-gray-400" />
          )}
        </div>

        <div className="flex flex-col justify-center">
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
                className="text-sm font-semibold text-[#1c1c1e] bg-white border border-gray-300 rounded px-1.5 py-0.5 outline-none w-28"
              />
            ) : (
              <div
                onClick={() => {
                  setTempName(crushName);
                  setIsEditingName(true);
                }}
                className="text-sm font-semibold text-[#1c1c1e] hover:text-[#07c160] cursor-pointer flex items-center gap-1 group"
                title="点击修改对方备注"
              >
                {crushName ? (
                  <span>{crushName}</span>
                ) : (
                  <span className="text-gray-400 font-normal">等待导入聊天...</span>
                )}
              </div>
            )}

            {/* 对调角色按钮（仅在有人物数据时展示） */}
            {crushName && myName && (
              <button
                onClick={onSwapRoles}
                title={`对调身份 (当前我方: ${myName}, 对方: ${crushName})`}
                className="text-[10px] text-gray-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-2.5 h-2.5" />
                <span>对调身份</span>
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
            className="text-[11px] text-[#8e8e93] hover:text-[#55565a] cursor-pointer transition-colors"
            title={crushName ? "点击切换关系定位" : undefined}
          >
            {crushName ? (
              `${relationshipStatus} · 我方: ${myName || "我"}`
            ) : (
              "快捷键 Ctrl+V 自动识别角色"
            )}
          </div>
        </div>
      </div>

      {/* Center: Affection Score Indicator (好感度) */}
      <div
        onClick={hasMessages ? onOpenAnalysisDetail : onOpenPasteModal}
        className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg hover:bg-[#ececee] transition-all"
        title="点击查看数据罗盘与好感度报告"
      >
        <span className="text-xs font-medium text-[#636366]">好感度</span>

        {isAnalyzing ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[11px] animate-pulse">深度推演中...</span>
          </div>
        ) : affectionScore !== null ? (
          <div className="flex items-center gap-2">
            {/* 极简指示横条 */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-700 ${getAffectionColor(affectionScore)}`}
                style={{ width: `${affectionScore}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#1c1c1e]">
              {affectionScore}
            </span>
            {affectionStage && (
              <span className="text-[10px] text-[#e05656] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                {affectionStage}
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93] group-hover:translate-x-0.5 transition-transform" />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-[#e05656] inline-block rounded-full" />
            <span className="text-[11px] text-[#8e8e93]">
              {hasMessages ? "查看罗盘" : "暂无数据"}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {hasMessages && (
          <button
            onClick={onOpenAnalysisDetail}
            className="px-2.5 h-8 rounded-lg text-xs font-medium flex items-center gap-1.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer"
            title="查看双方投入度天平与时段分布"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">数据罗盘</span>
          </button>
        )}

        {hasMessages && onToggleSelectionMode && (
          <button
            onClick={onToggleSelectionMode}
            className={`px-2.5 h-8 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              isSelectionMode
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                : "text-[#55565a] hover:bg-[#eaeaec] hover:text-[#1c1c1e]"
            }`}
            title={isSelectionMode ? "退出管理模式" : "批量管理 / 删除对话"}
          >
            <ListChecks className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{isSelectionMode ? "退出管理" : "管理"}</span>
          </button>
        )}

        <button
          onClick={onOpenPasteModal}
          className="w-8 h-8 rounded-md flex items-center justify-center text-[#3a3a3c] hover:bg-[#eaeaec] hover:text-[#1c1c1e] transition-colors"
          title="导入新聊天记录"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
