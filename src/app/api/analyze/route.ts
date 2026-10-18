import { NextRequest, NextResponse } from "next/server";
import { analyzeChatHistory, generateSmartHeuristicAnalysis } from "@/lib/ai-analyzer";
import { Message } from "@/types/chat";

export async function POST(req: NextRequest) {
  let messages: Message[] = [];
  try {
    const body = await req.json();
    messages = body?.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "消息记录不能为空" },
        { status: 400 }
      );
    }

    const result = await analyzeChatHistory(messages);

    return NextResponse.json({
      success: true,
      isFallback: result.isFallback,
      source: result.source,
      reason: result.reason,
      overallAnalysis: result.overallAnalysis,
      messages,
    });
  } catch (error: any) {
    console.error("Critical error in /api/analyze:", error);
    // 即使发生未知严重异常，也立即执行本地启发式分析兜底，确保前端永远不会卡死
    const fallbackOverall = generateSmartHeuristicAnalysis(messages);
    return NextResponse.json({
      success: true,
      isFallback: true,
      source: "heuristic",
      reason: "服务异常，已启用内置高精度本地引擎兜底",
      overallAnalysis: fallbackOverall,
      messages,
    });
  }
}
