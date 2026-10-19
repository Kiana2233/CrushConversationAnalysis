"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { SessionSummary } from "@/types/chat";
import { getAvatarInitial } from "@/lib/parser";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const formatCardDate = (timestamp: number) => {
    if (!timestamp || !mounted) return "";
    const d = new Date(timestamp);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 按搜索条件过滤
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.crushName && s.crushName.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // 按日期分组 (今日, 昨日, 更早)
  const groupedSessions = useMemo(() => {
    if (!mounted) {
      return { 历史档案: filteredSessions };
    }
    const groups: { [key: string]: SessionSummary[] } = {};
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

    filteredSessions.forEach((s) => {
      const d = new Date(s.updatedAt || s.createdAt);
      const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let groupKey = "更早之前";
      if (dStr === todayStr) groupKey = "今日";
      else if (dStr === yesterdayStr) groupKey = "昨日";
      else groupKey = `${d.getMonth() + 1}月${d.getDate()}日`;

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(s);
    });

    return groups;
  }, [filteredSessions]);

  return (
    <aside className="w-[280px] h-screen bg-[#fafbfc] border-r border-[#e5e7eb] flex flex-col shrink-0 select-none z-20">
      {/* 顶部标题与管理中心 */}
      <div className="p-4 pb-3 border-b border-[#f0f1f3] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">AI 研判档案</h2>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-full">
                {sessions.length}
              </span>
            </div>
            <p className="text-[10.5px] text-gray-400 pt-0.5">已生成报告与会话管理</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索框 (TraceMemo 风格) */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索聊天或 Crush 档案..."
            className="w-full bg-[#f1f3f5] focus:bg-white border border-transparent focus:border-[#105e46]/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* TraceMemo 经典墨绿色主按钮: + 新建日报/新建研判 */}
        <button
          onClick={onNewSession}
          className="w-full py-2 bg-[#105e46] hover:bg-[#0c4a37] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ 导入新聊天 / 开启研判</span>
        </button>
      </div>

      {/* 历史档案分组列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 font-medium">暂无匹配档案</p>
            <p className="text-[11px] text-gray-400">导入微信聊天记录后将自动归档</p>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([groupTitle, groupItems]) => (
            <div key={groupTitle} className="space-y-1.5">
              {/* 分组时间头 (如: 今日, 昨日) */}
              <div className="px-1 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                {groupTitle}
              </div>

              {/* 档案卡片流 */}
              {groupItems.map((session) => {
                const isActive = session.id === currentSessionId;
                const isEditing = editingId === session.id;
                const initial = getAvatarInitial(session.crushName || session.title || "Crush", 1);

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-[#e8f5f0] border-[#b2e2d0] shadow-2xs"
                        : "bg-white hover:bg-gray-50/80 border-gray-200/70 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* 头像 */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                          isActive
                            ? "bg-[#105e46] text-white"
                            : "bg-[#eef1f3] text-gray-600 group-hover:bg-[#e4e8eb]"
                        }`}
                      >
                        {initial}
                      </div>

                      {/* 文本内容 */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              autoFocus
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirmRename(session.id, e);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="flex-1 text-xs px-1.5 py-0.5 bg-white border border-[#105e46] rounded outline-none text-gray-800"
                            />
                            <button
                              onClick={(e) => handleConfirmRename(session.id, e)}
                              className="text-[#105e46] hover:text-[#0c4a37] p-0.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleCancelRename} className="text-gray-400 p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                isActive ? "text-[#105e46]" : "text-gray-900"
                              }`}
                            >
                              {session.title || session.crushName || "未命名会话"}
                            </span>

                            {/* 悬停快捷按钮 */}
                            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={(e) => handleStartRename(session, e)}
                                title="重命名"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(session.id, e)}
                                title="删除"
                                className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-gray-200/60"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 时间戳 */}
                        <div className="text-[10px] text-gray-400 mb-1">
                          {formatCardDate(session.updatedAt || session.createdAt)}
                        </div>

                        {/* 底部副信息 (消息数 & 好感度标签) */}
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-gray-500">{session.messageCount} 条消息</span>

                          {session.affectionScore !== null ? (
                            <span className="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-rose-50 text-rose-600 border border-rose-100">
                              {session.affectionScore}分 · {session.affectionStage || "已研判"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">本地已归档</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
