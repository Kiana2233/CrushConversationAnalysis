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

export interface RadarDimension {
  dimension: string;      // 维度名 (情感张力 / 情绪价值 / 分享意愿 / 相处安全感 / 话题掌控力)
  score: number;          // 0 - 100
  comment: string;        // 犀利简评
}

export interface TimelineMoment {
  timeLabel: string;      // 节点阶段描述 (如 "破冰起步", "深夜深聊", "分歧降温", "甜度回升")
  score: number;          // 情绪指数 0 - 100
  event: string;          // 事件或名场面描述
  quote?: string;         // 关键对话原句
  isHighlight?: boolean;  // 是否高光波峰
}

export interface KeywordCloudItem {
  text: string;           // 关键词
  weight: number;         // 权重 1 - 10
  category: "shared" | "crush" | "me"; // 双方共鸣 / 对方专属 / 我方专属
}

export interface OverallAnalysis {
  affectionScore: number;         // 好感度 0 - 100
  affectionStage: string;         // 接触期 / 暧昧升温 / 忽冷忽热 / 深度依赖
  affectionSummary: string;       // 好感度总结
  myPerformanceScore: number;     // 我的发挥评分 0 - 100
  myPerformanceSummary: string;   // 我的发挥总结
  nextStepAdvice: string;         // 下一步行动策略指南
  suggestedReplies: SuggestedReply[];
  radarDimensions?: RadarDimension[];
  timelineTrend?: TimelineMoment[];
  keywords?: KeywordCloudItem[];
}

export interface ContextProbe {
  term: string;           // 识别出的小众专有名词/影视/歌手/梗
  category: string;       // 类别 (音乐/影视/动漫/游戏/潮流爱好/生活方式)
  summary: string;        // 30字极简速览 (核心气质、代表作)
  resonanceHook: string;  // 破冰切入点 (为什么粉丝喜欢，怎么顺水推舟聊)
}

export interface PolishedReply {
  type: string;           // 借力打力·安利法 / 幽默推拉 / 情绪共鸣 / 以退为进
  text: string;           // 润色回复
  rationale: string;      // 为什么这样回能赢的心理学机理
}

export interface SandboxAnalysis {
  contextProbe?: ContextProbe;
  draftAssessment: {
    continuationRate: number; // 积极回应/话题延续概率 0 - 100
    riskLevel: "safe" | "warning" | "danger";
    riskTag: string;          // 风险标签 (e.g. 话题终结者 / 查户口感 / 过于被动 / 装懂风险 / 表现得体)
    crushInnerThought: string;// Crush 看到这句草稿的心理潜台词
    predictedReply: string;   // Crush 大概率会回复的一句话
    diagnosis: string;        // 心理学战术点评
  };
  polishedReplies: PolishedReply[];
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
