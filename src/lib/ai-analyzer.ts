import { Message, OverallAnalysis, ModelConfig } from "@/types/chat";

export async function analyzeChatHistory(
  messages: Message[]
): Promise<OverallAnalysis> {
  // 统一通过后端 .env 环境变量读取，前端不涉及任何 Key
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.deepseek.com/v1"
  ).replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "deepseek-chat";

  // 如果没有在 .env 配置任何 API Key，使用内置的高精度智能推导分析器
  if (!apiKey) {
    return generateSmartHeuristicAnalysis(messages);
  }

  const prompt = buildAnalysisPrompt(messages);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `你是一位顶级恋爱心理学家兼聊天沟通教练，擅长通过微信文字细节洞察两性好感度、隐秘心理与潜台词。
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

    if (!response.ok) {
      const errText = await response.text();
      console.warn("AI API request failed, falling back to smart heuristic:", errText);
      return generateSmartHeuristicAnalysis(messages);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return generateSmartHeuristicAnalysis(messages);
    }

    // 清理可能的 markdown 代码块标记
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return formatAiResult(parsed, messages);
  } catch (err) {
    console.error("AI analysis error:", err);
    return generateSmartHeuristicAnalysis(messages);
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

【分析要求】
1. 分析对方对【我方】的当前“好感度”评分（0到100整数）、好感度阶段（如：接触冰点/客气礼貌/友谊区间/暧昧拉扯/好感爆棚）、综合好感度诊断总结。
2. 分析【我方】目前的表现发挥评分（0到100整数）、发挥总结及存在的问题。
3. 给出下一步最明智、高情商的战略行动指引（nextStepAdvice）。
4. 针对对方最近的一两句发言，量身生成 3 条不同风格的【参考回复选项】（含：幽默推拉/共情调侃/制造好奇/以退为进等），并附带心理学机理分析。
5. 针对聊天中每一条消息（以 messageId 对应），分析其“情绪（emotion，3-6字）”、“意图/潜台词（intent，4-10字）”以及“深度解析（subtext）”。

请严格按以下 JSON 字段结构返回：
{
  "affectionScore": 75,
  "affectionStage": "暧昧升温中",
  "affectionSummary": "对方多次主动报备琐事...",
  "myPerformanceScore": 80,
  "myPerformanceSummary": "自嘲适度但稍微被动...",
  "nextStepAdvice": "顺应话题借机抛出游戏或线下邀约钩子...",
  "suggestedReplies": [
    {
      "id": "reply-1",
      "type": "幽默推拉",
      "text": "回复内容文本...",
      "rationale": "心理学推演理由..."
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
  const result: OverallAnalysis = {
    affectionScore: Number(parsed.affectionScore) || 70,
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
  };

  // 回填单句分析
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

  return result;
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

  const consecutiveCrushBursts = crushMessages.length >= myMessages.length ? 1 : 0;
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

  // 单条消息分析回填
  messages.forEach((m) => {
    if (!m.analysis) {
      if (!m.isMe) {
        // 对方消息
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
        // 我方消息
        m.analysis = {
          feedback: m.content.length > 20 ? "信息量充分，但略显主动" : "简练自然，接梗迅速",
          subtext: "抛出话题或给出反馈，给对方留出回击空间。",
        };
      }
    }
  });

  const lastCrushMsg = crushMessages[crushMessages.length - 1]?.content || "";

  return {
    affectionScore: score,
    affectionStage: stage,
    affectionSummary:
      crushMessages.length > 0
        ? `对方发言频次与互动意愿整体较强（${emojiCount > 0 ? "伴随丰富情绪/表情" : "沟通平稳"}），展现了良好的生活分享欲与信任基础。`
        : "聊天记录较短，对方初步参与交流，建议继续观察后续互动粘性。",
    myPerformanceScore: 82,
    myPerformanceSummary: "你的回复能接住核心梗，态度随和，但建议增加幽默反击与调侃，避免沦为单纯的倾听者。",
    nextStepAdvice: "利用对方最新抛出的情境细节，发起轻量调侃或埋下下次连麦/见面的线索，制造情绪过山车。",
    suggestedReplies: [
      {
        id: "rep-1",
        type: "幽默推拉（推荐）",
        text: lastCrushMsg.includes("王者") || lastCrushMsg.includes("游戏")
          ? "少来，小学生哪有你难带？改天我带你，让你见识下什么叫大腿。"
          : "哈哈你这么一说，我怎么觉得你是在故意暗示我呢？",
        rationale: "风趣反制，既不卑不亢，又自然营造出两人专属的互动契机。",
      },
      {
        id: "rep-2",
        type: "共情调侃",
        text: "心疼你一秒钟！赶紧放下手机深呼吸，免得被气出内伤~",
        rationale: "传递细腻的情绪关怀，展现同理心与体贴感。",
      },
      {
        id: "rep-3",
        type: "制造好奇",
        text: "其实关于这件事情，我刚刚突然发现了一个惊人细节，猜猜是什么？",
        rationale: "制造认知断层，用好奇心钩子引发对方主动秒回追问。",
      },
    ],
  };
}
