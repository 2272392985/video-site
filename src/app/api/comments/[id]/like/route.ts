import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "无效的评论 ID" }, { status: 400 });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (session.isAdmin) {
      return NextResponse.json({ error: "管理员不能点赞评论" }, { status: 403 });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.id,
        likeType: "评论",
        commentId: commentId
      }
    });

    let liked = false;
    let newLikeCount = comment.likeCount;

    if (existingLike) {
      // Unlike: Delete Like record and decrement likeCount
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            likeCount: {
              decrement: 1
            }
          }
        })
      ]);
      liked = false;
      newLikeCount = Math.max(0, comment.likeCount - 1);
    } else {
      // Like: Create Like record and increment likeCount
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: session.id,
            likeType: "评论",
            commentId: commentId
          }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            likeCount: {
              increment: 1
            }
          }
        })
      ]);
      liked = true;
      newLikeCount = comment.likeCount + 1;
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount: newLikeCount
    });

  } catch (error: any) {
    console.error("Toggle comment like error:", error);
    return NextResponse.json(
      { error: "操作失败: " + error.message },
      { status: 500 }
    );
  }
}
