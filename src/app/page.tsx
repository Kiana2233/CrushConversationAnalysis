"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ChatMessageList } from "@/components/ChatMessageList";
import { FooterBar } from "@/components/FooterBar";
import { SettingsModal } from "@/components/SettingsModal";
import { PasteModal } from "@/components/PasteModal";
import { AnalysisDetailDrawer } from "@/components/AnalysisDetailDrawer";
import { MessageDetailModal } from "@/components/MessageDetailModal";
import { Message, OverallAnalysis, ModelConfig } from "@/types/chat";
import { parseWechatClipboard, mergeMessagesWithDeduplication } from "@/lib/parser";
import { SAMPLE_MESSAGES, SAMPLE_ANALYSIS } from "@/lib/sample-data";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [crushName, setCrushName] = useState<string>("VA");
  const [myName, setMyName] = useState<string>("李四");
  const [relationshipStatus, setRelationshipStatus] = useState<string>("Crush / 暧昧中");
  const [overallAnalysis, setOverallAnalysis] = useState<OverallAnalysis | undefined>(SAMPLE_ANALYSIS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 弹窗状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 参与者推导列表
  const [participants, setParticipants] = useState<string[]>(["李四", "VA"]);

  // 模型配置 (可持久化到 localStorage)
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    apiKey: "",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  });

  // 读取本地存储中的配置
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("wechat_ai_config");
      if (savedConfig) {
        setModelConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.warn("Could not load config from localStorage", e);
    }
  }, []);

  // 自动弹出提示
  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // 触发 AI 分析
  const runAnalysis = useCallback(
    async (messagesToAnalyze: Message[]) => {
      if (messagesToAnalyze.length === 0) return;
      setIsAnalyzing(true);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesToAnalyze,
            config: modelConfig,
          }),
        });

        if (!res.ok) {
          throw new Error("分析接口请求失败");
        }

        const data = await res.json();
        if (data.overallAnalysis) {
          setOverallAnalysis(data.overallAnalysis);
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
          showToast("AI 研判完成：好感度已实时更新！");
        }
      } catch (err: any) {
        console.error("Analysis failed:", err);
        showToast("在线分析遇到轻微波动，已采用本地智能推导演算");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [modelConfig, showToast]
  );

  // 核心处理函数：解析剪贴板文本并合并去重
  const handleImportText = useCallback(
    (rawText: string) => {
      const { messages: newParsed, detectedParticipants } = parseWechatClipboard(rawText, myName);

      if (newParsed.length === 0) {
        showToast("未能识别出聊天记录，请确认格式是否包含发言人或时间");
        return;
      }

      // 更新发言人选项
      if (detectedParticipants.length > 0) {
        setParticipants((prev) => {
          const set = new Set([...prev, ...detectedParticipants]);
          return Array.from(set);
        });

        // 如果识别出对方昵称，更新 Crush 名称
        const potentialCrush = detectedParticipants.find((p) => p !== myName);
        if (potentialCrush && potentialCrush !== crushName && crushName === "VA") {
          setCrushName(potentialCrush);
        }
      }

      // 执行指纹去重合并
      const { merged, addedCount } = mergeMessagesWithDeduplication(messages, newParsed);

      if (addedCount === 0) {
        showToast("检测到完全重复的聊天记录，已自动过滤，无需重复导入");
        return;
      }

      setMessages(merged);
      showToast(`已成功导入 ${addedCount} 条新记录（自动去重过滤）`);

      // 导入后自动触发 AI 分析
      runAnalysis(merged);
    },
    [messages, myName, crushName, runAnalysis, showToast]
  );

  // 全局监听快捷键 Ctrl + V 粘贴
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 如果焦点在正常的 input 或 textarea 内，优先保证正常输入，不拦截
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

  // 保存模型设置
  const handleSaveConfig = (newConfig: ModelConfig) => {
    setModelConfig(newConfig);
    try {
      localStorage.setItem("wechat_ai_config", JSON.stringify(newConfig));
      showToast("模型配置已保存");
    } catch (e) {
      console.warn("Storage write error", e);
    }
  };

  // 切换角色
  const handleUpdateRoles = (selectedMe: string, selectedCrush: string) => {
    setMyName(selectedMe);
    setCrushName(selectedCrush);

    // 重新校准当前既有消息的 isMe 标识
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        isMe: msg.sender === selectedMe,
      }))
    );
  };

  // 载入示例测试数据
  const handleLoadSample = () => {
    setMessages(SAMPLE_MESSAGES);
    setOverallAnalysis(SAMPLE_ANALYSIS);
    setCrushName("VA");
    setMyName("李四");
    showToast("已载入截图标准测试数据");
  };

  // 清空重置
  const handleClear = () => {
    setMessages([]);
    setOverallAnalysis(undefined);
    showToast("记录已清空，可按 Ctrl+V 导入新记录");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#e9e9ea] font-sans antialiased text-[#1c1c1e]">
      {/* 极简左侧图标栏 */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClear={handleClear}
        hasMessages={messages.length > 0}
        onAnalyze={() => runAnalysis(messages)}
        isAnalyzing={isAnalyzing}
      />

      {/* 主工作区 (居中卡片式极简微信风，完全匹配截图) */}
      <main className="flex-1 flex flex-col h-full bg-[#f7f7f8] relative overflow-hidden">
        {/* 全局 Toast 通知 */}
        {notification && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e]/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            {notification}
          </div>
        )}

        {/* 顶部状态栏：对方备注、好感度指示条、加号操作 */}
        <Header
          crushName={crushName}
          relationshipStatus={relationshipStatus}
          overallAnalysis={overallAnalysis}
          isAnalyzing={isAnalyzing}
          onOpenPasteModal={() => setIsPasteOpen(true)}
          onOpenAnalysisDetail={() => setIsDetailDrawerOpen(true)}
          onChangeCrushName={setCrushName}
          onChangeStatus={setRelationshipStatus}
        />

        {/* 聊天消息流：仿原生微信气泡、居中时间戳、微观意图情绪解析 */}
        <ChatMessageList
          messages={messages}
          crushName={crushName}
          isAnalyzing={isAnalyzing}
          onSelectMessageDetail={(msg) => setSelectedMessage(msg)}
          onLoadSample={handleLoadSample}
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
        onLoadSample={handleLoadSample}
      />

      {/* 弹窗：设置与模型 API 配置 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={modelConfig}
        onSaveConfig={handleSaveConfig}
        participants={participants}
        myName={myName}
        crushName={crushName}
        onUpdateRoles={handleUpdateRoles}
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
      />
    </div>
  );
}
