import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// POST: Toggle user status (Enable or Disable)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "无效的用户 ID" }, { status: 400 });
    }

    const session = await getAuthSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "未授权，管理员专属接口" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || (status !== "正常" && status !== "禁用")) {
      return NextResponse.json(
        { error: "账号状态只能是 '正常' 或 '禁用'" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `用户账号状态已更新为: ${status}`
    });

  } catch (error: any) {
    console.error("Toggle user status error:", error);
    return NextResponse.json(
      { error: "操作失败: " + error.message },
      { status: 500 }
    );
  }
}
