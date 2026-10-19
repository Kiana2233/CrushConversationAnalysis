"use client";

import React, { useMemo, useState } from "react";
import { Message, OverallAnalysis, RadarDimension, TimelineMoment, KeywordCloudItem } from "@/types/chat";
import { calculateChatStats } from "@/lib/chat-stats";
import {
  Scale,
  Sparkles,
  MessageSquare,
  Clock,
  HelpCircle,
  Smile,
  Zap,
  Moon,
  Sun,
  Sunset,
  Sunrise,
  Radar,
  TrendingUp,
  Tag,
  Quote,
} from "lucide-react";

interface DataCompassTabProps {
  messages: Message[];
  myName: string;
  crushName: string;
  overallAnalysis?: OverallAnalysis;
}

export const DataCompassTab: React.FC<DataCompassTabProps> = ({
  messages,
  myName,
  crushName,
  overallAnalysis,
}) => {
  const stats = useMemo(
    () => calculateChatStats(messages, myName, crushName),
    [messages, myName, crushName]
  );

  const [selectedDimension, setSelectedDimension] = useState<RadarDimension | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<TimelineMoment | null>(null);

  const myDisplayName = myName || "我";
  const crushDisplayName = crushName || "Crush";

  const radarData = overallAnalysis?.radarDimensions;
  const timelineData = overallAnalysis?.timelineTrend;
  const keywordData = overallAnalysis?.keywords;

  if (messages.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
          <Scale className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700">暂无聊天数据</h4>
        <p className="text-xs text-gray-400 max-w-xs">
          导入微信聊天记录后，系统将秒级呈现双方字数、主动发起频率与投入度天平对比。
        </p>
      </div>
    );
  }

  // 计算雷达图多边形顶点坐标 (五边形)
  const renderRadarSvg = (dimensions: RadarDimension[]) => {
    const size = 220;
    const center = size / 2;
    const radius = 72;
    const count = dimensions.length;

    const getCoord = (index: number, val: number) => {
      const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
      const r = (val / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    // 背景网格环 (25%, 50%, 75%, 100%)
    const gridLevels = [0.25, 0.5, 0.75, 1];

    // 数据多边形路径点
    const polygonPoints = dimensions
      .map((d, i) => {
        const pt = getCoord(i, d.score);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");

    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* 背景同心五边形网格 */}
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

          {/* 轴线 */}
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

          {/* 数据渐变填充区域 */}
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          <polygon
            points={polygonPoints}
            fill="url(#radarGradient)"
            stroke="#10b981"
            strokeWidth="2"
            className="transition-all duration-500"
          />

          {/* 数据顶点与交互 */}
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
                  r={isHovered ? 5.5 : 4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="transition-all duration-300 group-hover:scale-125"
                />
              </g>
            );
          })}

          {/* 顶点文字标注 */}
          {dimensions.map((dim, i) => {
            const labelCoord = getCoord(i, 126);
            return (
              <text
                key={`label-${dim.dimension}`}
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10.5px] font-medium fill-gray-600 hover:fill-emerald-700 cursor-pointer transition-colors"
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

  // 计算情绪走势折线/面积图 (SVG 平滑曲线)
  const renderTimelineSvg = (moments: TimelineMoment[]) => {
    const width = 360;
    const height = 120;
    const padX = 24;
    const padTop = 15;
    const padBottom = 26;

    const count = moments.length;
    if (count < 2) return null;

    const coords = moments.map((m, i) => {
      const x = padX + (i / (count - 1)) * (width - 2 * padX);
      const y = height - padBottom - (m.score / 100) * (height - padTop - padBottom);
      return { x, y, moment: m };
    });

    // 简单平滑路径构造
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
      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 底部基线与参考线 */}
          <line
            x1={padX}
            y1={height - padBottom}
            x2={width - padX}
            y2={height - padBottom}
            stroke="#f1f5f9"
            strokeWidth="1.5"
          />

          {/* 面积与折线 */}
          <path d={areaD} fill="url(#timelineGrad)" />
          <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />

          {/* 节点点位 */}
          {coords.map((c, i) => {
            const isSelected = selectedMoment?.timeLabel === c.moment.timeLabel;
            return (
              <g
                key={i}
                className="cursor-pointer group"
                onClick={() => setSelectedMoment(c.moment)}
              >
                {c.moment.isHighlight && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="8"
                    fill="#f43f5e"
                    opacity="0.2"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? "5.5" : "4"}
                  fill="#ffffff"
                  stroke={c.moment.isHighlight ? "#e11d48" : "#f43f5e"}
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-125"
                />
                {/* 阶段名称 */}
                <text
                  x={c.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-gray-500"
                >
                  {c.moment.timeLabel}
                </text>
                {/* 分数气泡 */}
                <text
                  x={c.x}
                  y={c.y - 8}
                  textAnchor="middle"
                  className={`text-[9.5px] font-bold ${
                    c.moment.isHighlight ? "fill-rose-600" : "fill-gray-600"
                  }`}
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

  return (
    <div className="space-y-4 text-xs">
      {/* 1. 核心诊断综述卡片 */}
      <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-white rounded-2xl border border-emerald-100/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{stats.verdict.badge}</span>
          </span>
          <span className="text-[11px] text-gray-400">
            共 {stats.totalMessages} 条对话 · {stats.totalWords} 字
          </span>
        </div>

        <h4 className="text-sm font-bold text-gray-900 pt-0.5">
          {stats.verdict.title}
        </h4>
        <p className="text-gray-600 text-[11.5px] leading-relaxed">
          {stats.verdict.description}
        </p>

        <div className="pt-2 grid grid-cols-2 gap-2 border-t border-emerald-100/60">
          <div className="bg-white/70 p-2 rounded-xl border border-emerald-100/60">
            <span className="text-[10px] text-gray-400 block mb-0.5">发言篇幅比 (我 : 对方)</span>
            <span className="text-xs font-bold text-emerald-800">{stats.verdict.wordRatio}</span>
          </div>
          <div className="bg-white/70 p-2 rounded-xl border border-emerald-100/60">
            <span className="text-[10px] text-gray-400 block mb-0.5">主动破冰发起 (我 : 对方)</span>
            <span className="text-xs font-bold text-emerald-800">{stats.verdict.initiationRatio}</span>
          </div>
        </div>
      </div>

      {/* 2. 爱意天平：双方投入度双向柱状对比 */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>双方投入度天平对比</span>
          </div>
          <span className="text-[10.5px] text-gray-400">客观数据统计 · 即时生成</span>
        </div>

        {/* 角色标识栏 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-700 max-w-[120px] truncate" title={crushDisplayName}>
              {crushDisplayName} (对方)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700 max-w-[120px] truncate" title={myDisplayName}>
              {myDisplayName} (我方)
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
        </div>

        {/* 维度 1: 总字数篇幅 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>{stats.crushWords} 字 ({stats.crushWordPct}%)</span>
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-gray-400" />
              发言总字数
            </span>
            <span>{stats.myWords} 字 ({stats.myWordPct}%)</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-rose-400 transition-all duration-700"
              style={{ width: `${stats.crushWordPct}%` }}
              title={`对方贡献 ${stats.crushWordPct}%`}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${stats.myWordPct}%` }}
              title={`我方贡献 ${stats.myWordPct}%`}
            />
          </div>
        </div>

        {/* 维度 2: 单条平均字数 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>均条 {stats.crushAvgWords} 字</span>
            <span className="font-medium text-gray-700">单条详细度 (小作文 vs 短句)</span>
            <span>均条 {stats.myAvgWords} 字</span>
          </div>
          {(() => {
            const sum = stats.crushAvgWords + stats.myAvgWords || 1;
            const crushRatio = Math.round((stats.crushAvgWords / sum) * 100);
            const myRatio = 100 - crushRatio;
            return (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-rose-400 transition-all duration-700"
                  style={{ width: `${crushRatio}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${myRatio}%` }}
                />
              </div>
            );
          })()}
        </div>

        {/* 维度 3: 主动破冰开启话题次数 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>{stats.crushInitiations} 次 ({stats.crushInitiationPct}%)</span>
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              主动破冰开启新话题
            </span>
            <span>{stats.myInitiations} 次 ({stats.myInitiationPct}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-rose-400 transition-all duration-700"
              style={{ width: `${stats.crushInitiationPct}%` }}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${stats.myInitiationPct}%` }}
            />
          </div>
        </div>

        {/* 维度 4: 好奇心 / 提问率 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>提问率 {stats.crushQuestionRate}% ({stats.crushQuestions}次)</span>
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-blue-400" />
              提问率 (探索好奇心)
            </span>
            <span>提问率 {stats.myQuestionRate}% ({stats.myQuestions}次)</span>
          </div>
          {(() => {
            const sum = stats.crushQuestionRate + stats.myQuestionRate || 1;
            const crushRatio = Math.round((stats.crushQuestionRate / sum) * 100);
            const myRatio = 100 - crushRatio;
            return (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-rose-400 transition-all duration-700"
                  style={{ width: `${crushRatio}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${myRatio}%` }}
                />
              </div>
            );
          })()}
        </div>

        {/* 维度 5: 语气词与表情活跃度 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>{stats.crushExpressiveCount} 条</span>
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <Smile className="w-3 h-3 text-pink-400" />
              表情与趣味语气词
            </span>
            <span>{stats.myExpressiveCount} 条</span>
          </div>
          {(() => {
            const sum = stats.crushExpressiveCount + stats.myExpressiveCount || 1;
            const crushRatio = Math.round((stats.crushExpressiveCount / sum) * 100);
            const myRatio = 100 - crushRatio;
            return (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-rose-400 transition-all duration-700"
                  style={{ width: `${crushRatio}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${myRatio}%` }}
                />
              </div>
            );
          })()}
        </div>

        {/* 维度 6: 响应速度与秒回率 */}
        {(stats.crushQuickReplyRate !== null || stats.myQuickReplyRate !== null) && (
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-rose-50/50 rounded-xl border border-rose-100">
              <span className="text-[10px] text-gray-500 block">对方 5分钟秒回率</span>
              <span className="text-sm font-extrabold text-rose-600">
                {stats.crushQuickReplyRate !== null ? `${stats.crushQuickReplyRate}%` : "—"}
              </span>
              {stats.crushAvgReplyMinutes !== null && (
                <span className="text-[9.5px] text-gray-400 block">均回约 {stats.crushAvgReplyMinutes}分钟</span>
              )}
            </div>
            <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">我方 5分钟秒回率</span>
              <span className="text-sm font-extrabold text-emerald-600">
                {stats.myQuickReplyRate !== null ? `${stats.myQuickReplyRate}%` : "—"}
              </span>
              {stats.myAvgReplyMinutes !== null && (
                <span className="text-[9.5px] text-gray-400 block">均回约 {stats.myAvgReplyMinutes}分钟</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. AI 关系多维评估雷达图 */}
      {radarData && radarData.length >= 3 && (
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <Radar className="w-4 h-4 text-emerald-600" />
              <span>AI 关系多维评估雷达</span>
            </div>
            <span className="text-[10.5px] text-gray-400">点击顶点查看心理学简评</span>
          </div>

          {/* 雷达图 SVG */}
          {renderRadarSvg(radarData)}

          {/* 选中的维度犀利简评 */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-emerald-900 text-xs">
                {selectedDimension ? selectedDimension.dimension : radarData[0]?.dimension}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {selectedDimension ? selectedDimension.score : radarData[0]?.score} 分
              </span>
            </div>
            <p className="text-[11.5px] text-gray-600 leading-relaxed">
              {selectedDimension ? selectedDimension.comment : radarData[0]?.comment}
            </p>
          </div>
        </div>
      )}

      {/* 4. 对话情绪走势折线/面积图 */}
      {timelineData && timelineData.length >= 2 && (
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>对话情绪走势曲线</span>
            </div>
            <span className="text-[10.5px] text-gray-400">心动起伏 · 点击节点探寻细节</span>
          </div>

          {/* 走势图 SVG */}
          {renderTimelineSvg(timelineData)}

          {/* 选中节点名场面展示 */}
          {selectedMoment && (
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-900 text-xs flex items-center gap-1">
                  <span>{selectedMoment.timeLabel}</span>
                  {selectedMoment.isHighlight && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9.5px]">
                      高甜时刻
                    </span>
                  )}
                </span>
                <span className="font-bold text-rose-600 text-xs">
                  情绪指数: {selectedMoment.score}°
                </span>
              </div>
              <p className="text-[11.5px] text-gray-700 leading-relaxed">
                {selectedMoment.event}
              </p>
              {selectedMoment.quote && (
                <div className="flex items-start gap-1 text-[11px] text-gray-500 bg-white/70 p-2 rounded-lg border border-rose-100/70">
                  <Quote className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                  <span className="italic">“{selectedMoment.quote}”</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. 话题与关键词气泡云 */}
      {keywordData && keywordData.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>话题与专属关键词云</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 共同梗
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> 对方专属
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> 我方偏好
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {keywordData.map((item, idx) => {
              const colorClass =
                item.category === "shared"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : item.category === "crush"
                  ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                  : "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100";

              return (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all hover:scale-105 select-none ${colorClass}`}
                  title={`权重: ${item.weight} / 10 · ${
                    item.category === "shared"
                      ? "双方共同话题"
                      : item.category === "crush"
                      ? "对方常提"
                      : "我方常提"
                  }`}
                >
                  {item.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. 24小时互动活跃节奏 */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>24小时聊天时段分布</span>
          </div>
          <span className="text-[10.5px] text-gray-400">作息步调透视</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 清晨 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              stats.peakSlot === "morning"
                ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/40"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                清晨早起
              </span>
              <span className="text-[10.5px] font-bold text-gray-800">
                {stats.timeSlots.morning.pct}%
              </span>
            </div>
            <span className="text-[9.5px] text-gray-400 block">06:00 - 12:00</span>
          </div>

          {/* 午后 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              stats.peakSlot === "afternoon"
                ? "bg-sky-50/80 border-sky-300 ring-1 ring-sky-300/40"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                <Sun className="w-3.5 h-3.5 text-sky-500" />
                午后日常
              </span>
              <span className="text-[10.5px] font-bold text-gray-800">
                {stats.timeSlots.afternoon.pct}%
              </span>
            </div>
            <span className="text-[9.5px] text-gray-400 block">12:00 - 18:00</span>
          </div>

          {/* 黄金夜晚 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              stats.peakSlot === "evening"
                ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300/40"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                黄金夜晚
              </span>
              <span className="text-[10.5px] font-bold text-gray-800">
                {stats.timeSlots.evening.pct}%
              </span>
            </div>
            <span className="text-[9.5px] text-gray-400 block">18:00 - 23:00</span>
          </div>

          {/* 深夜密语 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              stats.peakSlot === "lateNight"
                ? "bg-purple-50/90 border-purple-300 ring-1 ring-purple-300/40"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                <Moon className="w-3.5 h-3.5 text-purple-600" />
                深夜密语
              </span>
              <span className="text-[10.5px] font-bold text-gray-800">
                {stats.timeSlots.lateNight.pct}%
              </span>
            </div>
            <span className="text-[9.5px] text-gray-400 block">23:00 - 06:00 (高甜时段)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
