"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Clock, MessageSquare, ChevronRight, Heart } from "lucide-react";
import { SessionSummary } from "@/types/chat";

interface SessionListProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (!isOpen) return null;

  const handleStartRename = (session: SessionSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleConfirmRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这条历史分析记录吗？")) {
      onDeleteSession(id);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <aside className="w-72 h-screen bg-[#f1f2f4] border-r border-[#dcdde0] flex flex-col shrink-0 select-none z-20 animate-in slide-in-from-left duration-200">
      {/* 顶部：新建分析按钮 */}
      <div className="p-3.5 border-b border-[#e2e3e6] flex items-center justify-between gap-2">
        <button
          onClick={onNewSession}
          className="flex-1 py-2 px-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-gray-800 hover:text-emerald-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer group"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>新建分析 / 开启新对话</span>
        </button>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          title="收起会话栏"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 会话列表标题 */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-400 font-medium">
        <span>历史记录 ({sessions.length})</span>
        <span className="text-[10px]">SQLite 本地安全存储</span>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-400 font-medium mb-1">暂无历史记录</p>
            <p className="text-[11px] text-gray-400">导入微信聊天后将自动归档至此</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isActive
                    ? "bg-white border-emerald-300 shadow-2xs"
                    : "bg-transparent hover:bg-white/70 border-transparent hover:border-gray-200"
                }`}
              >
                {/* 标题与操作栏 */}
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        autoFocus
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmRename(session.id, e);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 text-xs px-1.5 py-0.5 bg-white border border-emerald-400 rounded outline-none text-gray-800"
                      />
                      <button
                        onClick={(e) => handleConfirmRename(session.id, e)}
                        className="text-emerald-600 hover:text-emerald-700 p-0.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-800 truncate flex-1">
                        {session.title || "未命名会话"}
                      </span>

                      {/* 悬停操作按钮 */}
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          title="修改标题"
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          title="删除会话"
                          className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* 非悬停时展示时间 */}
                      <span className="text-[10px] text-gray-400 shrink-0 group-hover:hidden">
                        {formatTime(session.updatedAt)}
                      </span>
                    </>
                  )}
                </div>

                {/* 副信息：好感度 & 消息摘要 */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 gap-1.5">
                  <span className="truncate flex-1">
                    {session.crushName ? `对方: ${session.crushName}` : `${session.messageCount} 条消息`}
                  </span>

                  {session.affectionScore !== null && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-100 shrink-0 font-medium">
                      {session.affectionScore}分
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
