import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取所有话题
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const topics = await prisma.topic.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        },
        _count: {
          select: { answers: true }
        }
      }
    });

    return NextResponse.json(
      topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        createdAt: topic.createdAt,
        author: {
          id: topic.author.id,
          name: topic.author.nickname || topic.author.username
        },
        answerCount: topic._count.answers
      }))
    );
  } catch (error: any) {
    console.error("Get topics error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 创建新话题
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }

    const userId = session.user.id as string;

    // 先检查用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return NextResponse.json({ message: "用户不存在，请重新登录" }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        authorId: userId
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      }
    });

    return NextResponse.json({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      createdAt: topic.createdAt,
      author: {
        id: topic.author.id,
        name: topic.author.nickname || topic.author.username
      },
      answerCount: 0
    });
  } catch (error: any) {
    console.error("Create topic error:", error);
    return NextResponse.json(
      { message: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
