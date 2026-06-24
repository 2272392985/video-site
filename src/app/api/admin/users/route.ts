import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET: List all users for admin dashboard
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "未授权，管理员专属接口" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        regTime: true,
        status: true,
        adminId: true
      },
      orderBy: { regTime: "desc" }
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json(
      { error: "获取用户列表失败: " + error.message },
      { status: 500 }
    );
  }
}
