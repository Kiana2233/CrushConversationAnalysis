"use client";

import React, { useState } from "react";
import { X, Heart, Sparkles, TrendingUp, Check, Copy, User, HelpCircle } from "lucide-react";
import { OverallAnalysis, SuggestedReply } from "@/types/chat";

interface AnalysisDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  overallAnalysis?: OverallAnalysis;
  crushName: string;
}

export const AnalysisDetailDrawer: React.FC<AnalysisDetailDrawerProps> = ({
  isOpen,
  onClose,
  overallAnalysis,
  crushName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !overallAnalysis) return null;

  const handleCopy = (reply: SuggestedReply) => {
    navigator.clipboard.writeText(reply.text);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const {
    affectionScore,
    affectionStage,
    affectionSummary,
    myPerformanceScore,
    myPerformanceSummary,
    nextStepAdvice,
    suggestedReplies,
  } = overallAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs select-none">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                {crushName || "Crush"} · 好感度全维研判
              </h3>
              <p className="text-[11px] text-gray-400">恋爱心理学与沟通潜台词洞察</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* 1. 好感度仪表盘卡片 */}
          <div className="p-4 bg-gradient-to-br from-rose-50/70 via-orange-50/40 to-white rounded-2xl border border-rose-100/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-950 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                当前好感度指数
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-medium text-[11px]">
                {affectionStage}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {affectionScore}
              </span>
              <span className="text-sm font-medium text-gray-400">/ 100</span>
            </div>

            {/* 进度条 */}
            <div className="w-full h-2 bg-rose-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-700"
                style={{ width: `${affectionScore}%` }}
              />
            </div>

            <p className="text-gray-600 leading-relaxed text-[11.5px] pt-1">
              {affectionSummary}
            </p>
          </div>

          {/* 2. 我的发挥评分卡片 */}
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                我的发挥评分
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {myPerformanceScore} 分
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11.5px]">
              {myPerformanceSummary}
            </p>
          </div>

          {/* 3. 下一步行动策略指南 */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/80 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>下一步行动策略指南</span>
            </div>
            <p className="text-gray-700 leading-relaxed text-[11.5px]">
              {nextStepAdvice}
            </p>
          </div>

          {/* 4. 参考回复库 */}
          {suggestedReplies && suggestedReplies.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  僚机参考回复库
                </span>
                <span className="text-[10px] text-gray-400">点击任意卡片一键复制</span>
              </div>

              <div className="space-y-2">
                {suggestedReplies.map((reply) => {
                  const isCopied = copiedId === reply.id;
                  return (
                    <div
                      key={reply.id}
                      onClick={() => handleCopy(reply)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-gray-50/60 hover:bg-white border-gray-200/70 hover:border-emerald-400 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {reply.type}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-emerald-600">
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-[12px] font-medium text-gray-800 leading-relaxed mb-1">
                        {reply.text}
                      </p>
                      <p className="text-[10.5px] text-gray-400 italic">
                        {reply.rationale}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
