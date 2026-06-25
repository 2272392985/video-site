import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET /api/follow?targetId=xxx — check if current user follows target
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);
  const targetId = parseInt(searchParams.get("targetId") || "");

  if (!targetId || isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "缺少目标用户ID" }, { status: 400 });
  }

  // Get follower count for the target user
  const followerCount = await prisma.follow.count({ where: { followedId: targetId } });

  if (!session || session.isAdmin) {
    return NextResponse.json({ success: true, isFollowing: false, followerCount });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId: session.id, followedId: targetId } },
  });

  return NextResponse.json({ success: true, isFollowing: !!existing, followerCount });
}

// POST /api/follow — toggle follow/unfollow
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.isAdmin) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const targetId = parseInt(body.targetId);

  if (!targetId || isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "缺少目标用户ID" }, { status: 400 });
  }

  if (session.id === targetId) {
    return NextResponse.json({ success: false, error: "不能关注自己" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId: session.id, followedId: targetId } },
  });

  let isFollowing: boolean;

  if (existing) {
    // Unfollow
    await prisma.follow.delete({
      where: { followerId_followedId: { followerId: session.id, followedId: targetId } },
    });
    isFollowing = false;
  } else {
    // Follow
    await prisma.follow.create({
      data: { followerId: session.id, followedId: targetId },
    });
    isFollowing = true;
  }

  const followerCount = await prisma.follow.count({ where: { followedId: targetId } });

  return NextResponse.json({ success: true, isFollowing, followerCount });
}
