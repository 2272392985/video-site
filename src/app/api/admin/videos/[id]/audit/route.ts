import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// POST: Audit a video (Pass or Reject)
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
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "未授权，管理员专属接口" }, { status: 401 });
    }

    const { status, opinion } = await request.json();

    if (!status || (status !== "通过" && status !== "驳回")) {
      return NextResponse.json(
        { error: "审核状态只能是 '通过' 或 '驳回'" },
        { status: 400 }
      );
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    }

    // Perform audit update
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        reviewStatus: status,
        reviewerId: session.id,
        reviewTime: new Date(),
        reviewOpinion: opinion || null
      }
    });

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: `视频审核已完成，状态更新为: ${status}`
    });

  } catch (error: any) {
    console.error("Audit video error:", error);
    return NextResponse.json(
      { error: "审核操作失败: " + error.message },
      { status: 500 }
    );
  }
}
