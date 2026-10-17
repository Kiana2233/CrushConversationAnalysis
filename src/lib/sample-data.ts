import { Message, OverallAnalysis } from "@/types/chat";

export interface ChatScenario {
  id: string;
  name: string;
  crushName: string;
  myName: string;
  status: string;
  clipboardText: string;
  messages: Message[];
  analysis: OverallAnalysis;
}

export const SCENARIOS: ChatScenario[] = [
  {
    id: "sweet-date",
    name: "☕ 探店分享与周末邀约（高甜暧昧）",
    crushName: "林小鹿",
    myName: "我",
    status: "Crush / 暧昧升温中",
    clipboardText: `林小鹿  昨天 21:35
这家咖啡馆的焦糖肉桂卷真的封神了！[图片]

林小鹿  昨天 21:36
刚出炉热乎乎的，瞬间治愈了一整天的搬砖怨气

我  昨天 21:40
看着太诱人了，是在静安弄堂里的那家？

林小鹿  昨天 21:42
你怎么知道！隐藏得那么深，一般人根本找不到

林小鹿  昨天 21:42
而且店里还在放我最喜欢那支独立乐队的黑胶唱片，氛围感拉满了

我  昨天 21:45
因为某人之前发歌单动态的时候，我就默默记下了

林小鹿  昨天 21:46
哇...你居然这么细心的吗 [害羞]

林小鹿  昨天 21:47
那这周六要不要一起去公园？正好听你说说你上次提到的那个秘密`,
    analysis: {
      affectionScore: 88,
      affectionStage: "高甜暧昧期",
      affectionSummary:
        "对方主动向你分享日常高光体验（美食、音乐、情绪解压），对你的细心关注表现出明显的惊喜与害羞反应，且主动发出了周末线下见面的明确邀约信号，好感度处于极佳的升温期。",
      myPerformanceScore: 92,
      myPerformanceSummary:
        "“默默记下喜好”的回应给足了专属感与情绪价值，展现了高级的倾听力，瞬间击中对方内心防线。",
      nextStepAdvice:
        "顺水推舟锁定周六的具体时间与碰头地点，可以略带幽默地保留“秘密”悬念，既答应邀约又为线下见面预埋互动话题。",
      suggestedReplies: [
        {
          id: "rep-sweet-1",
          type: "顺水推舟（推进）",
          text: "好啊，周六下午两点。你负责挑一个最舒服的窗边位，我负责点单和拍照，成交？",
          rationale: "果断敲定时间并做好分工，展现男生的靠谱与掌控感，自然不拖泥带水。"
        },
        {
          id: "rep-sweet-2",
          type: "幽默推拉（调侃）",
          text: "既然都被发现了，那我周六可得多吃一个肉桂卷，就当是细心侦探的奖励（笑）",
          rationale: "幽默索取情绪奖励，化解过于严肃的气氛，让周六的约定更加轻松愉快。"
        },
        {
          id: "rep-sweet-3",
          type: "制造悬念（留白）",
          text: "周六正好有空。不过那个秘密可不能轻易告诉你，得看你周六肉桂卷挑得合不合我胃口了~",
          rationale: "反客为主，借由“秘密”制造预期落差，让对方更期待周六的见面互动。"
        }
      ]
    },
    messages: [
      {
        id: "msg-sweet-1",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:35",
        content: "这家咖啡馆的焦糖肉桂卷真的封神了！[图片]",
        analysis: {
          emotion: "兴奋 / 分享欲",
          intent: "展示生活美好碎片",
          subtext: "第一时刻想到发给你看，这是典型的高好感度与倾诉欲体现。"
        }
      },
      {
        id: "msg-sweet-2",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:36",
        content: "刚出炉热乎乎的，瞬间治愈了一整天的搬砖怨气",
        analysis: {
          emotion: "放松 / 卸下防备",
          intent: "倾诉日常情绪",
          subtext: "向你坦白工作疲惫与被治愈的心情，展示真实的脆弱与生活状态。"
        }
      },
      {
        id: "msg-sweet-3",
        sender: "我",
        isMe: true,
        timestamp: "昨天 21:40",
        content: "看着太诱人了，是在静安弄堂里的那家？",
        analysis: {
          feedback: "精准接住话题，展现对城市与生活方式的同频理解。",
          subtext: "迅速定位地点，拉近彼此的地理与心理距离。"
        }
      },
      {
        id: "msg-sweet-4",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:42",
        content: "你怎么知道！隐藏得那么深，一般人根本找不到",
        analysis: {
          emotion: "惊喜 / 崇拜",
          intent: "寻求默契印证",
          subtext: "感叹号与疑问句展现出强烈的惊讶与好奇心，情绪完全被调动起来了。"
        }
      },
      {
        id: "msg-sweet-5",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:42",
        content: "而且店里还在放我最喜欢那支独立乐队的黑胶唱片，氛围感拉满了",
        analysis: {
          emotion: "陶醉 / 期待共鸣",
          intent: "延伸私密喜好",
          subtext: "提及小众独立乐队，是深度试探精神品味是否契合的关键暗号。"
        }
      },
      {
        id: "msg-sweet-6",
        sender: "我",
        isMe: true,
        timestamp: "昨天 21:45",
        content: "因为某人之前发歌单动态的时候，我就默默记下了",
        analysis: {
          feedback: "绝杀级回复：专属感拉满，温柔且极具杀伤力。",
          subtext: "正面确认关注细节，将普通聊天迅速升级为暧昧心动瞬间。"
        }
      },
      {
        id: "msg-sweet-7",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:46",
        content: "哇...你居然这么细心的吗 [害羞]",
        analysis: {
          emotion: "害羞 / 心动",
          intent: "情感反馈与接招",
          subtext: "省略号与[害羞]表情是明显的动心与情绪波动，防御力已完全归零。"
        }
      },
      {
        id: "msg-sweet-8",
        sender: "林小鹿",
        isMe: false,
        timestamp: "昨天 21:47",
        content: "那这周六要不要一起去公园？正好听你说说你上次提到的那个秘密",
        analysis: {
          emotion: "主动 / 期待",
          intent: "明确发起线下邀约",
          subtext: "借美食与秘密的名义主动邀约，好感度已达顶峰，就等你敲定细节。"
        }
      }
    ]
  },
  {
    id: "night-chat",
    name: "🌙 深夜失眠与情绪共鸣（深度倾诉）",
    crushName: "小予",
    myName: "我",
    status: "Crush / 暧昧探索中",
    clipboardText: `小予  今天 00:45
忽然失眠了，窗外在下大雨

小予  今天 00:46
感觉全世界好像只剩下我一个人还没睡着

我  今天 00:50
巧了，雨声这么好听，我也在听雨声发呆呢

小予  今天 00:52
哈哈你居然也没睡！今天忙了一整天项目，脑子一直在高速运转停不下来

小予  今天 00:53
听你说这句话，心里突然踏实了好多`,
    analysis: {
      affectionScore: 82,
      affectionStage: "情绪依赖期",
      affectionSummary: "在深夜最脆弱、最感性的时刻主动找你，说明你在对方潜意识中属于带来安全感和情绪治愈的核心存在。",
      myPerformanceScore: 88,
      myPerformanceSummary: "“我也在听雨发呆”给予了极佳的陪伴感，不急于讲大道理，温柔且有边界感。",
      nextStepAdvice: "继续引导倾诉，扮演温暖倾听者，切忌急于输出说教或过早道晚安。",
      suggestedReplies: [
        {
          id: "rep-night-1",
          type: "温暖倾听（推荐）",
          text: "脑子累了就别硬转了。放一首慢歌，把烦心事先寄存到明天，今晚的失眠有我陪你分担一半。",
          rationale: "提供温暖治愈的安全港湾，让对方感受到不被评判的托底感。"
        },
        {
          id: "rep-night-2",
          type: "轻度调侃",
          text: "这么踏实的话，某人是不是该给我付点心理咨询费了？（笑）",
          rationale: "适度幽默打破深夜过度沉重的气氛，增加情趣。"
        }
      ]
    },
    messages: [
      {
        id: "msg-night-1",
        sender: "小予",
        isMe: false,
        timestamp: "今天 00:45",
        content: "忽然失眠了，窗外在下大雨",
        analysis: {
          emotion: "孤单 / 感性",
          intent: "寻求深夜陪伴",
          subtext: "深夜发天气与情绪，是向特定人发送的“正在想你”暗号。"
        }
      },
      {
        id: "msg-night-2",
        sender: "小予",
        isMe: false,
        timestamp: "今天 00:46",
        content: "感觉全世界好像只剩下我一个人还没睡着",
        analysis: {
          emotion: "脆弱 / 渴望共鸣",
          intent: "暴露内心情感",
          subtext: "向你展示孤独感，渴望得到被重视和在乎的回应。"
        }
      },
      {
        id: "msg-night-3",
        sender: "我",
        isMe: true,
        timestamp: "今天 00:50",
        content: "巧了，雨声这么好听，我也在听雨声发呆呢",
        analysis: {
          feedback: "温柔平等的陪伴姿态，不油腻且给足同频感。",
          subtext: "打破对方的孤岛感，营造“两人共享一场雨”的浪漫氛围。"
        }
      },
      {
        id: "msg-night-4",
        sender: "小予",
        isMe: false,
        timestamp: "今天 00:52",
        content: "哈哈你居然也没睡！今天忙了一整天项目，脑子一直在高速运转停不下来",
        analysis: {
          emotion: "宽慰 / 释放",
          intent: "展开心扉诉苦",
          subtext: "得到回应后如释重负，顺畅开启自我暴露与情感交流。"
        }
      },
      {
        id: "msg-night-5",
        sender: "小予",
        isMe: false,
        timestamp: "今天 00:53",
        content: "听你说这句话，心里突然踏实了好多",
        analysis: {
          emotion: "依赖 / 依恋",
          intent: "直球肯定情绪价值",
          subtext: "极高评价：“踏实”是两性关系中深度依恋与信任的核心标志。"
        }
      }
    ]
  }
];

// 默认场景（第一个）
export const DEFAULT_SCENARIO = SCENARIOS[0];
export const SAMPLE_CLIPBOARD_TEXT = DEFAULT_SCENARIO.clipboardText;
export const SAMPLE_ANALYSIS = DEFAULT_SCENARIO.analysis;
export const SAMPLE_MESSAGES = DEFAULT_SCENARIO.messages;
