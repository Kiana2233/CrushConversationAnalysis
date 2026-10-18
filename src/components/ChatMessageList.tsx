"use client";

import React, { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { Sparkles, Info, HelpCircle, Trash2, Check, CheckSquare } from "lucide-react";
import { getAvatarInitial } from "@/lib/parser";

interface ChatMessageListProps {
  messages: Message[];
  crushName: string;
  isAnalyzing: boolean;
  onSelectMessageDetail?: (msg: Message) => void;
  onDeleteMessage?: (id: string) => void;
  isSelectionMode?: boolean;
  selectedMessageIds?: string[];
  onToggleSelectMessage?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBatchDelete?: (ids: string[]) => void;
  onExitSelectionMode?: () => void;
  onClearAllMessages?: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  crushName,
  isAnalyzing,
  onSelectMessageDetail,
  onDeleteMessage,
  isSelectionMode = false,
  selectedMessageIds = [],
  onToggleSelectMessage,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onExitSelectionMode,
  onClearAllMessages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 消息自动滚到底部（仅在非管理多选模式下）
  useEffect(() => {
    if (scrollRef.current && !isSelectionMode) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isAnalyzing, isSelectionMode]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f7f7f8] select-none">
        <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-400 mb-4">
          <Sparkles className="w-8 h-8 text-emerald-500/80 animate-pulse-subtle" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1.5">
          暂无微信聊天记录
        </h3>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          在电脑微信或手机中多选聊天记录并点击“复制”，直接按{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-200/80 border border-gray-300/80 rounded text-[11px] font-mono text-gray-700">
            Ctrl + V
          </kbd>{" "}
          粘贴导入，即可自动识别发言人并深度分析好感度。
        </p>
      </div>
    );
  }

  // 计算时间戳展示：如果上一条消息时间和当前相同，可按微信规则合理规整
  let lastTimestamp = "";

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6 bg-[#f7f7f8] relative"
    >
      {messages.map((msg, index) => {
        const showTimestamp = msg.timestamp && msg.timestamp !== lastTimestamp;
        if (showTimestamp) {
          lastTimestamp = msg.timestamp;
        }

        const isMe = msg.isMe;
        const initial = isMe
          ? "我"
          : getAvatarInitial(crushName || msg.sender || "对方", 1).toUpperCase();
        const isSelected = selectedMessageIds.includes(msg.id);

        const handleBubbleClick = () => {
          if (isSelectionMode) {
            onToggleSelectMessage?.(msg.id);
          } else {
            onSelectMessageDetail?.(msg);
          }
        };

        return (
          <div key={msg.id || index} className="space-y-3">
            {/* 居中时间戳 */}
            {showTimestamp && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] text-[#8e8e93] font-normal tracking-wide px-2 py-0.5 rounded">
                  {msg.timestamp}
                </span>
              </div>
            )}

            {/* 消息气泡行 */}
            <div
              className={`flex items-start gap-2.5 group/msg ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {/* 多选模式复选框（我方在最右侧，对方在最左侧） */}
              {isSelectionMode && !isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectMessage?.(msg.id);
                  }}
                  className="self-center shrink-0 p-1 rounded-full transition-transform active:scale-90"
                  title={isSelected ? "取消选择" : "选中"}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              )}

              {/* 对方头像（左侧） */}
              {!isMe && (
                <div className="w-8 h-8 rounded bg-[#dcdde0] text-[#4a4a4d] text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs select-none">
                  {initial}
                </div>
              )}

              {/* 我方消息悬浮快捷删除按钮 */}
              {!isSelectionMode && onDeleteMessage && isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(msg.id);
                  }}
                  className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 self-center shrink-0"
                  title="删除此条消息"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 消息正文与微分析标签 */}
              <div
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                } max-w-[78%] md:max-w-[65%]`}
              >
                {/* 气泡本体 */}
                <div
                  onClick={handleBubbleClick}
                  className={`group relative px-3 py-2 rounded-lg text-[13.5px] leading-relaxed break-words shadow-2xs cursor-pointer transition-all ${
                    isMe
                      ? "bg-[#95ec69] text-[#111827] rounded-tr-none hover:brightness-98"
                      : "bg-white text-[#111827] border border-[#e5e5e7] rounded-tl-none hover:border-gray-300"
                  } ${
                    isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
                  }`}
                  title={isSelectionMode ? "点击勾选/取消勾选" : "点击查看单句心理学深度剖析"}
                >
                  <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                </div>

                {/* 气泡下方的微观分析指标 (情绪 / 意图 / 发挥点评) */}
                <div
                  className={`mt-1.5 flex flex-wrap gap-2 text-[10.5px] select-none ${
                    isMe ? "justify-end text-[#8e8e93]" : "justify-start text-[#8e8e93]"
                  }`}
                >
                  {!isMe ? (
                    // 对方消息分析
                    <>
                      <div className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                        <span className="text-gray-400">情绪</span>
                        {isAnalyzing && !msg.analysis?.emotion ? (
                          <span className="text-amber-500 animate-pulse">分析中...</span>
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {msg.analysis?.emotion || "友好互动"}
                          </span>
                        )}
                      </div>

                      <span className="text-gray-300">·</span>

                      <div className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                        <span className="text-gray-400">意图</span>
                        {isAnalyzing && !msg.analysis?.intent ? (
                          <span className="text-amber-500 animate-pulse">分析中...</span>
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {msg.analysis?.intent || "日常交流"}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    // 我方消息分析
                    <div className="flex items-center gap-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                      {isAnalyzing && !msg.analysis?.feedback ? (
                        <span className="text-amber-500 animate-pulse">分析中...</span>
                      ) : (
                        <span>
                          {msg.analysis?.feedback || "表达自然平稳"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 对方消息悬浮快捷删除按钮 */}
              {!isSelectionMode && onDeleteMessage && !isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(msg.id);
                  }}
                  className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 self-center shrink-0"
                  title="删除此条消息"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 我方微头像（右侧） */}
              {isMe && (
                <div className="w-8 h-8 rounded bg-[#dcdde0] text-[#4a4a4d] text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs select-none">
                  {initial}
                </div>
              )}

              {/* 我方多选模式复选框（在最右侧） */}
              {isSelectionMode && isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectMessage?.(msg.id);
                  }}
                  className="self-center shrink-0 p-1 rounded-full transition-transform active:scale-90"
                  title={isSelected ? "取消选择" : "选中"}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* 底部悬浮批量管理栏 */}
      {isSelectionMode && (
        <div className="sticky bottom-2 left-0 right-0 mx-auto max-w-lg z-30 bg-[#1c1c1e]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300">
              已选 <strong className="text-emerald-400 font-semibold">{selectedMessageIds.length}</strong> / {messages.length} 条
            </span>
            <button
              type="button"
              onClick={selectedMessageIds.length === messages.length ? onClearSelection : onSelectAll}
              className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              {selectedMessageIds.length === messages.length ? "取消全选" : "全选"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onClearAllMessages && (
              <button
                type="button"
                onClick={onClearAllMessages}
                className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                title="清空当前会话全部聊天记录"
              >
                清空全部
              </button>
            )}
            <button
              type="button"
              disabled={selectedMessageIds.length === 0}
              onClick={() => onBatchDelete?.(selectedMessageIds)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除 ({selectedMessageIds.length})</span>
            </button>
            <button
              type="button"
              onClick={onExitSelectionMode}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors font-medium"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
