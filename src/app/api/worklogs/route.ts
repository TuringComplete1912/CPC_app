import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取所有活动日志
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const logs = await prisma.workLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        },
        editors: {
          include: {
            user: {
              select: { id: true, username: true, nickname: true }
            }
          }
        }
      }
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        title: log.title,
        content: log.content,
        status: log.status,
        createdAt: log.createdAt,
        publishedAt: log.publishedAt,
        author: {
          id: log.author.id,
          name: log.author.nickname || log.author.username
        },
        editors: log.editors.map((e) => ({
          id: e.user.id,
          name: e.user.nickname || e.user.username,
          editedAt: e.editedAt
        }))
      }))
    );
  } catch (error: any) {
    console.error("GET /api/worklogs error", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

// 创建新活动日志
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { title, content, status } = body || {};

    if (!title?.trim()) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }

    const created = await prisma.workLog.create({
      data: {
        title: title.trim(),
        content: content || "",
        status: status || "draft",
        authorId: session.user.id as string,
        publishedAt: status === "published" ? new Date() : null
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      }
    });

    // 如果是草稿，添加作者为编辑者
    if (status === "draft") {
      await prisma.workLogEditor.create({
        data: {
          workLogId: created.id,
          userId: session.user.id as string
        }
      });
    }

    return NextResponse.json({
      id: created.id,
      title: created.title,
      content: created.content,
      status: created.status,
      createdAt: created.createdAt,
      publishedAt: created.publishedAt,
      author: {
        id: created.author.id,
        name: created.author.nickname || created.author.username
      }
    });
  } catch (error: any) {
    console.error("POST /api/worklogs error", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}


