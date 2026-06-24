import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "视界 - 探索海量精彩视频",
  description: "视界是一个全功能视频分享平台，提供旅行、电影解说、科技数码、游戏实况、治愈音乐等多品类精彩视频，支持在线点赞、收藏与评论，让您与世界连接。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
