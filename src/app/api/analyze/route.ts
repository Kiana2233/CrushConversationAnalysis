import { NextRequest, NextResponse } from "next/server";
import { analyzeChatHistory } from "@/lib/ai-analyzer";
import { Message, ModelConfig } from "@/types/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages }: { messages: Message[] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "消息记录不能为空" },
        { status: 400 }
      );
    }

    const overallAnalysis = await analyzeChatHistory(messages);

    return NextResponse.json({
      success: true,
      overallAnalysis,
      messages,
    });
  } catch (error: any) {
    console.error("API error in /api/analyze:", error);
    return NextResponse.json(
      { error: error?.message || "分析处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
