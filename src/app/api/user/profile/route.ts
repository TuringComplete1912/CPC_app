import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取用户资料
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: {
        id: true,
        username: true,
        nickname: true,
        department: true,
        avatar: true,
        bio: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 更新用户资料
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { nickname, department, bio, phone, email } = await req.json();

    const updated = await prisma.user.update({
      where: { id: session.user.id as string },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(department !== undefined && { department }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email })
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        department: true,
        avatar: true,
        bio: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: error.message || "更新失败" },
      { status: 500 }
    );
  }
}
