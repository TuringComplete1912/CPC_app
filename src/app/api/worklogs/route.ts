import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const logs = await prisma.workLog.findMany({
      where: { authorId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json(
      logs.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        createdAt: item.createdAt
      }))
    );
  } catch (error: any) {
    console.error("GET /api/worklogs error", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { title, content } = body || {};

    if (!title || !content) {
      return NextResponse.json({ message: "标题和内容均不能为空" }, { status: 400 });
    }

    const created = await prisma.workLog.create({
      data: {
        title,
        content,
        authorId: session.user.id as string
      }
    });

    return NextResponse.json({
      id: created.id,
      title: created.title,
      content: created.content,
      createdAt: created.createdAt
    });
  } catch (error: any) {
    console.error("POST /api/worklogs error", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

