import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "用户名和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "密码长度至少为6位" }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json({ message: "用户名已存在" }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（默认 role 为 "member"）
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "member",
        nickname: username, // 默认昵称为用户名
        department: "", // 默认为空
        avatar: "" // 默认为空
      }
    });

    return NextResponse.json({
      message: "注册成功",
      userId: user.id
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: error.message || "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}

