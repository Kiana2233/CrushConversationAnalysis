import { NextRequest, NextResponse } from "next/server";
import { simulateReplySandbox, generateSmartSandboxHeuristic } from "@/lib/sandbox-analyzer";
import { Message } from "@/types/chat";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
    const messages: Message[] = Array.isArray(body?.messages) ? body.messages : [];
    const draftReply: string = (body?.draftReply || "").trim();
    const crushName: string = (body?.crushName || "对方").trim();
    const myName: string = (body?.myName || "我").trim();
    const relationshipStatus: string = (body?.relationshipStatus || "Crush / 暧昧中").trim();

    if (!draftReply) {
      return NextResponse.json(
        { error: "请提供打算推演的草稿内容" },
        { status: 400 }
      );
    }

    const analysis = await simulateReplySandbox({
      messages,
      draftReply,
      crushName,
      myName,
      relationshipStatus,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Critical error in /api/sandbox:", error);
    // 即使极端异常，也返回高精度本地兜底分析，确保前端永远流畅可用
    const fallback = generateSmartSandboxHeuristic({
      messages: body?.messages || [],
      draftReply: body?.draftReply || "我不知道",
      crushName: body?.crushName || "对方",
      myName: body?.myName || "我",
    });

    return NextResponse.json({
      success: true,
      isFallback: true,
      analysis: fallback,
    });
  }
}
