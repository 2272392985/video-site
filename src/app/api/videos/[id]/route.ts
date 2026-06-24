import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise!
) {
  try {
    const { id } = await context.params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json({ error: "无效的视频 ID" }, { status: 400 });
    }

    const session = await getAuthSession();

    // 1. Fetch the video details first
    const originalVideo = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!originalVideo) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // 2. Security validation: if video is not approved, only the uploader or admin can view it
    if (originalVideo.reviewStatus !== "通过") {
      if (!session) {
        return NextResponse.json({ error: "未授权查看此视频" }, { status: 401 });
      }
      if (!session.isAdmin && originalVideo.uploaderId !== session.id) {
        return NextResponse.json({ error: "视频正在审核中或已被驳回" }, { status: 403 });
      }
    }

    // 3. Increment play count in database
    const video = await prisma.video.update({
      where: { id: videoId },
      data: {
        playCount: {
          increment: 1
        }
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 4. Record play record if user is logged in
    if (session && !session.isAdmin) {
      try {
        await prisma.playRecord.create({
          data: {
            startTime: new Date(),
            progress: 0,
            deviceType: "PC",
            ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
            userId: session.id,
            videoId: videoId
          }
        });
      } catch (err) {
        console.error("Failed to create play record:", err);
      }
    }

    // 5. Get user interaction state (liked, favorited)
    let isLiked = false;
    let isFavorited = false;

    if (session && !session.isAdmin) {
      const like = await prisma.like.findFirst({
        where: {
          userId: session.id,
          likeType: "视频",
          videoId: videoId
        }
      });
      isLiked = !!like;

      const fav = await prisma.favorite.findFirst({
        where: {
          userId: session.id,
          videoId: videoId
        }
      });
      isFavorited = !!fav;
    }

    // 6. Get counts
    const favoriteCount = await prisma.favorite.count({
      where: { videoId }
    });

    return NextResponse.json({
      success: true,
      video,
      isLiked,
      isFavorited,
      favoriteCount
    });
  } catch (error: any) {
    console.error("Get video detail error:", error);
    return NextResponse.json(
      { error: "获取视频详情失败: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // Only uploader or admin can delete
    if (!session.isAdmin && video.uploaderId !== session.id) {
      return NextResponse.json({ error: "无权删除此视频" }, { status: 403 });
    }

    await prisma.video.delete({
      where: { id: videoId }
    });

    return NextResponse.json({ success: true, message: "视频删除成功" });
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: "删除视频失败: " + error.message },
      { status: 500 }
    );
  }
}
