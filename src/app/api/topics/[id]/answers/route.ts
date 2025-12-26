import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 创建回答
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: topicId } = params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ message: "回答内容不能为空" }, { status: 400 });
    }

    // 检查话题是否存在
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return NextResponse.json({ message: "话题不存在" }, { status: 404 });
    }

    const answer = await prisma.answer.create({
      data: {
        content: content.trim(),
        topicId,
        authorId: session.user.id as string
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      }
    });

    return NextResponse.json({
      id: answer.id,
      content: answer.content,
      createdAt: answer.createdAt,
      author: {
        id: answer.author.id,
        name: answer.author.nickname || answer.author.username
      }
    });
  } catch (error: any) {
    console.error("Create answer error:", error);
    return NextResponse.json(
      { message: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
