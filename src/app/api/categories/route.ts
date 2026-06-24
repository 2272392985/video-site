import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET: Fetch all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" }
    });
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { error: "获取分类列表失败: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new category (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "未授权，管理员专属接口" }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    // Check if category name exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: "分类名称已存在" }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description || "",
        creatorId: session.id
      }
    });

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: "分类创建成功"
    });

  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "创建分类失败: " + error.message },
      { status: 500 }
    );
  }
}
