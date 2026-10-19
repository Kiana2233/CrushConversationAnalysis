"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FlaskConical,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Send,
  MessageSquare,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Message, SandboxAnalysis } from "@/types/chat";

interface SandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  crushName: string;
  myName: string;
  relationshipStatus: string;
  initialDraft?: string;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({
  isOpen,
  onClose,
  messages,
  crushName,
  myName,
  relationshipStatus,
  initialDraft = "",
}) => {
  const [draftReply, setDraftReply] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<SandboxAnalysis | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 获取最后一条来自 Crush 的发言作为对战情境
  const lastCrushMsg = messages.filter((m) => !m.isMe).slice(-1)[0];
  const lastCrushText = lastCrushMsg?.content || "对方尚未发言";

  // 当弹窗打开时，初始化草稿
  useEffect(() => {
    if (isOpen) {
      if (initialDraft) {
        setDraftReply(initialDraft);
      } else if (!draftReply) {
        setDraftReply("不知道诶，这是什么呀？");
      }
      setCopiedIndex(null);
    }
  }, [isOpen, initialDraft]);

  if (!isOpen) return null;

  const handleSimulate = async (customDraft?: string) => {
    const textToSimulate = (customDraft ?? draftReply).trim();
    if (!textToSimulate) return;

    setIsSimulating(true);
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          draftReply: textToSimulate,
          crushName: crushName || "对方",
          myName: myName || "我",
          relationshipStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (e) {
      console.error("Failed to run sandbox simulation", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const presets = [
    { label: "坦白回“没听过/不知道”", text: "没听过，演什么的？" },
    { label: "装作自己也很懂", text: "我也超喜欢这个！我全都知道！" },
    { label: "高情商借力打力·求安利", text: "真没接触过诶！但刚才看到你提就特意去搜了一下，感觉好抓人，你最推荐我从哪里入坑呀？" },
    { label: "幽默调侃推拉", text: "坦白从宽，你平时背着我都藏了多少宝藏好物？赶紧交出清单！" },
  ];

  const assessment = analysis?.draftAssessment;
  const probe = analysis?.contextProbe;

  const getRiskColor = (level?: string) => {
    if (level === "safe") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (level === "danger") return "text-rose-700 bg-rose-50 border-rose-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-3 md:p-6 animate-in fade-in duration-150 select-none">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col border border-[#e5e7eb] overflow-hidden">
        {/* Header (TraceMemo 风格：白底细腻边框 + 深翡翠绿品牌强调) */}
        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fbfcfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]/80 text-[#105e46] flex items-center justify-center shrink-0 shadow-2xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>回复沙盒演练器</span>
                <span className="text-[10px] font-semibold text-[#105e46] bg-[#ecfdf5] border border-[#a7f3d0]/80 px-2 py-0.5 rounded-full">
                  实战对局模拟
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                预测 {crushName || "Crush"} 心理反应 · 识别小众盲区 · 借力打力高情商润色
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="关闭沙盒"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-[#fafbfc]/50">
          {/* 1. 当前对局情境 (对方最新发言) */}
          <div className="p-3.5 bg-white rounded-xl border border-[#e5e7eb] shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5 text-[#105e46]" />
                当前模拟对局情境（{crushName || "Crush"} 最新发言）
              </span>
              <span>{lastCrushMsg?.timestamp || "刚刚"}</span>
            </div>
            <div className="bg-[#f8faf9] p-3 rounded-lg border border-[#eef2f0] text-gray-800 text-[12.5px] leading-relaxed shadow-2xs font-sans">
              “{lastCrushText}”
            </div>
          </div>

          {/* 2. 知识盲区探针卡片 (识别到小众影视/音乐/梗) */}
          {probe && (
            <div className="p-3.5 bg-[#fffbeb] rounded-xl border border-[#fde68a] space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>盲区探针：识别到特定小众文化【{probe.term}】</span>
                </span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 font-medium border border-amber-200">
                  {probe.category}
                </span>
              </div>
              <p className="text-[11.5px] text-amber-950 leading-relaxed">
                📌 <strong className="font-semibold">核心速览：</strong>{probe.summary}
              </p>
              <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed shadow-2xs">
                💡 <strong className="font-semibold text-amber-950">战术破冰指南：</strong>
                {probe.resonanceHook}
              </div>
            </div>
          )}

          {/* 3. 我的回复草稿输入区 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-800 flex items-center gap-1 text-xs">
                <span>拟回复草稿（输入你想发的话，测测对方心理反应）</span>
              </label>
              <span className="text-[10.5px] text-gray-400">支持自由编辑或点击预设</span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                placeholder="在此输入你打算发送给对方的话（例如：不知道诶、我也超喜欢、改天一起去...）"
                className="w-full p-3 bg-white border border-[#d1d5db] focus:border-[#105e46] focus:ring-1 focus:ring-[#105e46] rounded-xl text-xs text-gray-800 outline-none resize-none transition-all shadow-2xs select-text leading-relaxed"
              />
            </div>

            {/* 快速场景试探预设 */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10.5px] text-gray-400 font-medium">典型场景测试：</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDraftReply(p.text);
                    handleSimulate(p.text);
                  }}
                  className="text-[10.5px] px-2.5 py-1 bg-[#f3f4f6] hover:bg-[#ecfdf5] text-gray-600 hover:text-[#105e46] border border-[#e5e7eb] hover:border-[#a7f3d0] rounded-lg transition-all cursor-pointer font-medium active:scale-[0.98]"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 推演按钮 (TraceMemo 经典深翡翠绿 CTA) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleSimulate()}
                disabled={isSimulating || !draftReply.trim()}
                className="w-full py-2.5 bg-[#105e46] hover:bg-[#0c4a37] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isSimulating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在沙盘推演对方内心反应...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-200" />
                    <span>开始模拟推演对方反应</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. 推演结果展示区 */}
          {assessment && (
            <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
              {/* 核心指标与诊断 */}
              <div className="p-4 bg-white rounded-xl border border-[#e5e7eb] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-xs">话题积极延续率</span>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(
                        assessment.riskLevel
                      )}`}
                    >
                      {assessment.riskTag}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 font-sans">
                      {assessment.continuationRate}%
                    </span>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full h-2 bg-[#f0f2f1] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      assessment.continuationRate >= 70
                        ? "bg-[#105e46]"
                        : assessment.continuationRate >= 45
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${assessment.continuationRate}%` }}
                  />
                </div>

                {/* Crush 真实内心独白 */}
                <div className="p-3 bg-[#f8faf9] rounded-xl border border-emerald-100/90 space-y-1.5 shadow-2xs">
                  <span className="text-[10.5px] font-semibold text-[#105e46] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#105e46]" />
                    {crushName || "Crush"} 真实内心独白预测：
                  </span>
                  <p className="text-[11.5px] text-gray-700 italic leading-relaxed">
                    “{assessment.crushInnerThought}”
                  </p>
                </div>

                {/* Crush 预计回复 */}
                <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                  <strong className="text-gray-700 shrink-0 font-medium">预计对方回复：</strong>
                  <span className="text-gray-700 bg-white px-2 py-0.5 rounded-md border border-[#e5e7eb] shadow-2xs font-medium">
                    “{assessment.predictedReply}”
                  </span>
                </div>

                {/* 战术点评 */}
                <p className="text-[11px] text-gray-500 leading-relaxed pt-1.5 border-t border-gray-100">
                  💡 <strong className="text-gray-700 font-medium">战术点评：</strong>
                  {assessment.diagnosis}
                </p>
              </div>

              {/* 三套高情商战术润色方案 */}
              {analysis.polishedReplies && analysis.polishedReplies.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#105e46]" />
                      <span>高情商战术润色建议（点击一键复制发微信）</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">绝不装懂 · 借力打力</span>
                  </div>

                  <div className="space-y-2">
                    {analysis.polishedReplies.map((reply, idx) => {
                      const isCopied = copiedIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleCopy(reply.text, idx)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isCopied
                              ? "bg-[#ecfdf5] border-[#105e46] shadow-2xs"
                              : "bg-white hover:bg-[#fbfdfc] border-[#e5e7eb] hover:border-[#105e46]/60 shadow-2xs hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                                isCopied
                                  ? "bg-[#105e46] text-white border-[#105e46]"
                                  : "text-[#105e46] bg-[#ecfdf5] border-[#a7f3d0]/80"
                              }`}
                            >
                              {reply.type}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#105e46]">
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#105e46]" />
                                  <span className="text-[#105e46] font-medium">已复制到剪贴板</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>一键复制</span>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-[12.5px] font-medium text-gray-900 leading-relaxed mb-1.5">
                            {reply.text}
                          </p>
                          <p className="text-[10.5px] text-gray-500 leading-normal italic">
                            🎯 {reply.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
