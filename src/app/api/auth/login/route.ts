import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { account, password } = await request.json();

    if (!account || !password) {
      return NextResponse.json(
        { error: "用户名/邮箱/账号 和密码为必填项" },
        { status: 400 }
      );
    }

    // 1. Try to find in User table
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: account },
          { email: account }
        ]
      }
    });

    if (dbUser) {
      // Validate user password
      const isPasswordValid = await bcrypt.compare(password, dbUser.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      if (dbUser.status === "禁用") {
        return NextResponse.json({ error: "您的账号已被禁用，请联系管理员" }, { status: 403 });
      }

      // Generate token
      const token = signToken({
        id: dbUser.id,
        username: dbUser.username,
        role: "user",
        isAdmin: false
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
          role: "user",
          isAdmin: false
        }
      });

      // Set cookie
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600 * 24 * 7 // 7 days
      });

      return response;
    }

    // 2. Try to find in Admin table (Unified Login)
    let dbAdmin = await prisma.admin.findFirst({
      where: {
        account: account
      }
    });

    if (dbAdmin) {
      // Validate admin password
      const isPasswordValid = await bcrypt.compare(password, dbAdmin.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      if (dbAdmin.status === "停用") {
        return NextResponse.json({ error: "该管理员账号已停用" }, { status: 403 });
      }

      // Generate token
      const token = signToken({
        id: dbAdmin.id,
        username: dbAdmin.account,
        role: dbAdmin.role, // "超级" / "审核" / "普通"
        isAdmin: true
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: dbAdmin.id,
          username: dbAdmin.account,
          email: `${dbAdmin.account}@admin.com`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbAdmin.account}`,
          role: dbAdmin.role,
          isAdmin: true
        }
      });

      // Set cookie
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600 * 24 * 7 // 7 days
      });

      return response;
    }

    // Account not found in both tables
    return NextResponse.json({ error: "账号不存在" }, { status: 400 });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，服务器内部错误: " + error.message },
      { status: 500 }
    );
  }
}
