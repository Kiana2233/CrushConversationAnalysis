"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Message,
  OverallAnalysis,
  SuggestedReply,
  RadarDimension,
  TimelineMoment,
} from "@/types/chat";
import { calculateChatStats } from "@/lib/chat-stats";
import {
  Heart,
  TrendingUp,
  Sparkles,
  Scale,
  Radar,
  Tag,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
  Clock,
  Zap,
  HelpCircle,
  Smile,
  Quote,
} from "lucide-react";
import { getAvatarInitial } from "@/lib/parser";

interface ReportDocumentViewProps {
  messages: Message[];
  crushName: string;
  myName: string;
  relationshipStatus: string;
  overallAnalysis?: OverallAnalysis;
  onOpenSandbox: () => void;
  onExportPoster?: () => void;
}

export const ReportDocumentView: React.FC<ReportDocumentViewProps> = ({
  messages,
  crushName,
  myName,
  relationshipStatus,
  overallAnalysis,
  onOpenSandbox,
  onExportPoster,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<RadarDimension | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<TimelineMoment | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(
    () => calculateChatStats(messages, myName, crushName),
    [messages, myName, crushName]
  );

  const myDisplayName = myName || "我";
  const crushDisplayName = crushName || "Crush";

  const radarData = overallAnalysis?.radarDimensions;
  const timelineData = overallAnalysis?.timelineTrend;
  const keywordData = overallAnalysis?.keywords;

  const handleCopyReply = (reply: SuggestedReply) => {
    navigator.clipboard.writeText(reply.text);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 雷达图绘制
  const renderRadarSvg = (dimensions: RadarDimension[]) => {
    const size = 200;
    const center = size / 2;
    const radius = 68;
    const count = dimensions.length;

    const getCoord = (index: number, val: number) => {
      const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
      const r = (val / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    const gridLevels = [0.25, 0.5, 0.75, 1];
    const polygonPoints = dimensions
      .map((d, i) => {
        const pt = getCoord(i, d.score);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");

    return (
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg width={size} height={size} className="overflow-visible">
          {gridLevels.map((lvl) => {
            const pts = Array.from({ length: count })
              .map((_, i) => {
                const pt = getCoord(i, lvl * 100);
                return `${pt.x},${pt.y}`;
              })
              .join(" ");
            return (
              <polygon
                key={lvl}
                points={pts}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={lvl === 1 ? "1.2" : "0.8"}
                strokeDasharray={lvl < 1 ? "3,3" : undefined}
              />
            );
          })}

          {Array.from({ length: count }).map((_, i) => {
            const pt = getCoord(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={pt.x}
                y2={pt.y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          <defs>
            <linearGradient id="docRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#105e46" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <polygon
            points={polygonPoints}
            fill="url(#docRadarGrad)"
            stroke="#105e46"
            strokeWidth="2"
            className="transition-all duration-500"
          />

          {dimensions.map((dim, i) => {
            const pt = getCoord(i, dim.score);
            const isHovered = selectedDimension?.dimension === dim.dimension;
            return (
              <g
                key={dim.dimension}
                className="cursor-pointer group"
                onClick={() => setSelectedDimension(dim)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#105e46"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {dimensions.map((dim, i) => {
            const labelCoord = getCoord(i, 122);
            return (
              <text
                key={`label-${dim.dimension}`}
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-medium fill-gray-600 hover:fill-[#105e46] cursor-pointer"
                onClick={() => setSelectedDimension(dim)}
              >
                {dim.dimension}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // 情绪走势图绘制
  const renderTimelineSvg = (moments: TimelineMoment[]) => {
    const width = 480;
    const height = 110;
    const padX = 24;
    const padTop = 15;
    const padBottom = 24;

    const count = moments.length;
    if (count < 2) return null;

    const coords = moments.map((m, i) => {
      const x = padX + (i / (count - 1)) * (width - 2 * padX);
      const y = height - padBottom - (m.score / 100) * (height - padTop - padBottom);
      return { x, y, moment: m };
    });

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padBottom} L ${coords[0].x} ${height - padBottom} Z`;

    return (
      <div className="relative my-2">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="docTimelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#105e46" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#105e46" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={padX}
            y1={height - padBottom}
            x2={width - padX}
            y2={height - padBottom}
            stroke="#f1f5f9"
            strokeWidth="1.5"
          />

          <path d={areaD} fill="url(#docTimelineGrad)" />
          <path d={pathD} fill="none" stroke="#105e46" strokeWidth="2.5" strokeLinecap="round" />

          {coords.map((c, i) => {
            const isSelected = selectedMoment?.timeLabel === c.moment.timeLabel;
            return (
              <g
                key={i}
                className="cursor-pointer group"
                onClick={() => setSelectedMoment(c.moment)}
              >
                {c.moment.isHighlight && (
                  <circle cx={c.x} cy={c.y} r="7" fill="#105e46" opacity="0.2" className="animate-ping" />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? "5" : "3.5"}
                  fill="#ffffff"
                  stroke={c.moment.isHighlight ? "#0c4a37" : "#105e46"}
                  strokeWidth="2.5"
                />
                <text x={c.x} y={height - 6} textAnchor="middle" className="text-[9.5px] font-medium fill-gray-400">
                  {c.moment.timeLabel}
                </text>
                <text
                  x={c.x}
                  y={c.y - 7}
                  textAnchor="middle"
                  className={`text-[9.5px] font-bold ${c.moment.isHighlight ? "fill-[#105e46]" : "fill-gray-500"}`}
                >
                  {c.moment.score}°
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#f4f5f7]">
        <div className="w-14 h-14 rounded-2xl bg-white text-gray-400 flex items-center justify-center shadow-xs">
          <Heart className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">等待载入微信聊天记录</h3>
        <p className="text-xs text-gray-400 max-w-sm">
          通过左侧导航导入微信聊天文本，即可像 TraceMemo 一样秒级排版生成恋爱全息研判报告。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f4f5f7] overflow-y-auto relative select-none">
      {/* 居中浮动纸张式报告画布 (TraceMemo 核心视觉) */}
      <div className="flex-1 p-6 md:p-8 flex justify-center">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200/70 p-6 md:p-8 space-y-6 transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          {/* 1. 报告顶头 Header Banner (含标题与头像群) */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-100 gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-gray-900 tracking-tight">
                  {crushDisplayName} · 恋爱全息研判报告
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#105e46] border border-emerald-200">
                  {relationshipStatus}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                {mounted ? new Date().toLocaleDateString() : ""} · 基于已加载的 {messages.length} 条真实聊天记录
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pt-1">
                {overallAnalysis?.affectionSummary ||
                  stats.verdict.description ||
                  "双方交流顺畅，保持着良好的沟通节奏与生活分享欲。"}
              </p>
            </div>

            {/* 双方头像堆叠徽章 */}
            <div className="flex -space-x-2 shrink-0 pt-1">
              <div
                className="w-9 h-9 rounded-full bg-[#105e46] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title={`对方: ${crushDisplayName}`}
              >
                {getAvatarInitial(crushDisplayName, 1)}
              </div>
              <div
                className="w-9 h-9 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title={`我方: ${myDisplayName}`}
              >
                {getAvatarInitial(myDisplayName, 1)}
              </div>
            </div>
          </div>

          {/* 2. 四大核心指标小方块 (TraceMemo 经典 4-Box Stat Grid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Box 1: 好感度得分 */}
            <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#e5ece9] text-center space-y-0.5">
              <span className="text-2xl font-black text-[#105e46]">
                {overallAnalysis?.affectionScore ?? 80}
              </span>
              <span className="text-[10.5px] font-semibold text-gray-500 block">好感度指数</span>
              <span className="text-[9.5px] text-gray-400 block truncate">
                {overallAnalysis?.affectionStage ?? "暧昧升温中"}
              </span>
            </div>

            {/* Box 2: 发言篇幅比 */}
            <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#e5ece9] text-center space-y-0.5">
              <span className="text-lg font-black text-gray-800">
                {stats.verdict.wordRatio}
              </span>
              <span className="text-[10.5px] font-semibold text-gray-500 block">发言篇幅比</span>
              <span className="text-[9.5px] text-gray-400 block">我方 : 对方</span>
            </div>

            {/* Box 3: 5分钟秒回率 */}
            <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#e5ece9] text-center space-y-0.5">
              <span className="text-lg font-black text-gray-800">
                {stats.crushQuickReplyRate !== null ? `${stats.crushQuickReplyRate}%` : "3.2 m"}
              </span>
              <span className="text-[10.5px] font-semibold text-gray-500 block">对方秒回率</span>
              <span className="text-[9.5px] text-gray-400 block">5分钟内回复</span>
            </div>

            {/* Box 4: 破冰发起次数 */}
            <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#e5ece9] text-center space-y-0.5">
              <span className="text-lg font-black text-gray-800">
                {stats.myInitiations + stats.crushInitiations} 次
              </span>
              <span className="text-[10.5px] font-semibold text-gray-500 block">破冰发起</span>
              <span className="text-[9.5px] text-gray-400 block">{stats.verdict.initiationRatio}</span>
            </div>
          </div>

          {/* 3. Section: 今日讨论热点与关键词 (带绿色垂直引导条) */}
          {keywordData && keywordData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#105e46] rounded-full inline-block" />
                  <h3 className="text-xs font-bold text-gray-900">今日讨论热点与专属关键词</h3>
                </div>
                <span className="text-[10px] text-gray-400">双方共鸣梗与高频词</span>
              </div>

              <div className="p-3.5 bg-[#fbfcfb] rounded-xl border border-[#edf3f0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-gray-800 flex items-center gap-1.5">
                    <span>高频心动话题</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 font-bold">
                      高热
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400">词频加权</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keywordData.map((k, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border select-none transition-transform hover:scale-105 ${
                        k.category === "shared"
                          ? "bg-emerald-50/70 text-[#105e46] border-emerald-200"
                          : k.category === "crush"
                          ? "bg-rose-50/70 text-rose-700 border-rose-200"
                          : "bg-sky-50/70 text-sky-700 border-sky-200"
                      }`}
                    >
                      {k.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Section: 双方投入度天平对比 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-[#105e46] rounded-full inline-block" />
                <h3 className="text-xs font-bold text-gray-900">双方投入度天平对比</h3>
              </div>
              <span className="text-[10px] text-gray-400">客观字数与互动节奏</span>
            </div>

            <div className="p-4 bg-[#fbfcfb] rounded-xl border border-[#edf3f0] space-y-3 text-xs">
              {/* 总字数 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>{stats.crushWords} 字 ({stats.crushWordPct}%)</span>
                  <span className="font-medium text-gray-700">总发言篇幅</span>
                  <span>{stats.myWords} 字 ({stats.myWordPct}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-rose-400" style={{ width: `${stats.crushWordPct}%` }} />
                  <div className="h-full bg-[#105e46]" style={{ width: `${stats.myWordPct}%` }} />
                </div>
              </div>

              {/* 均条字数 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>均条 {stats.crushAvgWords} 字</span>
                  <span className="font-medium text-gray-700">单条详细度 (小作文 vs 简回)</span>
                  <span>均条 {stats.myAvgWords} 字</span>
                </div>
                {(() => {
                  const sum = stats.crushAvgWords + stats.myAvgWords || 1;
                  const cRatio = Math.round((stats.crushAvgWords / sum) * 100);
                  return (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-rose-400" style={{ width: `${cRatio}%` }} />
                      <div className="h-full bg-[#105e46]" style={{ width: `${100 - cRatio}%` }} />
                    </div>
                  );
                })()}
              </div>

              {/* 好奇心提问率 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>提问率 {stats.crushQuestionRate}%</span>
                  <span className="font-medium text-gray-700">好奇心探索欲 (提问率)</span>
                  <span>提问率 {stats.myQuestionRate}%</span>
                </div>
                {(() => {
                  const sum = stats.crushQuestionRate + stats.myQuestionRate || 1;
                  const cRatio = Math.round((stats.crushQuestionRate / sum) * 100);
                  return (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-rose-400" style={{ width: `${cRatio}%` }} />
                      <div className="h-full bg-[#105e46]" style={{ width: `${100 - cRatio}%` }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 5. Section: AI 关系多维评估雷达图 */}
          {radarData && radarData.length >= 3 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#105e46] rounded-full inline-block" />
                  <h3 className="text-xs font-bold text-gray-900">AI 关系多维评估雷达</h3>
                </div>
                <span className="text-[10px] text-gray-400">点击顶点查看心理学简评</span>
              </div>

              <div className="p-4 bg-[#fbfcfb] rounded-xl border border-[#edf3f0] space-y-2">
                {renderRadarSvg(radarData)}

                <div className="p-2.5 bg-white rounded-lg border border-gray-200/80 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#105e46]">
                      {selectedDimension ? selectedDimension.dimension : radarData[0]?.dimension}
                    </span>
                    <span className="font-bold text-gray-800">
                      {selectedDimension ? selectedDimension.score : radarData[0]?.score} 分
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {selectedDimension ? selectedDimension.comment : radarData[0]?.comment}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Section: 对话情绪起伏走势曲线 */}
          {timelineData && timelineData.length >= 2 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#105e46] rounded-full inline-block" />
                  <h3 className="text-xs font-bold text-gray-900">对话情绪起伏走势曲线</h3>
                </div>
                <span className="text-[10px] text-gray-400">心动波动波峰波谷</span>
              </div>

              <div className="p-4 bg-[#fbfcfb] rounded-xl border border-[#edf3f0] space-y-2">
                {renderTimelineSvg(timelineData)}

                {selectedMoment && (
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#105e46]">{selectedMoment.timeLabel}</span>
                      <span className="font-bold text-gray-800">{selectedMoment.score}°</span>
                    </div>
                    <p className="text-[11px] text-gray-600">{selectedMoment.event}</p>
                    {selectedMoment.quote && (
                      <p className="text-[10.5px] text-gray-400 italic">“{selectedMoment.quote}”</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. Section: 僚机建议与下一步策略 */}
          {overallAnalysis && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#105e46] rounded-full inline-block" />
                  <h3 className="text-xs font-bold text-gray-900">僚机战术与下一步行动策略</h3>
                </div>
                <button
                  onClick={onOpenSandbox}
                  className="text-[10.5px] font-semibold text-[#105e46] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0] hover:bg-[#d1fae5] cursor-pointer transition-colors"
                >
                  去沙盒实战推演 →
                </button>
              </div>

              <div className="p-3.5 bg-[#fbfcfb] rounded-xl border border-[#edf3f0] space-y-2 text-xs">
                <p className="text-gray-700 leading-relaxed text-[11.5px]">
                  💡 <strong>行动指南：</strong>{overallAnalysis.nextStepAdvice}
                </p>

                {overallAnalysis.suggestedReplies && overallAnalysis.suggestedReplies.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 block">三大实战战术回复（点击一键复制发微信）：</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {overallAnalysis.suggestedReplies.slice(0, 3).map((r) => {
                        const isCopied = copiedId === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleCopyReply(r)}
                            title={r.rationale}
                            className="p-2.5 bg-white rounded-xl border border-gray-200/90 hover:border-[#105e46] hover:shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-[#105e46] bg-[#ecfdf5] border border-[#a7f3d0]/80 px-1.5 py-0.2 rounded">
                                {r.type}
                              </span>
                              {isCopied ? (
                                <span className="text-[10px] text-[#105e46] flex items-center gap-0.5 font-medium">
                                  <Check className="w-3 h-3" /> 已复制
                                </span>
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400 hover:text-[#105e46]" />
                              )}
                            </div>
                            <p className="text-[11.5px] text-gray-800 line-clamp-3 leading-relaxed mb-1 font-sans">{r.text}</p>
                            {r.rationale && (
                              <p className="text-[10px] text-gray-400 italic line-clamp-1 border-t border-gray-100 pt-1 mt-auto">
                                🎯 {r.rationale}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部缩放工具条 (TraceMemo 经典底部工具栏) */}
      <div className="sticky bottom-3 mx-auto z-10 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-gray-200 shadow-sm flex items-center gap-3 text-xs text-gray-600">
        <button
          onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
          className="hover:text-gray-900 p-1 cursor-pointer"
          title="缩小"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-medium w-9 text-center">{zoomLevel}%</span>
        <button
          onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
          className="hover:text-gray-900 p-1 cursor-pointer"
          title="放大"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3 bg-gray-300" />

        <button
          onClick={() => setZoomLevel(100)}
          className="text-[11px] hover:text-[#105e46] cursor-pointer"
        >
          原始大小
        </button>

        {onExportPoster && (
          <>
            <span className="w-px h-3 bg-gray-300" />
            <button
              onClick={onExportPoster}
              className="text-[11px] text-[#105e46] hover:text-[#0c4a37] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>保存海报</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
