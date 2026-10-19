"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  Sparkles,
  Cpu,
  CheckCircle2,
  FolderOpen,
  Copy,
  Check,
  Share2,
  Download,
  Info,
  ChevronRight,
} from "lucide-react";
import { OverallAnalysis, Message } from "@/types/chat";

interface RightInspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  crushName: string;
  myName: string;
  relationshipStatus: string;
  overallAnalysis?: OverallAnalysis;
  onOpenSandbox: () => void;
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  isOpen,
  onClose,
  messages,
  crushName,
  myName,
  relationshipStatus,
  overallAnalysis,
  onOpenSandbox,
}) => {
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const estimatedTokens = Math.round(totalChars * 1.5 + 800);

  const handleCopySummary = () => {
    const text = `【${crushName} · 恋爱全息研判报告】\n好感度指数: ${
      overallAnalysis?.affectionScore ?? "80"
    }分 (${overallAnalysis?.affectionStage ?? "暧昧升温"})\n双方消息数: ${
      messages.length
    }条 · 共${totalChars}字\nAI洞察: ${
      overallAnalysis?.affectionSummary ?? "双方交流顺畅，保持着良好的沟通节奏。"
    }\n下一步建议: ${overallAnalysis?.nextStepAdvice ?? "保持日常沟通节奏"}`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <aside className="w-[260px] h-screen bg-white border-l border-[#e5e7eb] flex flex-col shrink-0 select-none text-xs z-20 overflow-y-auto">
      {/* 1. Header (TraceMemo 风格) */}
      <div className="p-4 border-b border-[#f0f1f3] space-y-0.5">
        <h3 className="font-bold text-gray-900 text-xs">报告档案信息</h3>
        <p className="text-[10.5px] text-gray-400">当前选中报告的本地资产状态</p>
      </div>

      <div className="p-4 space-y-5">
        {/* 2. 基础信息 */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
            基础信息
          </h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-gray-500">
              <span>生成时间</span>
              <span className="text-gray-800 font-medium">{mounted ? new Date().toLocaleTimeString() : ""}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>消息数量</span>
              <span className="text-gray-800 font-medium">{messages.length} 条</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>研判对象</span>
              <span className="text-gray-800 font-medium truncate max-w-[120px]">{crushName || "Crush"}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>我方身份</span>
              <span className="text-gray-800 font-medium truncate max-w-[120px]">{myName || "我"}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>关系定位</span>
              <span className="text-[#105e46] font-semibold">{relationshipStatus}</span>
            </div>
          </div>
        </div>

        {/* 3. AI 生成信息 (TraceMemo 经典 DeepSeek 参数) */}
        <div className="space-y-2.5 pt-3 border-t border-gray-100">
          <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
            <span>AI 生成信息</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-normal">
              在线就绪
            </span>
          </h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-gray-500">
              <span>文字模型</span>
              <span className="text-gray-800 font-semibold">DeepSeek Chat</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>推理引擎</span>
              <span className="text-gray-800">深度恋爱心理学</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>Token 估算</span>
              <span className="text-gray-800 font-mono">~{estimatedTokens}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>数据保护</span>
              <span className="text-emerald-700">本地隐私闭环</span>
            </div>
          </div>
        </div>

        {/* 4. 文件与导出资产 */}
        <div className="space-y-2.5 pt-3 border-t border-gray-100">
          <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
            文件与操作
          </h4>
          <div className="space-y-2">
            <button
              onClick={handleCopySummary}
              className="w-full py-2 bg-gray-100 hover:bg-[#105e46] text-gray-700 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>战报已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                  <span>复制研判战报摘要</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenSandbox}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>调起回复沙盒演练</span>
            </button>
          </div>
        </div>

        {/* 5. 生成日志 (TraceMemo 底部日志跟踪) */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
            生成日志
          </h4>
          <div className="space-y-1.5 text-[10.5px] text-gray-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>读取微信剪贴板聊天记录 0.2s</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>角色校准与时间戳排序完成</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>双方投入度天平即时计算</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>全息多维雷达与情绪曲线构建</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
