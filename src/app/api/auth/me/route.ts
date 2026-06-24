import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    if (session.isAdmin) {
      // Find in Admin table
      const dbAdmin = await prisma.admin.findUnique({
        where: { id: session.id }
      });

      if (!dbAdmin || dbAdmin.status === "停用") {
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({
        user: {
          id: dbAdmin.id,
          username: dbAdmin.account,
          fullName: dbAdmin.fullName,
          email: `${dbAdmin.account}@admin.com`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbAdmin.account}`,
          role: dbAdmin.role,
          isAdmin: true
        }
      });
    } else {
      // Find in User table
      const dbUser = await prisma.user.findUnique({
        where: { id: session.id }
      });

      if (!dbUser || dbUser.status === "禁用") {
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
          regTime: dbUser.regTime,
          status: dbUser.status,
          role: "user",
          isAdmin: false
        }
      });
    }
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null });
  }
}
