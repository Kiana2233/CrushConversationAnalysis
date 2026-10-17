import { Message } from "@/types/chat";

/**
 * 微信聊天记录剪贴板解析器
 * 支持多种微信桌面端、移动端复制格式（单行头、两行头、包含特殊Emoji/藏文字符的昵称），并提供智能去重合并能力
 */

export interface ParseResult {
  messages: Message[];
  detectedParticipants: string[];
  detectedMyName?: string;
  detectedCrushName?: string;
}

// 简单的哈希生成，用于指纹去重
export function getMessageFingerprint(sender: string, timestamp: string, content: string): string {
  // 规范化时间（例如去除秒数差异以提高模糊去重兼容性）
  const normalizedTime = timestamp.replace(/:\d{2}$/, "").trim();
  const normalizedContent = content.trim().replace(/\s+/g, " ");
  return `${sender.trim()}_${normalizedTime}_${normalizedContent}`;
}

export function parseWechatClipboard(
  rawText: string,
  currentMyName?: string
): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { messages: [], detectedParticipants: [] };
  }

  const lines = rawText.split(/\r?\n/);
  const parsedMessages: Array<{ sender: string; timestamp: string; contentLines: string[] }> = [];

  // 判断是否是纯时间/日期行
  // 例如: "2026年10月14日 20:38" 或 "2024/09/19 12:15" 或 "10月14日 20:38" 或 "20:38" 或 "昨天 21:35"
  const pureTimeRegex = /^(?:(?:昨天|今天|前天)?[ \t]*)?(?:(?:\d{2,4}[-/年.])?\d{1,2}[-/月.]\d{1,2}(?:日)?(?:[ \t]+)?)?(?:\d{1,2}:\d{2}(?::\d{2})?)(?:[ \t]*(?:AM|PM|上午|下午))?$/;

  // 单行式消息头 (PC 微信常见格式: "九三  2026年10月14日 20:38" 或 "九三  12:15")
  const singleLineHeaderRegex = /^([^\t\n\r]+?)[ \t]{1,4}((?:(?:昨天|今天|前天)?[ \t]*)?(?:(?:\d{2,4}[-/年.])?\d{1,2}[-/月.]\d{1,2}(?:日)?(?:[ \t]+)?)?(?:\d{1,2}:\d{2}(?::\d{2})?)(?:[ \t]*(?:AM|PM|上午|下午))?)$/;

  let currentSender: string | null = null;
  let currentTimestamp: string | null = null;
  let currentContentLines: string[] = [];

  const flushCurrent = () => {
    if (currentSender && currentContentLines.length > 0) {
      const content = currentContentLines.join("\n").trim();
      if (content) {
        parsedMessages.push({
          sender: currentSender,
          timestamp: currentTimestamp || "未知时间",
          contentLines: [content],
        });
      }
    }
    currentContentLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // 检查是否是分隔横线（如微信合并转发的 —— 2024-09-19 12:15 ——）
    const dividerMatch = trimmed.match(/^[-—=]{2,}\s*(.*?)\s*[-—=]{2,}$/);
    if (dividerMatch) {
      if (dividerMatch[1]) {
        currentTimestamp = dividerMatch[1];
      }
      continue;
    }

    // 模式 A：两行式结构（上一行是昵称/特殊Emoji，当前行是纯日期时间）
    // 例如：
    // 九三
    // 2026年10月14日 20:38
    if (pureTimeRegex.test(trimmed) && (trimmed.includes(":") || trimmed.includes("："))) {
      if (currentContentLines.length > 0) {
        const potentialSender = currentContentLines[currentContentLines.length - 1].trim();
        // 昵称通常较短（<=30个字符）且自身不是纯时间
        if (potentialSender.length <= 30 && !pureTimeRegex.test(potentialSender)) {
          currentContentLines.pop(); // 弹出暂存在正文里的昵称
          flushCurrent();
          currentSender = potentialSender;
          currentTimestamp = trimmed;
          continue;
        }
      }
    }

    // 模式 B：单行式结构（"九三  2026年10月14日 20:38"）
    const singleMatch = trimmed.match(singleLineHeaderRegex);
    if (singleMatch && singleMatch[1].trim() && singleMatch[2].trim()) {
      const senderCandidate = singleMatch[1].trim();
      const timeCandidate = singleMatch[2].trim();
      // 排除第一部分本身也是纯日期的误判（例如 "2026年10月14日 20:38" 不能把日期当昵称）
      if (!pureTimeRegex.test(senderCandidate) && pureTimeRegex.test(timeCandidate)) {
        flushCurrent();
        currentSender = senderCandidate;
        currentTimestamp = timeCandidate;
        continue;
      }
    }

    // 模式 C：中括号消息头 "[九三 20:38]"
    const bracketMatch = trimmed.match(/^\[(.+?)[ \t]+(.*?)\]$/);
    if (bracketMatch && bracketMatch[1].trim()) {
      flushCurrent();
      currentSender = bracketMatch[1].trim();
      currentTimestamp = bracketMatch[2].trim() || "未知时间";
      continue;
    }

    // 模式 D：冒号格式 "九三: 你好" 或 "九三 20:38: 你好"
    const colonMatch = trimmed.match(/^([^：:\n]{1,20})(?:[ \t]+((?:\d{2,4}[-/年.])?\d{1,2}[-/月.]\d{1,2}(?:日)?[ \t]+\d{1,2}:\d{2}|\d{1,2}:\d{2}))?[：:](.*)$/);
    if (colonMatch && colonMatch[1].trim() && !colonMatch[1].includes("http")) {
      flushCurrent();
      currentSender = colonMatch[1].trim();
      currentTimestamp = colonMatch[2]?.trim() || currentTimestamp || "未知时间";
      if (colonMatch[3]?.trim()) {
        currentContentLines.push(colonMatch[3].trim());
      }
      continue;
    }

    // 正常正文行延续
    currentContentLines.push(line);
  }

  flushCurrent();

  // 统计发言人列表（按出现顺序排）
  const detectedParticipants: string[] = [];
  parsedMessages.forEach((m) => {
    if (!detectedParticipants.includes(m.sender)) {
      detectedParticipants.push(m.sender);
    }
  });

  // 智能推断哪一方是“我”
  let myName = currentMyName;
  if (!myName || !detectedParticipants.includes(myName)) {
    // 优先寻找包含 "我" 或 "me" 的发言者
    const meCandidate = detectedParticipants.find(
      (p) => p.includes("我") || p.toLowerCase() === "me"
    );
    if (meCandidate) {
      myName = meCandidate;
    } else if (detectedParticipants.length >= 2) {
      // 默认第一个发起提问/说话的人往往是我方（或者默认第一个人）
      myName = detectedParticipants[0];
    } else {
      myName = detectedParticipants[0] || "我";
    }
  }

  const crushName =
    detectedParticipants.find((p) => p !== myName) ||
    (detectedParticipants[0] === myName ? "对方" : detectedParticipants[0]);

  // 转换为标准的 Message 对象列表
  const messages: Message[] = parsedMessages.map((m, idx) => {
    const isMe = m.sender === myName;
    const content = m.contentLines.join("\n").trim();
    return {
      id: `msg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      sender: m.sender,
      isMe,
      timestamp: m.timestamp,
      content,
    };
  });

  return {
    messages,
    detectedParticipants,
    detectedMyName: myName,
    detectedCrushName: crushName,
  };
}

/**
 * 合并去重新消息
 * 对比既有消息列表与新解析的消息列表，去除指纹重复的消息，并将新增消息按序追加
 */
export function mergeMessagesWithDeduplication(
  existingMessages: Message[],
  newMessages: Message[]
): {
  merged: Message[];
  addedCount: number;
} {
  const existingFingerprints = new Set<string>();

  existingMessages.forEach((msg) => {
    existingFingerprints.add(
      getMessageFingerprint(msg.sender, msg.timestamp, msg.content)
    );
  });

  const uniqueNewMessages: Message[] = [];

  newMessages.forEach((msg) => {
    const fp = getMessageFingerprint(msg.sender, msg.timestamp, msg.content);
    if (!existingFingerprints.has(fp)) {
      existingFingerprints.add(fp);
      uniqueNewMessages.push(msg);
    }
  });

  return {
    merged: [...existingMessages, ...uniqueNewMessages],
    addedCount: uniqueNewMessages.length,
  };
}
