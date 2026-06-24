import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Fetch recommendations with associated videos for home page display
export async function GET() {
  try {
    const recommendations = await prisma.recommendation.findMany({
      where: { status: "启用" },
      include: {
        videos: {
          include: {
            video: {
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
            }
          },
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    // Structure list into object keyed by position name for easy frontend access
    const result: Record<string, any> = {};
    for (const rec of recommendations) {
      // Map database relations to clean video items
      const videos = rec.videos
        .map((rel: any) => rel.video)
        .filter((v: any) => v && v.reviewStatus === "通过"); // Only display approved videos
      
      result[rec.position] = {
        id: rec.id,
        name: rec.name,
        description: rec.description,
        videos
      };
    }

    return NextResponse.json({ success: true, recommendations: result });
  } catch (error: any) {
    console.error("Fetch recommendations error:", error);
    return NextResponse.json(
      { error: "获取推荐内容失败: " + error.message },
      { status: 500 }
    );
  }
}
