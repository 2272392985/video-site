import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// 1. GET: Fetch video comments list
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json({ error: "无效的视频 ID" }, { status: 400 });
    }

    // Fetch top-level comments (parentId: null) and their replies
    const comments = await prisma.comment.findMany({
      where: {
        videoId,
        parentId: null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            publishTime: "asc"
          }
        }
      },
      orderBy: {
        publishTime: "desc"
      }
    });

    // Check if the current user liked these comments (optional detail enhancement)
    const session = await getAuthSession();
    let likedCommentIds: number[] = [];
    if (session && !session.isAdmin) {
      const commentLikes = await prisma.like.findMany({
        where: {
          userId: session.id,
          likeType: "评论",
          comment: { videoId }
        },
        select: { commentId: true }
      });
      likedCommentIds = commentLikes
        .map((l) => l.commentId)
        .filter((cid): cid is number => cid !== null);
    }

    return NextResponse.json({
      success: true,
      comments,
      likedCommentIds
    });

  } catch (error: any) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "获取评论失败: " + error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Create a comment (or a reply to a comment)
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
      return NextResponse.json({ error: "管理员不能发表评论" }, { status: 403 });
    }

    const { content, parentId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // If parentId is specified, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId) }
      });
      if (!parentComment) {
        return NextResponse.json({ error: "回复的父评论不存在" }, { status: 404 });
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.id,
        videoId: videoId,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: "评论成功"
    });

  } catch (error: any) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "发表评论失败: " + error.message },
      { status: 500 }
    );
  }
}
