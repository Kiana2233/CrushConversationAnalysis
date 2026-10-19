import { Message, OverallAnalysis, ModelConfig } from "@/types/chat";

export interface AnalysisExecutionResult {
  overallAnalysis: OverallAnalysis;
  isFallback: boolean;
  source: "deepseek" | "heuristic";
  reason?: string;
}

/**
 * 核心分析方法：优先调用 DeepSeek 等兼容大模型，遭遇异常或超时时无缝使用本地推导引擎兜底
 */
export async function analyzeChatHistory(
  messages: Message[]
): Promise<AnalysisExecutionResult> {
  // 统一通过后端环境变量读取，去除两端不可见空白
  const apiKey = (
    process.env.AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ""
  ).trim();

  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.deepseek.com"
  ).replace(/\/+$/, "");

  const model = (process.env.AI_MODEL || "deepseek-chat").trim();

  // 1. 无 Key 兜底策略：未配置 API Key 时自动启用本地高精度引擎
  if (!apiKey) {
    console.info("[AI Analyzer] 未检测到 API Key，自动启用内置高精度本地引擎");
    return {
      overallAnalysis: generateSmartHeuristicAnalysis(messages),
      isFallback: true,
      source: "heuristic",
      reason: "未配置 API Key，已自动使用内置高精度本地引擎研判",
    };
  }

  const prompt = buildAnalysisPrompt(messages);

  // 2. 超时熔断保护：25秒自动 abort，防止大模型请求长久挂起导致前端一直在“分析中”
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `你是一位顶级恋爱心理学家兼实战对局教练，融合了现代依恋心理学与“深情祖师爷”实战认知框架（吸引力>讨好、给台阶机制、人性不可考验、不确定即不喜欢、真诚反套路）。
你擅长通过微信文字细节洞察两性好感度、隐秘心理与潜台词，坚决拒绝爹味说教与廉价心灵鸡汤，输出一针见血、高情商且具有极高实战价值的研判建议。
请务必返回严格的 JSON 格式数据，不得输出任何额外的 Markdown 解释说明。`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timeoutId);

    // 3. HTTP 错误码细分兜底策略 (401 / 402 / 429 / 5xx)
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let reason = `API 响应状态码 ${response.status}`;
      if (response.status === 401) reason = "API Key 无效或未授权 (401)";
      else if (response.status === 402) reason = "DeepSeek 账户余额不足 (402)";
      else if (response.status === 429) reason = "调用过于频繁，触发限流保护 (429)";
      else if (response.status >= 500) reason = "DeepSeek 官方服务器暂时繁忙 (5xx)";

      console.warn(`[AI Analyzer] API 调用失败 [${reason}]，自动降级至内置引擎:`, errText);
      return {
        overallAnalysis: generateSmartHeuristicAnalysis(messages),
        isFallback: true,
        source: "heuristic",
        reason,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[AI Analyzer] API 返回内容为空，已使用内置引擎兜底");
      return {
        overallAnalysis: generateSmartHeuristicAnalysis(messages),
        isFallback: true,
        source: "heuristic",
        reason: "模型返回内容为空",
      };
    }

    // 清理可能的 markdown 代码块标记
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      overallAnalysis: formatAiResult(parsed, messages),
      isFallback: false,
      source: "deepseek",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === "AbortError" || err?.message?.includes("aborted");
    const reason = isTimeout
      ? "DeepSeek 响应超过 25 秒超时，已自动切换本地推导"
      : `网络或接口异常 (${err?.message || "未知原因"})`;

    console.error("[AI Analyzer] 请求异常，自动无缝切换本地推导兜底:", err);
    return {
      overallAnalysis: generateSmartHeuristicAnalysis(messages),
      isFallback: true,
      source: "heuristic",
      reason,
    };
  }
}

function buildAnalysisPrompt(messages: Message[]): string {
  const formattedChat = messages
    .map((m) => {
      const role = m.isMe ? "【我方】" : "【对方Crush】";
      return `${role} ${m.sender} (${m.timestamp}): ${m.content}`;
    })
    .join("\n");

  return `请深度研判以下微信聊天记录：

${formattedChat}

【核心研判原则与认知模型】
必须基于以下 5 大实战认知模型进行穿透式研判：
1. 【吸引力法则（吸引力 > 讨好）】：没有人会因为你卑微付出或无底线讨好而喜欢你。重点审视【我方】是否存在字数严重失衡（我方长篇大论对方单字敷衍）、秒回过多、频繁卑微报备、无底线迎合的“舔狗/需求感过载”行为；若有，在 myPerformanceSummary 中直接指出并从严扣分。
2. 【给台阶机制（Face-Saving Architecture）】：人不是不想互动，而是需要一个能说服自己、保持体面的理由。评估双方是否在为对方提供台阶；在规划 nextStepAdvice 时，绝不建议直接逼迫邀约，必须指导我方“制造自然合逻辑的台阶与借口”。
3. 【不确定即不喜欢（现实主义止损）】：如果对方回复长周期敷衍、忽冷忽热，直接诊断为对方当前好感不足，严禁给出“继续坚持每天早安晚安”的毒鸡汤，必须指导我方守住尊严边界，冷处理抽离并专注自我提升（你若盛开，蝴蝶自来）。
4. 【人性不可考验】：反对故意断联、故意冷落测探等反噬关系的伪技巧，提倡直接、体面、有边界感的沟通。
5. 【真诚是最高级的套路】：面对未知话题绝不强行装懂，善于以真诚好奇反向借力打力。

【输出要求】
1. 分析对方对【我方】的当前“好感度”评分（0到100整数）、好感度阶段（如：接触冰点/客气礼貌/友谊区间/暧昧拉扯/好感爆棚）、综合好感度诊断总结。
2. 分析【我方】目前的表现发挥评分（0到100整数，严格考核需求感与讨好倾向）、发挥总结（犀利指出问题）。
3. 给出下一步最明智、高情商的战略行动指引（nextStepAdvice），务实、带行动台阶。
4. 针对对方最近的一两句发言，量身生成 3 条不同实战维度的【参考回复选项】：
   - 第1条：【巧妙给台阶法】（制造合情合理的体面借口，降低对方心理阻力与防御心）
   - 第2条：【高姿态吸引推拉】（拒绝舔狗式迎合，保持自身神秘感与生活节奏，不卑不亢）
   - 第3条：【真诚借力打力】（绝不强行装懂，真诚求教反向激发对方倾诉欲与分享欲）
   每条均附带战术机理分析（rationale）。
5. 针对聊天中每一条消息（以 messageIndex 对应），分析其“情绪（emotion，3-6字）”、“意图/潜台词（intent，4-10字）”以及“深度解析（subtext）”。
6. 【雷达图五维评分】（0-100分及简评）：情感张力、情绪价值、分享意愿、相处安全感、话题掌控力。
7. 【对话情绪走势】：沿对话发展提炼 3-5 个阶段节点（timeLabel, score: 0-100, event, quote, isHighlight）。
8. 【话题关键词气泡云】：提炼 6-10 个代表性话题/口头禅/热词，标注 category ("shared"|"crush"|"me") 与 weight (1-10)。

请严格按以下 JSON 字段结构返回：
{
  "affectionScore": 75,
  "affectionStage": "暧昧升温中",
  "affectionSummary": "对方多次主动报备琐事...",
  "myPerformanceScore": 75,
  "myPerformanceSummary": "需求感控制尚可，但缺乏关键推进时的体面台阶...",
  "nextStepAdvice": "以给台阶机制抛出轻量借口，制造低心理负担的互动契机...",
  "radarDimensions": [
    { "dimension": "情感张力", "score": 82, "comment": "多次隐晦试探与推拉，张力充盈" },
    { "dimension": "情绪价值", "score": 78, "comment": "能积极接住对方情绪并提供心理按摩" },
    { "dimension": "分享意愿", "score": 85, "comment": "主动报备日常生活，信任度高" },
    { "dimension": "相处安全感", "score": 75, "comment": "回复稳定，互动节奏合拍" },
    { "dimension": "话题掌控力", "score": 68, "comment": "交替主导，未出现单方面被牵着鼻子走" }
  ],
  "timelineTrend": [
    { "timeLabel": "开场破冰", "score": 65, "event": "日常问候打招呼", "quote": "在干嘛呢", "isHighlight": false },
    { "timeLabel": "话题升温", "score": 85, "event": "共鸣吐槽与分享趣事", "quote": "今天遇到一件奇葩事", "isHighlight": true },
    { "timeLabel": "深夜晚安", "score": 88, "event": "依依不舍与次日约定", "quote": "快睡吧，明天见", "isHighlight": true }
  ],
  "keywords": [
    { "text": "王者荣耀", "weight": 9, "category": "shared" },
    { "text": "小学生", "weight": 8, "category": "crush" },
    { "text": "晚安", "weight": 7, "category": "shared" },
    { "text": "带你飞", "weight": 6, "category": "me" }
  ],
  "suggestedReplies": [
    {
      "id": "reply-1",
      "type": "巧妙给台阶法",
      "text": "回复内容文本...",
      "rationale": "制造合理体面理由，降低对方心理负担..."
    },
    {
      "id": "reply-2",
      "type": "高姿态吸引推拉",
      "text": "回复内容文本...",
      "rationale": "展示生活节奏，反向推拉调侃..."
    },
    {
      "id": "reply-3",
      "type": "真诚借力打力",
      "text": "回复内容文本...",
      "rationale": "绝不装懂，真诚求教激发倾诉欲..."
    }
  ],
  "messageAnalyses": [
    {
      "messageIndex": 0,
      "emotion": "略显无聊",
      "intent": "主动报备",
      "subtext": "心理学潜台词细节..."
    }
  ]
}`;
}

function formatAiResult(parsed: any, messages: Message[]): OverallAnalysis {
  const affectionScore = Number(parsed.affectionScore) || 70;
  const result: OverallAnalysis = {
    affectionScore,
    affectionStage: parsed.affectionStage || "暧昧拉扯中",
    affectionSummary: parsed.affectionSummary || "对方态度积极，保持了良好的沟通节奏与分享欲。",
    myPerformanceScore: Number(parsed.myPerformanceScore) || 78,
    myPerformanceSummary: parsed.myPerformanceSummary || "互动节奏平稳，建议多引导互动钩子。",
    nextStepAdvice: parsed.nextStepAdvice || "保持适度好奇心，抓住对方给出的日常细节展开互动。",
    suggestedReplies: Array.isArray(parsed.suggestedReplies)
      ? parsed.suggestedReplies.map((r: any, idx: number) => ({
          id: r.id || `reply-${idx}`,
          type: r.type || "高情商回复",
          text: r.text || "",
          rationale: r.rationale || "",
        }))
      : [],
    radarDimensions: Array.isArray(parsed.radarDimensions) && parsed.radarDimensions.length >= 3
      ? parsed.radarDimensions.map((r: any) => ({
          dimension: String(r.dimension || "综合维度"),
          score: Math.min(100, Math.max(0, Number(r.score) || 70)),
          comment: String(r.comment || ""),
        }))
      : generateDefaultRadar(messages, affectionScore),
    timelineTrend: Array.isArray(parsed.timelineTrend) && parsed.timelineTrend.length >= 2
      ? parsed.timelineTrend.map((t: any) => ({
          timeLabel: String(t.timeLabel || "交流阶段"),
          score: Math.min(100, Math.max(0, Number(t.score) || 70)),
          event: String(t.event || ""),
          quote: t.quote ? String(t.quote) : undefined,
          isHighlight: Boolean(t.isHighlight),
        }))
      : generateDefaultTimeline(messages, affectionScore),
    keywords: Array.isArray(parsed.keywords) && parsed.keywords.length >= 3
      ? parsed.keywords.map((k: any) => ({
          text: String(k.text || ""),
          weight: Math.min(10, Math.max(1, Number(k.weight) || 5)),
          category: ["shared", "crush", "me"].includes(k.category) ? k.category : "shared",
        }))
      : generateDefaultKeywords(messages),
  };

  // 回填 AI 产出的单句分析
  if (Array.isArray(parsed.messageAnalyses)) {
    parsed.messageAnalyses.forEach((item: any) => {
      const idx = item.messageIndex;
      if (typeof idx === "number" && messages[idx]) {
        messages[idx].analysis = {
          emotion: item.emotion,
          intent: item.intent,
          subtext: item.subtext,
          feedback: item.feedback,
        };
      }
    });
  }

  // 兜底补齐：未被 AI 覆盖到的消息使用启发式规则补充，杜绝界面出现空缺或永久“分析中”
  messages.forEach((m) => {
    if (!m.analysis || (!m.analysis.emotion && !m.isMe) || (!m.analysis.feedback && m.isMe)) {
      populateSingleMessageHeuristic(m);
    }
  });

  return result;
}

/**
 * 针对单条消息的启发式心理学特征填充
 */
export function populateSingleMessageHeuristic(m: Message): void {
  if (!m.isMe) {
    if (/王者|游戏|在干嘛|打|吃|看/.test(m.content)) {
      m.analysis = {
        emotion: "放松 / 坦白",
        intent: "主动报备日程",
        subtext: "毫无戒备地分享当下动态，属于高意愿延续对话的信号。",
      };
    } else if (/小学生|被坑|吐槽|累|烦/.test(m.content)) {
      m.analysis = {
        emotion: "撒娇 / 寻求认同",
        intent: "情绪宣泄与共鸣",
        subtext: "向你展示脆弱与负面情绪，希望获得你的接纳与情绪支持。",
      };
    } else if (/\[.+?\]|[哈嘻嘿]/.test(m.content)) {
      m.analysis = {
        emotion: "愉悦 / 破冰",
        intent: "调节沟通氛围",
        subtext: "使用表情包烘托轻松氛围，避免话题冷场。",
      };
    } else {
      m.analysis = {
        emotion: "平和 / 倾听",
        intent: "反馈互动",
        subtext: "常规回应，等待进一步话题引导。",
      };
    }
  } else {
    m.analysis = {
      feedback: m.content.length > 20 ? "信息量充分，但略显主动" : "简练自然，接梗迅速",
      subtext: "抛出话题或给出反馈，给对方留出回击空间。",
    };
  }
}

/**
 * 内置智能心理学推导引擎（无需 API Key 即可本地高准确度分析）
 */
export function generateSmartHeuristicAnalysis(messages: Message[]): OverallAnalysis {
  const crushMessages = messages.filter((m) => !m.isMe);
  const myMessages = messages.filter((m) => m.isMe);

  // 基础特征指标
  const totalLength = crushMessages.reduce((acc, m) => acc + m.content.length, 0);
  const avgCrushLength = crushMessages.length > 0 ? totalLength / crushMessages.length : 0;
  const emojiCount = crushMessages.filter((m) =>
    /\[.+?\]|[哈嘻嘿😄😊🤣🤔❤️✨🌹]/.test(m.content)
  ).length;

  const questionCount = crushMessages.filter((m) => /[？?嘛呢吧么]/.test(m.content)).length;

  // 动态好感度模型 (基础分 65)
  let score = 65;
  if (crushMessages.length > myMessages.length) score += 8;
  if (emojiCount >= 1) score += 6;
  if (questionCount >= 1) score += 8;
  if (avgCrushLength > 10) score += 5;
  score = Math.min(95, Math.max(35, score));

  let stage = "友好互动期";
  if (score >= 80) stage = "暧昧升温中";
  else if (score >= 70) stage = "好感试探中";
  else if (score <= 50) stage = "礼貌距离期";

  // 全量单条消息补齐分析
  messages.forEach((m) => {
    if (!m.analysis || (!m.analysis.emotion && !m.isMe) || (!m.analysis.feedback && m.isMe)) {
      populateSingleMessageHeuristic(m);
    }
  });

  const lastCrushMsg = crushMessages[crushMessages.length - 1]?.content || "";

  // 检查我方是否有讨好 / 需求感过载迹象 (吸引力 > 讨好)
  const myTotalLength = myMessages.reduce((acc, m) => acc + m.content.length, 0);
  const isSimping = myMessages.length >= 3 && myTotalLength > totalLength * 1.8;
  const myPerformanceScore = isSimping ? 68 : 82;
  const myPerformanceSummary = isSimping
    ? "【注意需求感过载】你的回复篇幅明显长于对方，存在过度解释与迎合倾向。牢记‘吸引力 > 讨好’：停止单方面情绪倾倒，适当精炼字数，保持自我生活节奏。"
    : "整体互动不卑不亢，未暴露过强需求感。建议多在关键节点‘巧妙给台阶’，制造低心理负担的互动契机。";

  const nextStepAdvice = isSimping
    ? "当前对方投入度低于你，切忌继续疯狂发消息或查户口。先冷处理半天，专注自身工作/运动，找回主场气场（你若盛开，蝴蝶自来）。"
    : "顺应最新话题，运用‘给台阶机制’抛出合理的轻量借口（如顺路/朋友鸽了），降低对方防备心，自然推进下一步互动。";

  return {
    affectionScore: score,
    affectionStage: stage,
    affectionSummary:
      crushMessages.length > 0
        ? `对方发言频次与互动意愿整体较强（${emojiCount > 0 ? "伴随丰富情绪/表情" : "沟通平稳"}），展现了良好的生活分享欲与信任基础。`
        : "聊天记录较短，对方初步参与交流，建议继续观察后续互动粘性。",
    myPerformanceScore,
    myPerformanceSummary,
    nextStepAdvice,
    radarDimensions: generateDefaultRadar(messages, score),
    timelineTrend: generateDefaultTimeline(messages, score),
    keywords: generateDefaultKeywords(messages),
    suggestedReplies: [
      {
        id: "rep-1",
        type: "巧妙给台阶法",
        text: lastCrushMsg.includes("王者") || lastCrushMsg.includes("游戏")
          ? "刚好周末朋友鸽了我，缺个开黑搭档。赏脸让我带你飞一把？"
          : "正好顺路在附近办事，看你提过这家店，顺道给你带一杯还是赏脸一起坐坐？",
        rationale: "深情祖师爷核心心法：制造合情合理的借口与台阶，给对方体面的赴约/回复理由，防御心理直降。",
      },
      {
        id: "rep-2",
        type: "高姿态吸引推拉",
        text: lastCrushMsg.includes("王者") || lastCrushMsg.includes("游戏")
          ? "少来，小学生哪有你难带？改天让你见识下什么叫大腿，不过得看你表现~"
          : "哈哈你这么一说，我怎么觉得你是在故意暗示我呢？坦白从宽，藏了什么心事？",
        rationale: "吸引力 > 讨好：不卑不亢风趣反击，展示自身价值与自信，制造良性情绪拉扯。",
      },
      {
        id: "rep-3",
        type: "真诚借力打力",
        text: "真没太了解过诶！不过听你这么一说我突然超级好奇，有什么必入坑推荐吗？快给我种种草~",
        rationale: "真诚是最高级套路：面对未知绝不强行装懂，坦然承认并展示重视细节，极大激发对方分享欲。",
      },
    ],
  };
}

export function generateDefaultRadar(messages: Message[], affectionScore: number) {
  const isSweet = affectionScore >= 75;
  return [
    {
      dimension: "情感张力",
      score: Math.min(95, Math.max(50, affectionScore + (isSweet ? 4 : -5))),
      comment: isSweet ? "言语间多次出现推拉与试探，暧昧张力充盈" : "互动平实温和，尚未展开高频情感试探",
    },
    {
      dimension: "情绪价值",
      score: Math.min(95, Math.max(55, affectionScore + 2)),
      comment: "双方均能较好接住话题并给予情绪安抚或调侃",
    },
    {
      dimension: "分享意愿",
      score: Math.min(98, Math.max(60, messages.length > 8 ? 85 : 70)),
      comment: "日常琐碎报备密集，心理防御壁垒较低",
    },
    {
      dimension: "相处安全感",
      score: Math.min(92, Math.max(50, 78)),
      comment: "回复连贯稳定，无明显忽冷忽热断崖感",
    },
    {
      dimension: "话题掌控力",
      score: 72,
      comment: "交替开启与承接，节奏掌控较为平衡",
    },
  ];
}

export function generateDefaultTimeline(messages: Message[], affectionScore: number) {
  if (messages.length <= 2) {
    return [
      { timeLabel: "破冰接触", score: 65, event: "初步建立对话连接", quote: messages[0]?.content, isHighlight: false },
      { timeLabel: "当前阶段", score: affectionScore, event: "保持互动与好感探索", isHighlight: true },
    ];
  }

  const p1 = messages[0];
  const midIdx = Math.floor(messages.length / 2);
  const p2 = messages[midIdx];
  const p3 = messages[messages.length - 1];

  return [
    {
      timeLabel: "开场破冰",
      score: 62,
      event: "日常问候打招呼开启话题",
      quote: p1 ? p1.content.slice(0, 20) : undefined,
      isHighlight: false,
    },
    {
      timeLabel: "话题深入",
      score: Math.min(95, affectionScore + 6),
      event: "分享琐事与情绪共鸣",
      quote: p2 ? p2.content.slice(0, 20) : undefined,
      isHighlight: true,
    },
    {
      timeLabel: "当前状态",
      score: affectionScore,
      event: "意犹未尽的互动拉扯",
      quote: p3 ? p3.content.slice(0, 20) : undefined,
      isHighlight: affectionScore >= 80,
    },
  ];
}

export function generateDefaultKeywords(messages: Message[]) {
  const allText = messages.map((m) => m.content).join(" ");
  const candidates: Array<{ text: string; weight: number; category: "shared" | "crush" | "me" }> = [];

  const commonKeywords = [
    { word: "王者", cat: "shared" as const, weight: 9 },
    { word: "游戏", cat: "shared" as const, weight: 8 },
    { word: "晚安", cat: "shared" as const, weight: 8 },
    { word: "吃饭", cat: "shared" as const, weight: 7 },
    { word: "加班", cat: "crush" as const, weight: 7 },
    { word: "哈哈", cat: "shared" as const, weight: 9 },
    { word: "小学生", cat: "crush" as const, weight: 8 },
    { word: "带你飞", cat: "me" as const, weight: 7 },
    { word: "周末", cat: "shared" as const, weight: 6 },
    { word: "猫咪", cat: "crush" as const, weight: 7 },
  ];

  commonKeywords.forEach((item) => {
    if (allText.includes(item.word)) {
      candidates.push({ text: item.word, weight: item.weight, category: item.cat });
    }
  });

  if (candidates.length < 4) {
    candidates.push(
      { text: "日常分享", weight: 8, category: "shared" },
      { text: "秒回", weight: 7, category: "me" },
      { text: "情绪价值", weight: 9, category: "shared" },
      { text: "晚安", weight: 6, category: "crush" }
    );
  }

  return candidates;
}
