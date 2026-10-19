"use client";

import React, { useState } from "react";
import { Copy, Check, Sparkles, Send, ArrowUpRight, FlaskConical } from "lucide-react";
import { OverallAnalysis, SuggestedReply } from "@/types/chat";

interface FooterBarProps {
  overallAnalysis?: OverallAnalysis;
  isAnalyzing: boolean;
  onPasteText: (text: string) => void;
  onAnalyze: () => void;
  onOpenSandbox?: (initialDraft?: string) => void;
  hasMessages: boolean;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  overallAnalysis,
  isAnalyzing,
  onPasteText,
  onAnalyze,
  onOpenSandbox,
  hasMessages,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (reply: SuggestedReply) => {
    navigator.clipboard.writeText(reply.text);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        onPasteText(inputText);
        setInputText("");
      }
    }
  };

  const myScore = overallAnalysis?.myPerformanceScore;
  const nextStep = overallAnalysis?.nextStepAdvice || "等你导入聊天";

  return (
    <footer className="bg-[#f7f7f8] border-t border-[#e5e5e7] px-4 md:px-8 py-3 shrink-0 flex flex-col gap-2.5 select-none">
      {/* 1. 状态栏 (我的发挥 / 下一步指示) - 贴合截图 */}
      <div className="flex items-center justify-between text-xs text-[#636366] px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            <span>我的发挥</span>
            {myScore ? (
              <span className="font-semibold text-emerald-600">
                {myScore}分
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          <span className="text-gray-300">|</span>

          <div className="flex items-center gap-1.5 truncate max-w-md">
            <span className="text-gray-400 shrink-0">下一步</span>
            <span className="text-gray-600 truncate">{nextStep}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && onOpenSandbox && (
            <button
              onClick={() => onOpenSandbox()}
              className="text-[11px] font-medium text-[#105e46] hover:text-[#0c4a37] bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
              title="在回复前模拟推演对方心理反应与战术润色"
            >
              <FlaskConical className="w-3 h-3 text-[#105e46]" />
              <span>沙盒演练</span>
            </button>
          )}

          {hasMessages && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? "分析中..." : "重新研判"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 僚机参考回复推荐卡片 (点击一键复制，去微信回复) */}
      {overallAnalysis?.suggestedReplies && overallAnalysis.suggestedReplies.length > 0 && (
        <div className="bg-white border border-[#e5e5e7] rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <Sparkles className="w-3 h-3 text-amber-500" />
              AI 推荐参考回复 (点击一键复制到微信)
            </span>
            <span>按策略挑选</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {overallAnalysis.suggestedReplies.map((reply) => {
              const isCopied = copiedId === reply.id;
              return (
                <div
                  key={reply.id}
                  onClick={() => handleCopy(reply)}
                  className={`group relative p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isCopied
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-[#fcfcfd] hover:bg-white border-gray-200/80 hover:border-emerald-400 hover:shadow-xs"
                  }`}
                  title={reply.rationale}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                      {reply.type}
                    </span>
                    <button
                      className="text-gray-400 group-hover:text-emerald-600 transition-colors"
                      title="复制"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-800 line-clamp-2 leading-relaxed">
                    {reply.text}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">
                    {reply.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 剪贴板输入框 (直接粘贴，自动去重合并) */}
      <div className="relative bg-white border border-[#dcdde0] focus-within:border-emerald-500 rounded-xl transition-all shadow-2xs">
        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            // 当用户在此输入框粘贴时，触发快速提交
            const text = e.clipboardData.getData("text");
            if (text && text.length > 10) {
              e.preventDefault();
              onPasteText(text);
              setInputText("");
            }
          }}
          placeholder="粘贴新的微信聊天记录（Ctrl + V），自动去重并合并..."
          className="w-full px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none select-text"
        />

        <div className="flex items-center justify-between px-3.5 pb-2 text-[11px] text-gray-400">
          <span>支持微信 PC/手机端多选复制文本</span>
          {inputText.trim() && (
            <div className="flex items-center gap-1.5">
              {onOpenSandbox && (
                <button
                  type="button"
                  onClick={() => onOpenSandbox(inputText.trim())}
                  className="px-2.5 py-1 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#105e46] border border-[#a7f3d0] rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  title="以此草稿在沙盒中模拟对方反应"
                >
                  <FlaskConical className="w-3 h-3 text-[#105e46]" />
                  <span>沙盒推演此条</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (inputText.trim()) {
                    onPasteText(inputText);
                    setInputText("");
                  }
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span>解析导入</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
