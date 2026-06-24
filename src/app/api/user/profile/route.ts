import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

// GET: Fetch user dashboard info (user profile + lists)
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (session.isAdmin) {
      return NextResponse.json({ error: "管理员无此类型个人主页" }, { status: 400 });
    }

    // 1. Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        regTime: true,
        status: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 2. Fetch my videos
    const myVideos = await prisma.video.findMany({
      where: { uploaderId: session.id },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { uploadTime: "desc" }
    });

    // 3. Fetch my favorites
    const myFavorites = await prisma.favorite.findMany({
      where: { userId: session.id },
      include: {
        video: {
          include: {
            uploader: { select: { username: true } },
            category: { select: { name: true } }
          }
        }
      },
      orderBy: { favTime: "desc" }
    });

    // 4. Fetch my comments
    const myComments = await prisma.comment.findMany({
      where: { userId: session.id },
      include: {
        video: {
          select: { id: true, title: true }
        }
      },
      orderBy: { publishTime: "desc" }
    });

    return NextResponse.json({
      success: true,
      profile: user,
      videos: myVideos,
      favorites: myFavorites.map((f) => f.video).filter(Boolean),
      comments: myComments
    });

  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "获取个人资料失败: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Update user profile
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (session.isAdmin) {
      return NextResponse.json({ error: "管理员无法使用此接口修改" }, { status: 400 });
    }

    const { username, email, avatarUrl, currentPassword, newPassword } = await request.json();

    // Find current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const updateData: any = {};

    if (username && username !== currentUser.username) {
      // Check username unique
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) {
        return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
      }
      updateData.username = username;
    }

    if (email && email !== currentUser.email) {
      // Check email unique
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return NextResponse.json({ error: "邮箱已存在" }, { status: 400 });
      }
      updateData.email = email;
    }

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    // Password change logic
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "修改密码需要提供当前密码" }, { status: 400 });
      }
      
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Perform update
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        regTime: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: "个人资料更新成功"
    });

  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "更新资料失败: " + error.message },
      { status: 500 }
    );
  }
}
