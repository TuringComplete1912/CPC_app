import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取回答的所有回复
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: answerId } = params;

    const replies = await prisma.reply.findMany({
      where: { answerId },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(
      replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: {
          id: reply.author.id,
          name: reply.author.nickname || reply.author.username
        }
      }))
    );
  } catch (error: any) {
    console.error("Get replies error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 创建回复
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: answerId } = params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ message: "回复内容不能为空" }, { status: 400 });
    }

    // 检查回答是否存在
    const answer = await prisma.answer.findUnique({
      where: { id: answerId }
    });

    if (!answer) {
      return NextResponse.json({ message: "回答不存在" }, { status: 404 });
    }

    const reply = await prisma.reply.create({
      data: {
        content: content.trim(),
        answerId,
        authorId: session.user.id as string
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      }
    });

    return NextResponse.json({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: {
        id: reply.author.id,
        name: reply.author.nickname || reply.author.username
      }
    });
  } catch (error: any) {
    console.error("Create reply error:", error);
    return NextResponse.json(
      { message: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
