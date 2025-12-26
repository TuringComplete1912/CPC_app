import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取单个话题及其回答
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id } = params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        },
        answers: {
          include: {
            author: {
              select: { id: true, username: true, nickname: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!topic) {
      return NextResponse.json({ message: "话题不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      createdAt: topic.createdAt,
      author: {
        id: topic.author.id,
        name: topic.author.nickname || topic.author.username
      },
      answers: topic.answers.map((answer) => ({
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
        author: {
          id: answer.author.id,
          name: answer.author.nickname || answer.author.username
        }
      }))
    });
  } catch (error: any) {
    console.error("Get topic error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 删除话题
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id } = params;

    const topic = await prisma.topic.findUnique({
      where: { id }
    });

    if (!topic) {
      return NextResponse.json({ message: "话题不存在" }, { status: 404 });
    }

    // 获取当前用户
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 只有作者或管理员可以删除
    const isAuthor = topic.authorId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此话题" },
        { status: 403 }
      );
    }

    await prisma.topic.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete topic error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
