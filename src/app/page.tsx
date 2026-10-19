"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar, NavTabType } from "@/components/Sidebar";
import { SessionList } from "@/components/SessionList";
import { Header } from "@/components/Header";
import { ChatMessageList } from "@/components/ChatMessageList";
import { FooterBar } from "@/components/FooterBar";
import { SettingsModal } from "@/components/SettingsModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PasteModal } from "@/components/PasteModal";
import { AnalysisDetailDrawer } from "@/components/AnalysisDetailDrawer";
import { MessageDetailModal } from "@/components/MessageDetailModal";
import { SandboxModal } from "@/components/SandboxModal";
import { ReportDocumentView } from "@/components/ReportDocumentView";
import { RightInspectorPanel } from "@/components/RightInspectorPanel";
import { DataCompassTab } from "@/components/DataCompassTab";
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
  const [isSessionListOpen, setIsSessionListOpen] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [activeMainTab, setActiveMainTab] = useState<NavTabType>("report");

  // 弹窗状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxInitialDraft, setSandboxInitialDraft] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleOpenSandbox = useCallback((draft?: string) => {
    setSandboxInitialDraft(draft || "");
    setIsSandboxOpen(true);
  }, []);

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
  // 分析互斥锁：同一时刻只允许一个大模型请求在飞行中，防止连续点击反复打满接口
  const isAnalyzingRef = useRef(false);

  const runAnalysis = useCallback(
    async (messagesToAnalyze: Message[], targetCrushName?: string, targetMyName?: string) => {
      if (messagesToAnalyze.length === 0) return;
      if (isAnalyzingRef.current) {
        showToast("研判任务进行中，请等待当前结果返回后再试");
        return;
      }
      isAnalyzingRef.current = true;
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
        isAnalyzingRef.current = false;
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
      // 研判结果尚未回来时禁止切换身份，避免角色归属与报告视角错位
      if (isAnalyzingRef.current) {
        showToast("研判结果尚未返回，身份切换已暂缓，请稍候再试");
        return;
      }
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

  // 一键对调身份（先二次确认；确认后自动重新研判，结果返回前不可再次对调）
  const handleSwapRoles = useCallback(() => {
    if (!myName || !crushName) return;
    if (isAnalyzingRef.current) return;
    setIsSwapConfirmOpen(true);
  }, [myName, crushName]);

  const handleConfirmSwapRoles = useCallback(() => {
    setIsSwapConfirmOpen(false);
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
      {/* 1. 极简 Slim Dock 导航坞 (TraceMemo 风格) */}
      <Sidebar
        activeTab={activeMainTab}
        onChangeTab={setActiveMainTab}
        isSessionListOpen={isSessionListOpen}
        onToggleSessionList={() => setIsSessionListOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSandbox={() => handleOpenSandbox()}
        onAnalyze={() => runAnalysis(messages)}
        isAnalyzing={isAnalyzing}
        hasMessages={messages.length > 0}
      />

      {/* 2. 档案历史记录管理栏 (TraceMemo 分组列表) */}
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

      {/* 3. 中间核心工作台 (可切换：全维报告 / 对话记录 / 数据罗盘) */}
      <main className="flex-1 flex flex-col h-full bg-[#f4f5f7] relative overflow-hidden min-w-0">
        {/* 全局 Toast 通知 */}
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

        {/* 顶部操作与子导航栏 */}
        <Header
          crushName={crushName}
          myName={myName}
          relationshipStatus={relationshipStatus}
          overallAnalysis={overallAnalysis}
          isAnalyzing={isAnalyzing}
          activeTab={activeMainTab}
          onChangeTab={setActiveMainTab}
          onOpenPasteModal={() => setIsPasteOpen(true)}
          onOpenSandbox={() => handleOpenSandbox()}
          onChangeCrushName={handleRenameCrush}
          onChangeStatus={setRelationshipStatus}
          onSwapRoles={handleSwapRoles}
          onAnalyze={() => runAnalysis(messages)}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          hasMessages={messages.length > 0}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
        />

        {/* 视图分支一：全维纸张式研判报告 (TraceMemo 浮动卡片核心视觉) */}
        {activeMainTab === "report" && (
          <ReportDocumentView
            messages={messages}
            crushName={crushName}
            myName={myName}
            relationshipStatus={relationshipStatus}
            overallAnalysis={overallAnalysis}
            onOpenSandbox={() => handleOpenSandbox()}
            onExportPoster={() => showToast("已生成并保存恋爱研判海报")}
          />
        )}

        {/* 视图分支二：微信对话记录流 */}
        {activeMainTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
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

            <FooterBar
              overallAnalysis={overallAnalysis}
              isAnalyzing={isAnalyzing}
              onPasteText={handleImportText}
              onAnalyze={() => runAnalysis(messages)}
              onOpenSandbox={handleOpenSandbox}
              hasMessages={messages.length > 0}
            />
          </div>
        )}

        {/* 视图分支三：深度数据罗盘 */}
        {activeMainTab === "compass" && (
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#f4f5f7]">
            <div className="w-full max-w-xl">
              <DataCompassTab
                messages={messages}
                myName={myName}
                crushName={crushName}
                overallAnalysis={overallAnalysis}
              />
            </div>
          </div>
        )}
      </main>

      {/* 4. 右侧属性与元数据检查器 (TraceMemo 风格) */}
      <RightInspectorPanel
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        messages={messages}
        crushName={crushName}
        myName={myName}
        relationshipStatus={relationshipStatus}
        overallAnalysis={overallAnalysis}
        onOpenSandbox={() => handleOpenSandbox()}
      />

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
        isAnalyzing={isAnalyzing}
        onUpdateRoles={handleUpdateRoles}
        onChangeStatus={setRelationshipStatus}
      />

      {/* 弹窗：对调身份二次确认 */}
      <ConfirmModal
        isOpen={isSwapConfirmOpen}
        title="确认对调身份？"
        description={`将把我方【${myName || "我"}】与对方【${crushName || "对方"}】互换，并以新视角自动重新研判。研判结果返回前，对调按钮会暂时锁定，请勿重复点击。`}
        confirmText="确认对调"
        onConfirm={handleConfirmSwapRoles}
        onCancel={() => setIsSwapConfirmOpen(false)}
      />

      {/* 抽屉：好感度深度全维研判报告与数据罗盘 */}
      <AnalysisDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        overallAnalysis={overallAnalysis}
        crushName={crushName}
        myName={myName}
        messages={messages}
        isAnalyzing={isAnalyzing}
        onTriggerAnalyze={() => runAnalysis(messages)}
      />

      {/* 弹窗：单句消息心理学深度解析 */}
      <MessageDetailModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        crushName={crushName}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* 弹窗：回复沙盒实战推演器 */}
      <SandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        messages={messages}
        crushName={crushName}
        myName={myName}
        relationshipStatus={relationshipStatus}
        initialDraft={sandboxInitialDraft}
      />
    </div>
  );
}
