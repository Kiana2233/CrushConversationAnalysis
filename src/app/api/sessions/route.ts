import { NextRequest, NextResponse } from "next/server";
import { listSessionSummaries, saveSession } from "@/lib/db";
import { ChatSession } from "@/types/chat";

// 获取所有历史会话列表
export async function GET() {
  try {
    const sessions = listSessionSummaries();
    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: error?.message || "获取会话列表失败" },
      { status: 500 }
    );
  }
}

// 创建或全量保存会话
export async function POST(req: NextRequest) {
  try {
    const sessionData: ChatSession = await req.json();

    if (!sessionData.id) {
      return NextResponse.json(
        { error: "会话 ID 不能为空" },
        { status: 400 }
      );
    }

    saveSession(sessionData);

    return NextResponse.json({
      success: true,
      session: sessionData,
    });
  } catch (error: any) {
    console.error("Failed to save session:", error);
    return NextResponse.json(
      { error: error?.message || "保存会话失败" },
      { status: 500 }
    );
  }
}
