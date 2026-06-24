import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json({ error: "无效的视频 ID" }, { status: 400 });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (session.isAdmin) {
      return NextResponse.json({ error: "管理员不能收藏视频" }, { status: 403 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // Check if already favorited
    const existingFav = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId: session.id,
          videoId: videoId
        }
      }
    });

    let favorited = false;

    if (existingFav) {
      // Unfavorite
      await prisma.favorite.delete({
        where: { id: existingFav.id }
      });
      favorited = false;
    } else {
      // Favorite
      await prisma.favorite.create({
        data: {
          userId: session.id,
          videoId: videoId
        }
      });
      favorited = true;
    }

    // Get current total favorites count
    const favoriteCount = await prisma.favorite.count({
      where: { videoId }
    });

    return NextResponse.json({
      success: true,
      favorited,
      favoriteCount
    });

  } catch (error: any) {
    console.error("Toggle video favorite error:", error);
    return NextResponse.json(
      { error: "操作失败: " + error.message },
      { status: 500 }
    );
  }
}
