"use client";

import React, { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { Sparkles, Info, HelpCircle } from "lucide-react";

interface ChatMessageListProps {
  messages: Message[];
  crushName: string;
  isAnalyzing: boolean;
  onSelectMessageDetail?: (msg: Message) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  crushName,
  isAnalyzing,
  onSelectMessageDetail,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 消息自动滚到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing]);

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
      className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6 bg-[#f7f7f8]"
    >
      {messages.map((msg, index) => {
        const showTimestamp = msg.timestamp && msg.timestamp !== lastTimestamp;
        if (showTimestamp) {
          lastTimestamp = msg.timestamp;
        }

        const isMe = msg.isMe;
        const initial = isMe
          ? "我"
          : crushName
          ? crushName.slice(0, 1).toUpperCase()
          : "V";

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
              className={`flex items-start gap-2.5 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {/* 对方头像（左侧） */}
              {!isMe && (
                <div className="w-8 h-8 rounded bg-[#dcdde0] text-[#4a4a4d] text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs select-none">
                  {initial}
                </div>
              )}

              {/* 消息正文与微分析标签 */}
              <div
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                } max-w-[78%] md:max-w-[65%]`}
              >
                {/* 气泡本体 */}
                <div
                  onClick={() => onSelectMessageDetail?.(msg)}
                  className={`group relative px-3 py-2 rounded-lg text-[13.5px] leading-relaxed break-words shadow-2xs cursor-pointer transition-all ${
                    isMe
                      ? "bg-[#95ec69] text-[#111827] rounded-tr-none hover:brightness-98"
                      : "bg-white text-[#111827] border border-[#e5e5e7] rounded-tl-none hover:border-gray-300"
                  }`}
                  title="点击查看单句心理学深度剖析"
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
                            {msg.analysis?.emotion || "分析中"}
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
                            {msg.analysis?.intent || "分析中"}
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
                          {msg.analysis?.feedback || "分析中"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 我方微头像（右侧） */}
              {isMe && (
                <div className="w-8 h-8 rounded bg-[#dcdde0] text-[#4a4a4d] text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs select-none">
                  {initial}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
