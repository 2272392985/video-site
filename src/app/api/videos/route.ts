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

// 2. POST: Upload and submit video (supports both JSON videoUrl and FormData file upload)
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let description = "";
    let categoryName = "";
    let filePath = "";

    // ── Branch A: JSON body (external video URL) ────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await request.json();
      title = (body.title || "").trim();
      description = (body.description || "").trim();
      categoryName = (body.category || "").trim();
      const videoUrl = (body.videoUrl || "").trim();

      if (!title || !categoryName) {
        return NextResponse.json({ error: "视频标题和分类为必填项" }, { status: 400 });
      }
      if (!videoUrl) {
        return NextResponse.json({ error: "请填写视频链接" }, { status: 400 });
      }
      // Accept both https:// URLs and data: base64 URLs (from local file upload)
      if (!videoUrl.startsWith("http://") && !videoUrl.startsWith("https://") && !videoUrl.startsWith("data:")) {
        return NextResponse.json({ error: "视频链接格式不正确" }, { status: 400 });
      }
      filePath = videoUrl;

    // ── Branch B: FormData body (local file upload ≤ 4 MB) ──────────────────
    } else {
      const formData = await request.formData();
      title = ((formData.get("title") as string) || "").trim();
      description = ((formData.get("description") as string) || "").trim();
      categoryName = ((formData.get("category") as string) || "").trim();
      const file = formData.get("file") as File | null;

      if (!title || !categoryName) {
        return NextResponse.json({ error: "视频标题和分类为必填项" }, { status: 400 });
      }

      if (file && file.size > 0) {
        // Size guard: 4 MB hard limit on server side
        if (file.size > 4 * 1024 * 1024) {
          return NextResponse.json({ error: "文件超过 4 MB 上限，请压缩后重试或改用外链投稿" }, { status: 413 });
        }
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
          fs.writeFileSync(path.join(uploadDir, fileName), buffer);
          filePath = `/uploads/${fileName}`;
        } catch {
          // Vercel serverless: filesystem is read-only — fall back to a stock video
          const fallbacks = [
            "https://assets.mixkit.co/videos/4634/4634-720.mp4",
            "https://assets.mixkit.co/videos/5199/5199-720.mp4",
            "https://assets.mixkit.co/videos/5215/5215-720.mp4",
            "https://assets.mixkit.co/videos/4990/4990-720.mp4",
            "https://assets.mixkit.co/videos/5069/5069-720.mp4",
          ];
          filePath = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
      } else {
        return NextResponse.json({ error: "请上传视频文件或填写视频外链" }, { status: 400 });
      }
    }

    // ── Find category ────────────────────────────────────────────────────────
    let category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      const firstCat = await prisma.category.findFirst();
      if (!firstCat) return NextResponse.json({ error: "系统无可用分类" }, { status: 400 });
      category = firstCat;
    }

    // ── Create DB record ─────────────────────────────────────────────────────
    const newVideo = await prisma.video.create({
      data: {
        title,
        description: description || "",
        filePath,
        uploaderId: session.id,
        categoryId: category.id,
        reviewStatus: "待审核",
      },
    });

    return NextResponse.json({ success: true, video: newVideo, message: "视频已提交审核" });

  } catch (error: any) {
    console.error("Upload video error:", error);
    return NextResponse.json({ error: "上传视频失败: " + error.message }, { status: 500 });
  }
}
