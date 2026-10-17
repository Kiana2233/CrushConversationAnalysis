import { NextRequest, NextResponse } from "next/server";
import { getSessionById, deleteSession, renameSession } from "@/lib/db";

// 获取单个会话详情
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionById(id);

    if (!session) {
      return NextResponse.json(
        { error: "未找到该会话" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: error?.message || "获取会话失败" },
      { status: 500 }
    );
  }
}

// 删除单个会话
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: error?.message || "删除会话失败" },
      { status: 500 }
    );
  }
}

// 重命名或更新标题
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "会话标题不能为空" },
        { status: 400 }
      );
    }

    renameSession(id, title.trim());
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to rename session:", error);
    return NextResponse.json(
      { error: error?.message || "修改会话标题失败" },
      { status: 500 }
    );
  }
}
