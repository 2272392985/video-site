import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET: List all videos for admin dashboard (especially pending ones)
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "未授权，管理员专属接口" }, { status: 401 });
    }

    const videos = await prisma.video.findMany({
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        // Order by "待审核" status first, then by uploadTime desc
        // In prisma, we can order by fields but since SQLite doesn't support custom ENUM ordering natively in Prisma, we can do it by custom logic or simply order by reviewStatus asc (待审核 starts with '待', which sorting-wise is okay, or we just sort in JS or database)
        // Let's sort by uploadTime desc, and we can filter or reorder in the client if needed.
        { uploadTime: "desc" }
      ]
    });

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Fetch admin videos error:", error);
    return NextResponse.json(
      { error: "获取视频审核列表失败: " + error.message },
      { status: 500 }
    );
  }
}
