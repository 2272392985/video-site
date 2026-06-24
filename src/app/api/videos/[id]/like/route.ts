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
      return NextResponse.json({ error: "管理员不能点赞视频" }, { status: 403 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.id,
        likeType: "视频",
        videoId: videoId
      }
    });

    let liked = false;
    let newLikeCount = video.likeCount;

    if (existingLike) {
      // Unlike: Delete Like record and decrement likeCount
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.video.update({
          where: { id: videoId },
          data: {
            likeCount: {
              decrement: 1
            }
          }
        })
      ]);
      liked = false;
      newLikeCount = Math.max(0, video.likeCount - 1);
    } else {
      // Like: Create Like record and increment likeCount
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: session.id,
            likeType: "视频",
            videoId: videoId
          }
        }),
        prisma.video.update({
          where: { id: videoId },
          data: {
            likeCount: {
              increment: 1
            }
          }
        })
      ]);
      liked = true;
      newLikeCount = video.likeCount + 1;
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount: newLikeCount
    });

  } catch (error: any) {
    console.error("Toggle video like error:", error);
    return NextResponse.json(
      { error: "操作失败: " + error.message },
      { status: 500 }
    );
  }
}
