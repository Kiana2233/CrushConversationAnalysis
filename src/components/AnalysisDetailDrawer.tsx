"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Heart,
  Sparkles,
  TrendingUp,
  Check,
  Copy,
  User,
  Scale,
  Compass,
  ArrowRight,
} from "lucide-react";
import { OverallAnalysis, SuggestedReply, Message } from "@/types/chat";
import { DataCompassTab } from "./DataCompassTab";

interface AnalysisDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  overallAnalysis?: OverallAnalysis;
  crushName: string;
  myName?: string;
  messages?: Message[];
  isAnalyzing?: boolean;
  onTriggerAnalyze?: () => void;
}

export const AnalysisDetailDrawer: React.FC<AnalysisDetailDrawerProps> = ({
  isOpen,
  onClose,
  overallAnalysis,
  crushName,
  myName = "我",
  messages = [],
  isAnalyzing = false,
  onTriggerAnalyze,
}) => {
  const [activeTab, setActiveTab] = useState<"compass" | "analysis">("compass");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 当打开弹窗时，如果已经有 AI 分析结果且没手动切换过，优先显示分析或数据罗盘
  useEffect(() => {
    if (isOpen) {
      if (overallAnalysis) {
        setActiveTab("analysis");
      } else {
        setActiveTab("compass");
      }
    }
  }, [isOpen, !!overallAnalysis]);

  if (!isOpen) return null;

  const handleCopy = (reply: SuggestedReply) => {
    navigator.clipboard.writeText(reply.text);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs select-none">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#fafafa]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                {crushName || "Crush"} · 关系全维全息洞察
              </h3>
              <p className="text-[11px] text-gray-400">客观数据天平 · 深度心理研判</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-gray-100 bg-white shrink-0">
          <div className="flex p-1 bg-gray-100/80 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab("compass")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "compass"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>数据罗盘</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 font-normal">
                秒算
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "analysis"
                  ? "bg-white text-rose-600 shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>深度判研</span>
              {overallAnalysis?.affectionScore && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 font-bold">
                  {overallAnalysis.affectionScore}分
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === "compass" ? (
            <DataCompassTab
              messages={messages}
              myName={myName}
              crushName={crushName}
              overallAnalysis={overallAnalysis}
            />
          ) : (
            /* Tab: 深度判研 (Text & Psychological Insights) */
            <div className="space-y-4">
              {overallAnalysis ? (
                <>
                  {/* 1. 好感度仪表盘卡片 */}
                  <div className="p-4 bg-gradient-to-br from-rose-50/70 via-orange-50/40 to-white rounded-2xl border border-rose-100/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-950 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                        当前好感度指数
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-medium text-[11px]">
                        {overallAnalysis.affectionStage}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {overallAnalysis.affectionScore}
                      </span>
                      <span className="text-sm font-medium text-gray-400">/ 100</span>
                    </div>

                    {/* 进度条 */}
                    <div className="w-full h-2 bg-rose-100/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-700"
                        style={{ width: `${overallAnalysis.affectionScore}%` }}
                      />
                    </div>

                    <p className="text-gray-600 leading-relaxed text-[11.5px] pt-1">
                      {overallAnalysis.affectionSummary}
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
                        {overallAnalysis.myPerformanceScore} 分
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-[11.5px]">
                      {overallAnalysis.myPerformanceSummary}
                    </p>
                  </div>

                  {/* 3. 下一步行动策略指南 */}
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/80 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-950">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>下一步行动策略指南</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[11.5px]">
                      {overallAnalysis.nextStepAdvice}
                    </p>
                  </div>

                  {/* 4. 僚机参考回复库 */}
                  {overallAnalysis.suggestedReplies && overallAnalysis.suggestedReplies.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">僚机参考回复库</span>
                        <span className="text-[10px] text-gray-400">点击任意卡片一键复制</span>
                      </div>

                      <div className="space-y-2">
                        {overallAnalysis.suggestedReplies.map((reply) => {
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
                </>
              ) : isAnalyzing ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center animate-bounce">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-rose-300 animate-ping opacity-30" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">DeepSeek 正在深度推演中...</h4>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    正在解构双方聊天语气、好感度、心理学潜台词与下一步行动建议，请稍候片刻。
                  </p>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">尚未生成 AI 研判报告</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    点击下方按钮，调用 DeepSeek 模型对整段聊天进行好感度与潜台词深度分析。
                  </p>
                  {onTriggerAnalyze && messages.length > 0 && (
                    <button
                      onClick={onTriggerAnalyze}
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>立即开始全维研判</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
