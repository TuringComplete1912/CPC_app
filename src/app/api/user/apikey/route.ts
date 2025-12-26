import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取API key状态（不返回完整key）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { apiKey: true, useOwnApiKey: true }
    });

    if (!user) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      hasApiKey: !!user.apiKey && user.apiKey.length > 0,
      useOwnApiKey: user.useOwnApiKey || false,
      preview: user.apiKey ? `${user.apiKey.substring(0, 8)}...` : ""
    });
  } catch (error: any) {
    console.error("Get API key error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 更新API key
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { apiKey, useOwnApiKey } = await req.json();

    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { 
        apiKey: apiKey || "",
        useOwnApiKey: useOwnApiKey !== undefined ? useOwnApiKey : true
      }
    });

    return NextResponse.json({ 
      message: "API Key 已保存",
      hasApiKey: !!apiKey && apiKey.length > 0
    });
  } catch (error: any) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { message: error.message || "保存失败" },
      { status: 500 }
    );
  }
}

// 更新使用偏好
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { useOwnApiKey } = await req.json();

    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { useOwnApiKey }
    });

    return NextResponse.json({ message: "设置已更新" });
  } catch (error: any) {
    console.error("Update API key preference error:", error);
    return NextResponse.json(
      { message: error.message || "更新失败" },
      { status: 500 }
    );
  }
}
