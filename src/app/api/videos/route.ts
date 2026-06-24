import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

// 1. GET: Fetch videos with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get("category");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // "通过" / "待审核" / "驳回"
    const uploaderId = searchParams.get("uploaderId");
    
    const session = await getAuthSession();

    // Build query conditions
    const where: any = {};

    // Filter by category name
    if (categoryName && categoryName !== "全部" && categoryName !== "undefined") {
      where.category = {
        name: categoryName
      };
    }

    // Filter by search query (title or description)
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Filter by uploader
    if (uploaderId) {
      where.uploaderId = parseInt(uploaderId);
    }

    // Review status logic
    if (status) {
      // Explicit status requested
      if (status === "待审核" || status === "驳回") {
        // Only allow admin or the uploader themselves to see pending/rejected videos
        if (!session) {
          return NextResponse.json({ error: "未授权" }, { status: 401 });
        }
        if (!session.isAdmin && uploaderId && parseInt(uploaderId) !== session.id) {
          return NextResponse.json({ error: "无权访问此内容" }, { status: 403 });
        }
      }
      where.reviewStatus = status;
    } else {
      // No explicit status requested:
      // Standard behavior: only return "通过" (approved) videos
      // Exception: if uploaderId is specified, and it's the logged-in user, they can see all their videos
      if (uploaderId && session && parseInt(uploaderId) === session.id) {
        // Do not filter by reviewStatus to let the user see their own uploads
      } else {
        where.reviewStatus = "通过";
      }
    }

    // Fetch videos ordered by uploadTime desc
    const videos = await prisma.video.findMany({
      where,
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
      },
      orderBy: {
        uploadTime: "desc"
      }
    });

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Fetch videos error:", error);
    return NextResponse.json(
      { error: "获取视频失败: " + error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Upload and submit video
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryName = formData.get("category") as string;
    const file = formData.get("file") as File;

    if (!title || !categoryName) {
      return NextResponse.json({ error: "视频标题和分类为必填项" }, { status: 400 });
    }

    // Find category
    let category = await prisma.category.findUnique({
      where: { name: categoryName }
    });

    // If category not found, use the first category or throw error
    if (!category) {
      const firstCat = await prisma.category.findFirst();
      if (!firstCat) {
        return NextResponse.json({ error: "系统无可用分类" }, { status: 400 });
      }
      category = firstCat;
    }

    let filePath = "";

    // Handle file upload
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload dir exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const fullPath = path.join(uploadDir, fileName);
        
        fs.writeFileSync(fullPath, buffer);
        filePath = `/uploads/${fileName}`;
        console.log("File saved locally to", fullPath);
      } catch (err: any) {
        console.error("Local file save failed, falling back to stock video. Error:", err.message);
        // Fallback to stock video URL for Vercel Serverless
        const fallbackStockVideos = [
          "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-curious-cat-watching-tv-42526-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-keyboard-of-a-lap-top-computer-42527-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-42528-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-gaming-setup-neon-lights-42531-large.mp4"
        ];
        filePath = fallbackStockVideos[Math.floor(Math.random() * fallbackStockVideos.length)];
      }
    } else {
      // No file uploaded: Use a fallback video
      filePath = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4";
    }

    // Create video record in DB
    const newVideo = await prisma.video.create({
      data: {
        title,
        description: description || "",
        filePath,
        uploaderId: session.id,
        categoryId: category.id,
        reviewStatus: "待审核" // Default review status
      }
    });

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: "上传成功，视频已提交审核"
    });

  } catch (error: any) {
    console.error("Upload video error:", error);
    return NextResponse.json(
      { error: "上传视频失败: " + error.message },
      { status: 500 }
    );
  }
}
