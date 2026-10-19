import { Message } from "@/types/chat";

export interface TimeSlotData {
  count: number;
  pct: number;
}

export interface ChatInvestmentStats {
  totalMessages: number;
  totalWords: number;

  // 我方数据
  myCount: number;
  myCountPct: number;
  myWords: number;
  myWordPct: number;
  myAvgWords: number;
  myInitiations: number;
  myInitiationPct: number;
  myQuestions: number;
  myQuestionRate: number; // 提问率 (提问数 / 消息数 %)
  myExpressiveCount: number; // 表情/语气词
  myAvgReplyMinutes: number | null; // 平均回复等待时长 (分钟)
  myQuickReplyRate: number | null; // 5分钟内回复率 (%)

  // 对方数据
  crushCount: number;
  crushCountPct: number;
  crushWords: number;
  crushWordPct: number;
  crushAvgWords: number;
  crushInitiations: number;
  crushInitiationPct: number;
  crushQuestions: number;
  crushQuestionRate: number;
  crushExpressiveCount: number;
  crushAvgReplyMinutes: number | null;
  crushQuickReplyRate: number | null;

  // 24小时四阶段活跃分布
  timeSlots: {
    morning: TimeSlotData; // 清晨唤醒 (06:00 - 11:59)
    afternoon: TimeSlotData; // 午后互动 (12:00 - 17:59)
    evening: TimeSlotData; // 黄金夜晚 (18:00 - 22:59)
    lateNight: TimeSlotData; // 深夜密语 (23:00 - 05:59)
  };
  peakSlot: "morning" | "afternoon" | "evening" | "lateNight";

  // 互动诊断总结
  verdict: {
    badge: string;
    title: string;
    description: string;
    wordRatio: string;
    initiationRatio: string;
  };
}

/**
 * 从多样的微信时间戳中解析出小时与粗略分钟
 * 例如: "2026年10月14日 20:38", "10月14日 20:38", "20:38", "下午 3:15"
 */
function parseHourAndMinute(timestamp: string): { hour: number; minute: number } | null {
  if (!timestamp) return null;

  // 检查是否包含 PM / 下午
  const isPM = /pm|下午|晚上/i.test(timestamp);
  const isAM = /am|上午|早晨|早上/i.test(timestamp);

  const match = timestamp.match(/(\d{1,2})[:：](\d{2})/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return { hour, minute };
  }
  return null;
}

/**
 * 尝试估算两条消息的时间间隔（分钟）
 */
function estimateMinuteDiff(prevTime: string, currTime: string): number | null {
  const p = parseHourAndMinute(prevTime);
  const c = parseHourAndMinute(currTime);
  if (!p || !c) return null;

  const prevMinutes = p.hour * 60 + p.minute;
  let currMinutes = c.hour * 60 + c.minute;

  // 如果跨越了午夜 (例如 23:50 -> 00:15)
  if (currMinutes < prevMinutes) {
    currMinutes += 24 * 60;
  }

  const diff = currMinutes - prevMinutes;
  return diff >= 0 ? diff : null;
}

/**
 * 计算双方聊天硬数据与投入度对比
 */
export function calculateChatStats(
  messages: Message[],
  myName: string = "我",
  crushName: string = "对方"
): ChatInvestmentStats {
  const totalMessages = messages.length;

  if (totalMessages === 0) {
    return {
      totalMessages: 0,
      totalWords: 0,
      myCount: 0,
      myCountPct: 50,
      myWords: 0,
      myWordPct: 50,
      myAvgWords: 0,
      myInitiations: 0,
      myInitiationPct: 50,
      myQuestions: 0,
      myQuestionRate: 0,
      myExpressiveCount: 0,
      myAvgReplyMinutes: null,
      myQuickReplyRate: null,
      crushCount: 0,
      crushCountPct: 50,
      crushWords: 0,
      crushWordPct: 50,
      crushAvgWords: 0,
      crushInitiations: 0,
      crushInitiationPct: 50,
      crushQuestions: 0,
      crushQuestionRate: 0,
      crushExpressiveCount: 0,
      crushAvgReplyMinutes: null,
      crushQuickReplyRate: null,
      timeSlots: {
        morning: { count: 0, pct: 0 },
        afternoon: { count: 0, pct: 0 },
        evening: { count: 0, pct: 0 },
        lateNight: { count: 0, pct: 0 },
      },
      peakSlot: "evening",
      verdict: {
        badge: "等待对话",
        title: "尚未载入足够记录",
        description: "导入两人的聊天记录即可即时生成双方投入度全维对比。",
        wordRatio: "0 : 0",
        initiationRatio: "0 : 0",
      },
    };
  }

  let myWords = 0;
  let crushWords = 0;
  let myCount = 0;
  let crushCount = 0;
  let myQuestions = 0;
  let crushQuestions = 0;
  let myExpressiveCount = 0;
  let crushExpressiveCount = 0;
  let myInitiations = 0;
  let crushInitiations = 0;

  // 回复时差统计
  const myReplyTimes: number[] = [];
  const crushReplyTimes: number[] = [];

  // 时段计数
  const slotCounts = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    lateNight: 0,
  };

  // 疑问特征正则
  const questionRegex = /[?？]|(?:^|\b|[，。！\s])(为什么|怎么|咋|啥|哪里|干嘛|去哪|好不好|行不行|是不是|对不对|有吗|在吗|吗|呢)(?:[？?！!，。\s]|$)/;

  // 语气与表情特征正则
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const particleRegex = /(?:哈哈|嘻嘻|嘿嘿|啦|呀|哇|嗷|嗯嗯|对呀|好呀|嘛|哩)/;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isMe = msg.isMe;
    const len = msg.content ? msg.content.trim().length : 0;

    // 1. 字数与条数
    if (isMe) {
      myCount++;
      myWords += len;
    } else {
      crushCount++;
      crushWords += len;
    }

    // 2. 好奇心/提问分析
    if (questionRegex.test(msg.content)) {
      if (isMe) myQuestions++;
      else crushQuestions++;
    }

    // 3. 表情与语气词
    if (emojiRegex.test(msg.content) || particleRegex.test(msg.content)) {
      if (isMe) myExpressiveCount++;
      else crushExpressiveCount++;
    }

    // 4. 24小时时段分布
    const parsedTime = parseHourAndMinute(msg.timestamp);
    if (parsedTime) {
      const h = parsedTime.hour;
      if (h >= 6 && h < 12) slotCounts.morning++;
      else if (h >= 12 && h < 18) slotCounts.afternoon++;
      else if (h >= 18 && h < 23) slotCounts.evening++;
      else slotCounts.lateNight++;
    }

    // 5. 主动开启话题 & 回复时长计算
    if (i === 0) {
      // 第一条消息定义为首次发起者
      if (isMe) myInitiations++;
      else crushInitiations++;
    } else {
      const prevMsg = messages[i - 1];
      const diffMin = estimateMinuteDiff(prevMsg.timestamp, msg.timestamp);

      // 如果两次消息间隔超过 2.5 小时 (150分钟)，视为一次新的主动开启话题
      if (diffMin !== null && diffMin >= 150) {
        if (isMe) myInitiations++;
        else crushInitiations++;
      }

      // 如果发生了发言人切换 (对方回复我，或我回复对方)
      if (prevMsg.isMe !== msg.isMe && diffMin !== null && diffMin <= 180) {
        if (isMe) {
          myReplyTimes.push(diffMin);
        } else {
          crushReplyTimes.push(diffMin);
        }
      }
    }
  }

  const totalWords = myWords + crushWords;
  const myCountPct = totalMessages > 0 ? Math.round((myCount / totalMessages) * 100) : 50;
  const crushCountPct = 100 - myCountPct;

  const myWordPct = totalWords > 0 ? Math.round((myWords / totalWords) * 100) : 50;
  const crushWordPct = 100 - myWordPct;

  const myAvgWords = myCount > 0 ? Math.round((myWords / myCount) * 10) / 10 : 0;
  const crushAvgWords = crushCount > 0 ? Math.round((crushWords / crushCount) * 10) / 10 : 0;

  const totalInits = myInitiations + crushInitiations || 1;
  const myInitiationPct = Math.round((myInitiations / totalInits) * 100);
  const crushInitiationPct = 100 - myInitiationPct;

  const myQuestionRate = myCount > 0 ? Math.round((myQuestions / myCount) * 100) : 0;
  const crushQuestionRate = crushCount > 0 ? Math.round((crushQuestions / crushCount) * 100) : 0;

  // 平均回复时长与秒回率 (<=5分钟视为秒回)
  const calcReplyStats = (times: number[]) => {
    if (times.length === 0) return { avg: null, quickRate: null };
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const quickCount = times.filter((t) => t <= 5).length;
    const quickRate = Math.round((quickCount / times.length) * 100);
    return { avg, quickRate };
  };

  const myReplies = calcReplyStats(myReplyTimes);
  const crushReplies = calcReplyStats(crushReplyTimes);

  // 计算时段百分比与峰值
  const timeTotal =
    slotCounts.morning + slotCounts.afternoon + slotCounts.evening + slotCounts.lateNight || 1;
  const timeSlots = {
    morning: { count: slotCounts.morning, pct: Math.round((slotCounts.morning / timeTotal) * 100) },
    afternoon: { count: slotCounts.afternoon, pct: Math.round((slotCounts.afternoon / timeTotal) * 100) },
    evening: { count: slotCounts.evening, pct: Math.round((slotCounts.evening / timeTotal) * 100) },
    lateNight: { count: slotCounts.lateNight, pct: Math.round((slotCounts.lateNight / timeTotal) * 100) },
  };

  let peakSlot: "morning" | "afternoon" | "evening" | "lateNight" = "evening";
  let maxCount = -1;
  (Object.keys(slotCounts) as Array<keyof typeof slotCounts>).forEach((k) => {
    if (slotCounts[k] > maxCount) {
      maxCount = slotCounts[k];
      peakSlot = k;
    }
  });

  // 诊断总结生成
  let badge = "平衡互动";
  let title = "双向奔赴 · 频率和谐";
  let description = `你们的交流非常对称（字数比 ${myWordPct}% : ${crushWordPct}%），既有及时回应，又有彼此的情感表达。`;

  if (myWordPct >= 65) {
    badge = "热情输出";
    title = "你更主动热情 · 表达欲满满";
    description = `你在对话中贡献了 ${myWordPct}% 的篇幅，平均每条长达 ${myAvgWords} 字。不妨适当留白，给对方更多发起与展开话题的空间。`;
  } else if (crushWordPct >= 65) {
    badge = "对方倾诉";
    title = `${crushName} 倾诉欲强烈 · 信任度高`;
    description = `${crushName} 输出了 ${crushWordPct}% 的字数（平均单条 ${crushAvgWords} 字），说明非常乐于向你分享日常琐事与观点，心理防线较低。`;
  } else if (timeSlots.lateNight.pct >= 35) {
    badge = "深夜密语";
    title = "深夜时段高频共鸣";
    description = `超过 ${timeSlots.lateNight.pct}% 的对话发生在晚上 11 点之后。深夜往往是卸下防备、情感张力最强的黄金时间。`;
  } else if (crushReplies.quickRate !== null && crushReplies.quickRate >= 70) {
    badge = "高频秒回";
    title = `${crushName} 秒回率极高`;
    description = `${crushName} 在 5 分钟内的秒回率达到 ${crushReplies.quickRate}%，对你的消息重视程度非常可观。`;
  }

  return {
    totalMessages,
    totalWords,
    myCount,
    myCountPct,
    myWords,
    myWordPct,
    myAvgWords,
    myInitiations,
    myInitiationPct,
    myQuestions,
    myQuestionRate,
    myExpressiveCount,
    myAvgReplyMinutes: myReplies.avg,
    myQuickReplyRate: myReplies.quickRate,
    crushCount,
    crushCountPct,
    crushWords,
    crushWordPct,
    crushAvgWords,
    crushInitiations,
    crushInitiationPct,
    crushQuestions,
    crushQuestionRate,
    crushExpressiveCount,
    crushAvgReplyMinutes: crushReplies.avg,
    crushQuickReplyRate: crushReplies.quickRate,
    timeSlots,
    peakSlot,
    verdict: {
      badge,
      title,
      description,
      wordRatio: `${myWordPct}% : ${crushWordPct}%`,
      initiationRatio: `${myInitiations}次 : ${crushInitiations}次`,
    },
  };
}
