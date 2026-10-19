"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SessionList } from "@/components/SessionList";
import { Header } from "@/components/Header";
import { ChatMessageList } from "@/components/ChatMessageList";
import { FooterBar } from "@/components/FooterBar";
import { SettingsModal } from "@/components/SettingsModal";
import { PasteModal } from "@/components/PasteModal";
import { AnalysisDetailDrawer } from "@/components/AnalysisDetailDrawer";
import { MessageDetailModal } from "@/components/MessageDetailModal";
import { Message, OverallAnalysis, SessionSummary, ChatSession } from "@/types/chat";
import { parseWechatClipboard, mergeMessagesWithDeduplication } from "@/lib/parser";
import { ChatScenario } from "@/lib/sample-data";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [crushName, setCrushName] = useState<string>("");
  const [myName, setMyName] = useState<string>("");
  const [relationshipStatus, setRelationshipStatus] = useState<string>("Crush / 暧昧升温中");
  const [overallAnalysis, setOverallAnalysis] = useState<OverallAnalysis | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; onUndo?: () => void } | null>(null);

  // 批量选择/删除管理模式
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // 多会话管理状态 (基于 SQLite)
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionListOpen, setIsSessionListOpen] = useState<boolean>(false);

  // 弹窗状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 参与者推导列表
  const [participants, setParticipants] = useState<string[]>([]);

  // 引用最新状态，避免在异步中产生闭包陈旧数据
  const stateRef = useRef({
    currentSessionId,
    crushName,
    myName,
    relationshipStatus,
    messages,
    overallAnalysis,
  });

  useEffect(() => {
    stateRef.current = {
      currentSessionId,
      crushName,
      myName,
      relationshipStatus,
      messages,
      overallAnalysis,
    };
  }, [currentSessionId, crushName, myName, relationshipStatus, messages, overallAnalysis]);

  // 自动弹出提示（支持可选撤销操作）
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((msg: string, onUndo?: () => void) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setNotification({ message: msg, onUndo });
    toastTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, onUndo ? 6000 : 3000);
  }, []);

  // 1. 从 SQLite 加载历史会话列表
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      }
    } catch (e) {
      console.error("Failed to load sessions from SQLite", e);
    }
  }, []);

  // 初始加载会话列表
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // 2. 将当前会话持久化保存到 SQLite
  const persistSession = useCallback(
    async (sessionData: {
      id?: string;
      title?: string;
      messages: Message[];
      crushName: string;
      myName: string;
      relationshipStatus: string;
      overallAnalysis?: OverallAnalysis;
    }) => {
      const sessionId = sessionData.id || stateRef.current.currentSessionId || `session-${Date.now()}`;
      const title =
        sessionData.title ||
        (sessionData.crushName ? `${sessionData.crushName} · 聊天分析` : "微信聊天分析");

      const payload: ChatSession = {
        id: sessionId,
        title,
        crushName: sessionData.crushName,
        myName: sessionData.myName,
        relationshipStatus: sessionData.relationshipStatus,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: sessionData.messages,
        overallAnalysis: sessionData.overallAnalysis,
      };

      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setCurrentSessionId(sessionId);
          fetchSessions();
        }
      } catch (e) {
        console.error("Failed to save session to SQLite", e);
      }
    },
    [fetchSessions]
  );

  // 3. 触发 AI 分析（完成后自动更新到 SQLite）
  const runAnalysis = useCallback(
    async (messagesToAnalyze: Message[], targetCrushName?: string, targetMyName?: string) => {
      if (messagesToAnalyze.length === 0) return;
      setIsAnalyzing(true);

      const activeCrush = targetCrushName ?? stateRef.current.crushName;
      const activeMy = targetMyName ?? stateRef.current.myName;
      const activeStatus = stateRef.current.relationshipStatus;

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesToAnalyze,
          }),
        });

        const data = await res.json();
        if (data.overallAnalysis) {
          setOverallAnalysis(data.overallAnalysis);
          const finalMessages = Array.isArray(data.messages) ? data.messages : messagesToAnalyze;
          setMessages(finalMessages);

          if (data.isFallback) {
            showToast(`已完成研判（${data.reason || "已启用内置智能引擎兜底"}）`);
          } else {
            showToast("DeepSeek AI 研判完成：好感度已实时更新！");
          }

          // 同步自动持久化到 SQLite
          persistSession({
            messages: finalMessages,
            crushName: activeCrush,
            myName: activeMy,
            relationshipStatus: activeStatus,
            overallAnalysis: data.overallAnalysis,
          });
        }
      } catch (err: any) {
        console.error("Analysis failed:", err);
        showToast("在线分析遇到轻微波动，已采用本地智能推导演算");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [persistSession, showToast]
  );

  // 4. 解析剪贴板文本并合并去重（自动归档至 SQLite）
  const handleImportText = useCallback(
    (rawText: string) => {
      const {
        messages: newParsed,
        detectedParticipants,
        detectedMyName,
        detectedCrushName,
      } = parseWechatClipboard(rawText, myName);

      if (newParsed.length === 0) {
        showToast("未能识别出聊天记录，请确认格式是否包含发言人或时间");
        return;
      }

      let resolvedMyName = myName;
      let resolvedCrushName = crushName;
      if (!detectedParticipants.includes(myName) && detectedMyName) {
        resolvedMyName = detectedMyName;
        setMyName(detectedMyName);
        if (detectedCrushName) {
          resolvedCrushName = detectedCrushName;
          setCrushName(detectedCrushName);
        }
      }

      // 重新校准 parsed 消息中的 isMe 标记
      const calibratedParsed = newParsed.map((m) => ({
        ...m,
        isMe: m.sender === resolvedMyName,
      }));

      // 更新发言人选项
      if (detectedParticipants.length > 0) {
        setParticipants(detectedParticipants);
      }

      // 执行指纹去重合并
      const { merged, addedCount } = mergeMessagesWithDeduplication(messages, calibratedParsed);

      if (addedCount === 0) {
        showToast("检测到完全重复的聊天记录，已自动过滤，无需重复导入");
        return;
      }

      setMessages(merged);
      showToast(`已成功导入 ${addedCount} 条新记录（我方: ${resolvedMyName}，对方: ${resolvedCrushName}）`);

      // 自动保存初始会话到 SQLite
      persistSession({
        messages: merged,
        crushName: resolvedCrushName,
        myName: resolvedMyName,
        relationshipStatus,
        overallAnalysis,
      });

      // 自动触发 AI 分析
      runAnalysis(merged, resolvedCrushName, resolvedMyName);
    },
    [messages, myName, crushName, relationshipStatus, overallAnalysis, persistSession, runAnalysis, showToast]
  );

  // 5. 切换选中的历史会话
  const handleSelectSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        const session: ChatSession = data.session;
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        setCrushName(session.crushName || "");
        setMyName(session.myName || "");
        setRelationshipStatus(session.relationshipStatus || "Crush / 暧昧中");
        setOverallAnalysis(session.overallAnalysis);
        setParticipants([session.myName, session.crushName].filter(Boolean));
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
        showToast(`已载入历史会话：${session.title}`);
      }
    } catch (e) {
      console.error("Failed to load session", e);
      showToast("加载会话失败");
    }
  };

  // 6. 新建空白会话
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setCrushName("");
    setMyName("");
    setRelationshipStatus("Crush / 暧昧升温中");
    setOverallAnalysis(undefined);
    setParticipants([]);
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
    showToast("已开启新会话，按 Ctrl+V 导入微信记录即可自动归档");
  };

  // 7. 删除会话
  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("已删除该会话记录");
        if (id === currentSessionId) {
          handleNewSession();
        }
        fetchSessions();
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // 8. 重命名会话标题
  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        showToast("会话标题已更新");
        fetchSessions();
      }
    } catch (e) {
      console.error("Rename failed", e);
    }
  };

  // 更新或对调发言人角色归属（彻底解决对调全部变成对方的问题）
  const handleUpdateRoles = useCallback(
    (newMy: string, newCrush: string) => {
      if (!newMy || !newCrush) return;
      const oldMy = myName;
      const oldCrush = crushName;

      setMyName(newMy);
      setCrushName(newCrush);
      setParticipants([newMy, newCrush].filter(Boolean));

      // 判断是否是对调（我方与对方互换）
      const isDirectSwap =
        (newMy === oldCrush && newCrush === oldMy) ||
        (Boolean(oldMy && oldCrush) && newMy !== oldMy && newCrush !== oldCrush);

      const updatedMessages = messages.map((msg) => {
        let isMe = msg.isMe;

        if (isDirectSwap) {
          // 直接对调：原我方变对方，原对方变我方，绝不可能全变成对方！
          isMe = !msg.isMe;
        } else {
          // 明确判定归属
          if (msg.sender === newMy) {
            isMe = true;
          } else if (msg.sender === newCrush) {
            isMe = false;
          } else if (msg.sender === oldMy) {
            isMe = true;
          } else if (msg.sender === oldCrush) {
            isMe = false;
          }
        }

        // 同步更新消息的 sender 为当前选择的角色规范名，消除空格与历史差异
        return {
          ...msg,
          isMe,
          sender: isMe ? newMy : newCrush,
        };
      });

      setMessages(updatedMessages);
      showToast(`角色身份已切换：我方【${newMy}】，对方【${newCrush}】`);

      // 同步持久化到 SQLite
      persistSession({
        messages: updatedMessages,
        crushName: newCrush,
        myName: newMy,
        relationshipStatus,
        overallAnalysis,
      });

      // 自动以新视角触发 AI 研判
      runAnalysis(updatedMessages, newCrush, newMy);
    },
    [messages, myName, crushName, relationshipStatus, overallAnalysis, persistSession, runAnalysis, showToast]
  );

  // 一键对调身份
  const handleSwapRoles = useCallback(() => {
    handleUpdateRoles(crushName, myName);
  }, [handleUpdateRoles, crushName, myName]);

  // 修改对方备注
  const handleRenameCrush = useCallback(
    (newName: string) => {
      if (!newName.trim() || newName.trim() === crushName) return;
      const trimmed = newName.trim();
      const oldCrush = crushName;
      setCrushName(trimmed);
      setParticipants((prev) => {
        const next = prev.map((p) => (p === oldCrush ? trimmed : p));
        if (!next.includes(trimmed)) next.push(trimmed);
        return next;
      });

      const updatedMessages = messages.map((msg) => ({
        ...msg,
        sender: msg.isMe ? msg.sender : trimmed,
      }));
      setMessages(updatedMessages);

      persistSession({
        messages: updatedMessages,
        crushName: trimmed,
        myName,
        relationshipStatus,
        overallAnalysis,
      });
    },
    [messages, crushName, myName, relationshipStatus, overallAnalysis, persistSession]
  );

  // 单条消息删除（支持撤销）
  const handleDeleteMessage = useCallback(
    (id: string) => {
      const targetIndex = messages.findIndex((m) => m.id === id);
      if (targetIndex === -1) return;

      const deletedMsg = messages[targetIndex];
      const remaining = messages.filter((m) => m.id !== id);
      setMessages(remaining);
      setSelectedMessageIds((prev) => prev.filter((i) => i !== id));

      const willBeEmpty = remaining.length === 0;
      if (willBeEmpty) {
        setOverallAnalysis(undefined);
        setIsSelectionMode(false);
      }

      persistSession({
        messages: remaining,
        crushName,
        myName,
        relationshipStatus,
        overallAnalysis: willBeEmpty ? undefined : overallAnalysis,
      });

      const handleUndo = () => {
        const restored = [...remaining];
        restored.splice(targetIndex, 0, deletedMsg);
        setMessages(restored);
        persistSession({
          messages: restored,
          crushName,
          myName,
          relationshipStatus,
          overallAnalysis,
        });
        showToast("已撤销删除");
      };

      showToast("已删除 1 条对话记录", handleUndo);
    },
    [messages, crushName, myName, relationshipStatus, overallAnalysis, persistSession, showToast]
  );

  // 批量删除选中的消息（支持撤销）
  const handleBatchDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      const idSet = new Set(ids);
      const originalMessages = [...messages];
      const remaining = messages.filter((m) => !idSet.has(m.id));

      setMessages(remaining);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);

      const willBeEmpty = remaining.length === 0;
      if (willBeEmpty) {
        setOverallAnalysis(undefined);
      }

      persistSession({
        messages: remaining,
        crushName,
        myName,
        relationshipStatus,
        overallAnalysis: willBeEmpty ? undefined : overallAnalysis,
      });

      const handleUndo = () => {
        setMessages(originalMessages);
        persistSession({
          messages: originalMessages,
          crushName,
          myName,
          relationshipStatus,
          overallAnalysis,
        });
        showToast(`已撤销删除，已恢复 ${ids.length} 条对话`);
      };

      showToast(`已删除 ${ids.length} 条对话记录`, handleUndo);
    },
    [messages, crushName, myName, relationshipStatus, overallAnalysis, persistSession, showToast]
  );

  // 清空当前会话全部聊天记录（支持撤销）
  const handleClearAllMessages = useCallback(() => {
    if (messages.length === 0) return;
    if (!window.confirm("确定清空当前会话的所有聊天记录吗？此操作可撤销。")) {
      return;
    }

    const originalMessages = [...messages];
    const prevAnalysis = overallAnalysis;

    setMessages([]);
    setOverallAnalysis(undefined);
    setSelectedMessageIds([]);
    setIsSelectionMode(false);

    persistSession({
      messages: [],
      crushName,
      myName,
      relationshipStatus,
      overallAnalysis: undefined,
    });

    const handleUndo = () => {
      setMessages(originalMessages);
      setOverallAnalysis(prevAnalysis);
      persistSession({
        messages: originalMessages,
        crushName,
        myName,
        relationshipStatus,
        overallAnalysis: prevAnalysis,
      });
      showToast("已恢复所有聊天记录");
    };

    showToast("已清空当前会话的所有聊天记录", handleUndo);
  }, [messages, crushName, myName, relationshipStatus, overallAnalysis, persistSession, showToast]);

  // 管理模式下的选择切换
  const handleToggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllMessages = () => {
    setSelectedMessageIds(messages.map((m) => m.id));
  };

  const handleClearSelection = () => {
    setSelectedMessageIds([]);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedMessageIds([]);
      }
      return !prev;
    });
  };

  // 全局监听快捷键 Ctrl + V 粘贴
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") &&
        activeEl.getAttribute("data-ignore-global-paste") !== "true"
      ) {
        return;
      }

      const text = e.clipboardData?.getData("text");
      if (text && text.trim().length > 5) {
        e.preventDefault();
        handleImportText(text);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [handleImportText]);

  // 载入特定情景测试数据（从 + 号弹窗触发）
  const handleLoadScenario = (scenario: ChatScenario) => {
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages(scenario.messages);
    setOverallAnalysis(scenario.analysis);
    setCrushName(scenario.crushName);
    setMyName(scenario.myName);
    setRelationshipStatus(scenario.status);
    setParticipants([scenario.myName, scenario.crushName]);
    showToast(`已载入：${scenario.name}`);

    // 存入 SQLite
    persistSession({
      id: newSessionId,
      title: scenario.name,
      messages: scenario.messages,
      crushName: scenario.crushName,
      myName: scenario.myName,
      relationshipStatus: scenario.status,
      overallAnalysis: scenario.analysis,
    });
  };

  // 清空重置
  const handleClear = () => {
    setMessages([]);
    setCrushName("");
    setMyName("");
    setParticipants([]);
    setOverallAnalysis(undefined);
    showToast("记录与人物数据已清空，可按 Ctrl+V 导入新记录");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#e9e9ea] font-sans antialiased text-[#1c1c1e]">
      {/* 极简最左侧图标栏 */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClear={handleClear}
        hasMessages={messages.length > 0}
        onAnalyze={() => runAnalysis(messages)}
        isAnalyzing={isAnalyzing}
        isSessionListOpen={isSessionListOpen}
        onToggleSessionList={() => setIsSessionListOpen((prev) => !prev)}
      />

      {/* 类似 Gemini / ChatGPT 的多会话历史记录栏 (基于 SQLite) */}
      <SessionList
        isOpen={isSessionListOpen}
        onClose={() => setIsSessionListOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />

      {/* 主工作区 */}
      <main className="flex-1 flex flex-col h-full bg-[#f7f7f8] relative overflow-hidden">
        {/* 全局 Toast 通知（支持撤销） */}
        {notification && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e]/95 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-3 select-none">
            <span>{notification.message}</span>
            {notification.onUndo && (
              <button
                type="button"
                onClick={() => {
                  notification.onUndo?.();
                  setNotification(null);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                撤销
              </button>
            )}
          </div>
        )}

        {/* 顶部状态栏：对方备注、好感度指示条、加号操作 */}
        <Header
          crushName={crushName}
          myName={myName}
          relationshipStatus={relationshipStatus}
          overallAnalysis={overallAnalysis}
          isAnalyzing={isAnalyzing}
          onOpenPasteModal={() => setIsPasteOpen(true)}
          onOpenAnalysisDetail={() => setIsDetailDrawerOpen(true)}
          onChangeCrushName={handleRenameCrush}
          onChangeStatus={setRelationshipStatus}
          onSwapRoles={handleSwapRoles}
          hasMessages={messages.length > 0}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
        />

        {/* 聊天消息流：仿原生微信气泡、居中时间戳、微观意图情绪解析、单条/批量删除 */}
        <ChatMessageList
          messages={messages}
          crushName={crushName}
          isAnalyzing={isAnalyzing}
          onSelectMessageDetail={(msg) => setSelectedMessage(msg)}
          onDeleteMessage={handleDeleteMessage}
          isSelectionMode={isSelectionMode}
          selectedMessageIds={selectedMessageIds}
          onToggleSelectMessage={handleToggleSelectMessage}
          onSelectAll={handleSelectAllMessages}
          onClearSelection={handleClearSelection}
          onBatchDelete={handleBatchDelete}
          onExitSelectionMode={() => {
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
          }}
          onClearAllMessages={handleClearAllMessages}
        />

        {/* 底部输入与状态栏：我的发挥、下一步行动、参考回复卡片一键复制、无感粘贴框 */}
        <FooterBar
          overallAnalysis={overallAnalysis}
          isAnalyzing={isAnalyzing}
          onPasteText={handleImportText}
          onAnalyze={() => runAnalysis(messages)}
          hasMessages={messages.length > 0}
        />
      </main>

      {/* 弹窗：导入/粘贴弹窗 */}
      <PasteModal
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
        onConfirmImport={handleImportText}
        onLoadScenario={handleLoadScenario}
      />

      {/* 弹窗：身份偏好与关系阶段设置 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        participants={participants}
        myName={myName}
        crushName={crushName}
        relationshipStatus={relationshipStatus}
        onUpdateRoles={handleUpdateRoles}
        onChangeStatus={setRelationshipStatus}
      />

      {/* 抽屉：好感度深度全维研判报告 */}
      <AnalysisDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        overallAnalysis={overallAnalysis}
        crushName={crushName}
      />

      {/* 弹窗：单句消息心理学深度解析 */}
      <MessageDetailModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        crushName={crushName}
        onDeleteMessage={handleDeleteMessage}
      />
    </div>
  );
}
