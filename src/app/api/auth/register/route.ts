import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password, email } = await request.json();

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: "用户名、密码和邮箱为必填项" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
      }
      return NextResponse.json({ error: "邮箱已存在" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default avatar from dicebear
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        avatarUrl,
        status: "正常"
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl
      }
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，服务器内部错误: " + error.message },
      { status: 500 }
    );
  }
}
