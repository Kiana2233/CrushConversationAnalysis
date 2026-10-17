export interface Message {
  id: string;
  sender: string;
  isMe: boolean;
  timestamp: string;
  content: string;
  rawText?: string;
  analysis?: MessageAnalysis;
}

export interface MessageAnalysis {
  emotion?: string;       // 情绪 (e.g. 傲娇 / 期待 / 略显无聊)
  intent?: string;        // 意图/潜台词 (e.g. 主动报备 / 寻求认同 / 试探态度)
  feedback?: string;      // 发挥点评 (针对我方发言)
  subtext?: string;       // 心理学解读深度解析
}

export interface SuggestedReply {
  id: string;
  type: string;           // 幽默推拉 / 共情共鸣 / 制造好奇 / 适度冷淡
  text: string;           // 推荐回复内容
  rationale: string;      // 推荐理由与心理学机理
}

export interface OverallAnalysis {
  affectionScore: number;         // 好感度 0 - 100
  affectionStage: string;         // 接触期 / 暧昧升温 / 忽冷忽热 / 深度依赖
  affectionSummary: string;       // 好感度总结
  myPerformanceScore: number;     // 我的发挥评分 0 - 100
  myPerformanceSummary: string;   // 我的发挥总结
  nextStepAdvice: string;         // 下一步行动策略指南
  suggestedReplies: SuggestedReply[];
}

export interface ModelConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatSession {
  id: string;
  title: string;
  crushName: string;
  myName: string;
  relationshipStatus: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  overallAnalysis?: OverallAnalysis;
}

export interface SessionSummary {
  id: string;
  title: string;
  crushName: string;
  myName: string;
  relationshipStatus: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  affectionScore: number | null;
  affectionStage: string | null;
  lastMessageSnippet: string;
}
