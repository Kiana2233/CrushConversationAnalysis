import { Message, SandboxAnalysis, ContextProbe, PolishedReply } from "@/types/chat";

export interface SandboxInputParams {
  messages: Message[];
  draftReply: string;
  crushName?: string;
  myName?: string;
  relationshipStatus?: string;
}

/**
 * 沙盒推演分析核心引擎：
 * 优先调用 DeepSeek 进行多角色推演，遇异常或超时时无缝降级为本地高精度恋爱心理推导
 */
export async function simulateReplySandbox(
  params: SandboxInputParams
): Promise<SandboxAnalysis> {
  const {
    messages,
    draftReply,
    crushName = "对方",
    myName = "我",
    relationshipStatus = "Crush / 暧昧中",
  } = params;

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

  // 若无 Key，启用本地推导引擎
  if (!apiKey) {
    return generateSmartSandboxHeuristic(params);
  }

  // 提取最近 6 条消息作为当前对局上下文
  const recentMessages = messages.slice(-6);
  const formattedRecent = recentMessages
    .map((m) => {
      const sender = m.isMe ? myName : crushName;
      return `${sender}: ${m.content}`;
    })
    .join("\n");

  const prompt = `你是一位顶级恋爱心理学家兼实战对局演练教练。
你深度贯彻“深情祖师爷”实战认知框架（吸引力>讨好、给台阶机制、人性不可考验、不确定即不喜欢、真诚反套路）。
当前关系定位：【${relationshipStatus}】
我方角色：【${myName}】
对方角色：【${crushName}】

【最近的聊天上下文】
${formattedRecent || "（暂无历史消息）"}

【我方打算回复的草稿】
"${draftReply}"

【沙盒推演核心任务】
1. 【知识盲区探针 (contextProbe)】：
   检查对方（${crushName}）最近发言中是否提到了某个具体的歌手、乐队、电视剧、电影、游戏、动漫、小众爱好或特定专有名词。
   如果有，请提炼出：
   - term: 专有名词名称
   - category: 分类 (音乐/影视/游戏/动漫/生活爱好/潮玩梗)
   - summary: 30字极简介绍（核心风格、代表作、大众口碑）
   - resonanceHook: 破冰切入点（粉丝最在意的点，如何不装懂却能顺水推舟聊起来）
   若无明显小众名词，此字段可设为 null。

2. 【草稿推演与风险诊断 (draftAssessment)】：
   假定我方真把这段草稿发给【${crushName}】：
   - continuationRate: 话题积极延续概率（0到100整数）。
   - riskLevel: "safe" | "warning" | "danger"
   - riskTag: 风险标签（例如：巧妙给足台阶、高姿态吸引、完美破冰、讨好感超标、施压过重缺乏台阶、装懂翻车预警、话题终结者、敷衍质问感）。
   - crushInnerThought: ${crushName} 看到这句草稿时的【真实内心独白 / 心理潜台词】（请以第一人称口吻，真实犀利，道出真实心理防线与压力点）。
   - predictedReply: ${crushName} 大概率会回复出的一句话（模拟真实回复）。
   - diagnosis: 针对这句草稿的一针见血实战点评（以吸引力法则、给台阶机制、需求感控制为准则，点破本质）。

3. 【三套高情商战术润色 (polishedReplies)】：
   针对当下的语境，重构 3 条真正具备实战杀伤力的高情商替代回复：
   - 第1条：【巧妙给台阶法】（深情祖师爷核心心法：制造合情合理的体面借口与台阶，降低对方心理阻力与防御心，让对方毫无心理负担地顺水推舟）。
   - 第2条：【高姿态吸引推拉】（拒绝舔狗式迎合，守住自身生活节奏与神秘感，不卑不亢幽默推拉，“吸引力 > 讨好”）。
   - 第3条：【真诚借力打力】（绝不强行装懂，面对盲区坦然承认并展示“因为你提了我特意了解”的重视细节，反向把麦克风交回对方求安利）。
   每条均附带 rationale（实战战术机理分析）。

请严格返回合法的 JSON 格式，不要包含任何 markdown 解释：
{
  "contextProbe": {
    "term": "漫长的季节",
    "category": "影视剧",
    "summary": "辛爽执导的高分悬疑生活剧，兼具东北时代挽歌与黑色幽默。",
    "resonanceHook": "剧迷最在意角色命运的反转与细节暗线，表达对悬念和质感的好奇最容易激发分享欲。"
  },
  "draftAssessment": {
    "continuationRate": 40,
    "riskLevel": "warning",
    "riskTag": "话题终结风险",
    "crushInnerThought": "唉，本来想兴奋分享一下的，你回得这么平淡，一下子不知道怎么接了...",
    "predictedReply": "还行吧，挺好看的。",
    "diagnosis": "单句询问略显机械，未能接住对方热切分享时的情绪波动。"
  },
  "polishedReplies": [
    {
      "type": "巧妙给台阶法",
      "text": "刚好看你提到这个，这周末我朋友爽约多留了张票/正好顺路去附近，赏脸一起探探？",
      "rationale": "制造自然体面的借口，降低对方心理阻力，顺水推舟毫无赴约压力。"
    },
    {
      "type": "高姿态吸引推拉",
      "text": "等等，你这是在默默向我投喂宝藏剧单吗？坦白从宽，你平时还藏了多少好物没交出来？",
      "rationale": "吸引力 > 讨好：不卑不亢风趣反击，展示自身价值与自信，制造良性情绪拉扯。"
    },
    {
      "type": "真诚借力打力",
      "text": "真没看过诶！但看你提就特意瞄了一眼，评分好高！你最推荐我从哪一集开始看呀？",
      "rationale": "真诚是最高级套路：坦然承认+秒搜展示重视，极大满足对方当‘导师’的安利快感。"
    }
  ]
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

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
            content: "你是一位顶级恋爱心理学家兼实战对局教练，融合了深情祖师爷核心实战心智框架（吸引力>讨好、给台阶机制、人性不可考验、不确定即不喜欢、真诚反套路）。坚决拒绝爹味与心灵鸡汤，返回严格 JSON 数据。",
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

    if (!response.ok) {
      console.warn("[Sandbox Analyzer] API 返回异常，自动启用本地推导引擎");
      return generateSmartSandboxHeuristic(params);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return generateSmartSandboxHeuristic(params);

    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      contextProbe: parsed.contextProbe || undefined,
      draftAssessment: {
        continuationRate: Number(parsed.draftAssessment?.continuationRate) || 50,
        riskLevel: parsed.draftAssessment?.riskLevel || "warning",
        riskTag: parsed.draftAssessment?.riskTag || "表现平平",
        crushInnerThought: parsed.draftAssessment?.crushInnerThought || "感觉有点不知道怎么回...",
        predictedReply: parsed.draftAssessment?.predictedReply || "哈哈也是呢。",
        diagnosis: parsed.draftAssessment?.diagnosis || "回复平稳，建议增加情感钩子与互动切入点。",
      },
      polishedReplies: Array.isArray(parsed.polishedReplies) && parsed.polishedReplies.length > 0
        ? parsed.polishedReplies.map((r: any, idx: number) => ({
            type: r.type || `高情商策略 ${idx + 1}`,
            text: r.text || "",
            rationale: r.rationale || "",
          }))
        : generateDefaultPolishedReplies(params),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[Sandbox Analyzer] 调用超时或异常，已优雅降级至本地引擎:", error);
    return generateSmartSandboxHeuristic(params);
  }
}

/**
 * 本地智能推导兜底：根据草稿长度、疑问词、语气特征及最新发言智能判定
 */
export function generateSmartSandboxHeuristic(
  params: SandboxInputParams
): SandboxAnalysis {
  const { messages, draftReply, crushName = "对方", myName = "我" } = params;

  // 获取最后一条来自 Crush 的发言
  const lastCrushMsg = messages.filter((m) => !m.isMe).slice(-1)[0]?.content || "";

  // 1. 尝试从最后几条发言中探测试图提到的小众词/文化符号
  const contextProbe = detectNicheEntities(lastCrushMsg);

  // 2. 评判用户的草稿特征
  const trimmedDraft = draftReply.trim();
  const len = trimmedDraft.length;

  const isBluntNo = /^(没听过|不知道|不认识|没看过|没怎么听|不了解|没玩过|啊\?|不知道啊)[。！!？?~～\s]*$/.test(
    trimmedDraft
  );
  const isTooShort = len <= 3;
  const isQuestionOnly = /^[?？]+$/.test(trimmedDraft) || /^(为什么|干嘛|做啥|啥)[?？]*$/.test(trimmedDraft);
  const isPretending = /(超级喜欢|我全知道|我也经常看|老粉了|很熟)/.test(trimmedDraft) && contextProbe;
  const hasCuriosity = /(搜了|瞄了一眼|推荐|感觉挺|好奇|你喜欢)/.test(trimmedDraft);
  const isSimping = /(求求|理理我|怎么不理|随你|我都行|听你的|你在干嘛呀为什么不回|只要你高兴|我都听你的)/.test(trimmedDraft);
  const isForcing = /(必须|出来见|出来吃|怎么不出来|你欠我的|给我出来)/.test(trimmedDraft);
  const hasFaceSaving = /(正好|顺路|朋友鸽了|多了一张|顺道|刚好有)/.test(trimmedDraft);

  let continuationRate = 65;
  let riskLevel: "safe" | "warning" | "danger" = "warning";
  let riskTag = "表现平稳";
  let crushInnerThought = `心里想：行吧，话题好像有点平淡，看看接下来聊点啥。`;
  let predictedReply = "哈哈好呀，那就这样呗。";
  let diagnosis = "回复节奏中规中矩，若能加入更具体的‘给台阶’借口或安利请求，效果会更具吸引力。";

  if (isSimping) {
    continuationRate = 30;
    riskLevel = "danger";
    riskTag = "讨好感超标预警";
    crushInnerThought = `心里感到压力甚至轻微下头：“怎么突然这么卑微讨好我？感觉有点窒息，而且暴露了太强的需求感，让人一下子不知道怎么平等对待了。”`;
    predictedReply = "啊哈哈，不用这样啦...";
    diagnosis = "深情祖师爷核心心法：‘吸引力 > 讨好’。没有人会因为你放低身段迎合而爱上你，反而会瞬间拉低你的魅力值。收回过度付出的姿态，保持自我节奏，才能重建对局平衡。";
  } else if (isForcing) {
    continuationRate = 35;
    riskLevel = "danger";
    riskTag = "施压过激·缺乏台阶";
    crushInnerThought = `心里退缩：“怎么直接强硬逼我做决定？答应了显得我很随便，拒绝又怕尴尬，干脆装没看见算了。”`;
    predictedReply = "这周可能不太方便，下次再说吧。";
    diagnosis = "深情祖师爷核心心法：‘给台阶机制’。人不是不想做，而是需要一个能说服自己的体面理由。不要强行逼迫邀约，要学会抛出合理的借口（如‘朋友鸽了多一张票/正好顺路’），给对方台阶下。";
  } else if (hasFaceSaving) {
    continuationRate = 92;
    riskLevel = "safe";
    riskTag = "巧妙给足台阶";
    crushInnerThought = `心里暗喜：“哇，这个理由太体面了！就算去也不会显得我很急或者很随便，顺着台阶走毫无心理负担！”`;
    predictedReply = "哈哈真的假的？那正好呀，反正我也有空！";
    diagnosis = "深情祖师爷核心心法：高超的给台阶操作！为对方提供了体面合逻辑的赴约借口，完美化解心理防备。";
  } else if (isBluntNo) {
    continuationRate = 25;
    riskLevel = "danger";
    riskTag = "话题终结者";
    crushInnerThought = `心里失落：“好吧，本来兴冲冲想分享我的宝藏爱好的，你一句不知道直接把天聊死了...瞬间没劲了。”`;
    predictedReply = "好吧哈哈，那你平时都看/听啥呢？";
    diagnosis = "直接回“不知道/没听过”给对方泼了冷水，扑灭了对方热切的倾诉欲望。应采取‘真诚承认+秒搜求安利’的借力打力法。";
  } else if (isTooShort || isQuestionOnly) {
    continuationRate = 35;
    riskLevel = "danger";
    riskTag = "敷衍质问感";
    crushInnerThought = `心里嘀咕：“就回这么两三个字？感觉像在查户口或者敷衍我，我到底要不要继续热脸贴冷屁股？”`;
    predictedReply = "呃，就挺随意的...";
    diagnosis = "过短的单字或纯标点容易让对方产生‘你在应付差事’的心理压力，严重消耗对话积极性。";
  } else if (isPretending) {
    continuationRate = 45;
    riskLevel = "danger";
    riskTag = "装懂翻车预警";
    crushInnerThought = `心里暗喜又怀疑：“哇你也懂？那我顺便考考你最喜欢哪段/哪个角色？”（立刻埋下随时翻车的巨大隐患）`;
    predictedReply = "天哪真假的！那你最喜欢哪一个？快跟我说说！";
    diagnosis = "装作懂容易在对方追问具体细节时露出马脚，丧失真诚感。恋爱中最动人的是‘真诚反套路：我虽不懂，但因为是你，我愿好奇去探究’。";
  } else if (hasCuriosity) {
    continuationRate = 88;
    riskLevel = "safe";
    riskTag = "高情商共鸣";
    crushInnerThought = `心里超开心：“天哪，TA居然把我随口提的事放在心上了！而且还主动向我请教，这人好真诚好有品位！”`;
    predictedReply = "哈哈我跟你说！一定要先看第二首/那一章，超级绝！你听完一定会感谢我的！";
    diagnosis = "真诚借力打力：诚恳且有探索欲，把表达的主导权舒适地交还给对方，大幅满足了对方的分享快感与认同感。";
  }

  return {
    contextProbe: contextProbe || undefined,
    draftAssessment: {
      continuationRate,
      riskLevel,
      riskTag,
      crushInnerThought,
      predictedReply,
      diagnosis,
    },
    polishedReplies: generateDefaultPolishedReplies(params, contextProbe),
  };
}

/**
 * 启发式探测对方发言中的小众专有名词或特定梗
 */
function detectNicheEntities(content: string): ContextProbe | null {
  if (!content) return null;

  const dictionary: Array<{
    keywords: RegExp;
    term: string;
    category: string;
    summary: string;
    resonanceHook: string;
  }> = [
    {
      keywords: /漫长的季节|隐秘的角落|狂飙|繁花|白夜追凶|周处除三害/,
      term: "高口碑影视神作",
      category: "影视剧",
      summary: "豆瓣高分口碑之作，注重剧情反转、时代沉重感与鲜明的人物宿命。",
      resonanceHook: "剧迷最享受拆解细节伏笔，表达对反转剧情的浓厚好奇能迅速打开话匣子。",
    },
    {
      keywords: /新裤子|草东|五条人|告五人|落日飞车|万能青年旅店|回春丹|刺猬/,
      term: "独立摇滚乐队",
      category: "独立音乐",
      summary: "兼具浪漫诗意与年轻一代生活宣泄的独立乐队，现场感染力极强。",
      resonanceHook: "乐迷最在乎‘小众认同感’，切忌装老粉，求推荐入门曲目是最佳破冰策略。",
    },
    {
      keywords: /原神|崩铁|黑神话|塞尔达|双人成行|大表哥|法环|艾尔登/,
      term: "高品质游戏大作",
      category: "主机/精品游戏",
      summary: "沉浸式开放世界或高难度神作，注重探索快感与叙事深度。",
      resonanceHook: "玩家最渴望被认同通关水平与审美，以‘菜鸡求带/求避坑’切入能让对方成就感爆棚。",
    },
    {
      keywords: /排球少年|间谍过家家|葬送的芙莉莲|电锯人|咒术回战/,
      term: "高分热门动漫",
      category: "动漫番剧",
      summary: "作画精良、剧情极具感染力的人气动漫，受众情感粘性极高。",
      resonanceHook: "漫迷最爱嗑人设与名场面，表达‘看你这么推我也想入坑’能让对方瞬间心花怒放。",
    },
  ];

  for (const item of dictionary) {
    if (item.keywords.test(content)) {
      const match = content.match(item.keywords);
      return {
        term: match ? match[0] : item.term,
        category: item.category,
        summary: item.summary,
        resonanceHook: item.resonanceHook,
      };
    }
  }

  return null;
}

/**
 * 针对当前场景生成三套兜底战术润色
 */
function generateDefaultPolishedReplies(
  params: SandboxInputParams,
  probe?: ContextProbe | null
): PolishedReply[] {
  const termName = probe?.term || "这个";

  return [
    {
      type: "巧妙给台阶法",
      text: probe
        ? `刚好这周末路过那边，看你提过【${termName}】，顺道去探探还是赏脸一起去喝杯咖啡聊聊？`
        : `正好周末朋友鸽了我多了一张票，看你之前聊起过这个，要不要顺道一起去拔草？`,
      rationale: "深情祖师爷核心心法：制造合情合理的体面借口与台阶，给对方体面的赴约/回复理由，防御心理直降。",
    },
    {
      type: "高姿态吸引推拉",
      text: probe
        ? `等等，你这是在暗戳戳向我投喂高质量宝藏吗？坦白从宽，你平时还藏了多少好物没交出来？`
        : `哈哈你这么一说我怎么感觉你是个隐藏高手？改天看你表现，我再考虑要不要带你飞一把~`,
      rationale: "牢记‘吸引力 > 讨好’：不卑不亢反向调侃，展示自身价值与自信，制造良性情绪拉扯。",
    },
    {
      type: "真诚借力打力",
      text: probe
        ? `真没接触过诶！但刚才看到你提，我特意去搜了一下【${termName}】，感觉好抓人！你最推荐我从哪里开始入坑呀？`
        : `真没了解过诶！不过听你这么一说我超级好奇，有什么必看的入门推荐吗？快给我种种草~`,
      rationale: "真诚是最高级套路：面对未知绝不强行装懂，坦然承认并展示重视细节，极大激发对方分享欲与导师成就感。",
    },
  ];
}
