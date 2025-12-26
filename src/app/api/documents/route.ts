import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取所有文档
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const documents = await prisma.document.findMany({
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
      documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        status: doc.status,
        createdAt: doc.createdAt,
        publishedAt: doc.publishedAt,
        author: {
          id: doc.author.id,
          name: doc.author.nickname || doc.author.username
        },
        editors: doc.editors.map((e) => ({
          id: e.user.id,
          name: e.user.nickname || e.user.username,
          editedAt: e.editedAt
        }))
      }))
    );
  } catch (error: any) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 创建新文档
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { title, content, status } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }

    const document = await prisma.document.create({
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
      await prisma.documentEditor.create({
        data: {
          documentId: document.id,
          userId: session.user.id as string
        }
      });
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      content: document.content,
      status: document.status,
      createdAt: document.createdAt,
      publishedAt: document.publishedAt,
      author: {
        id: document.author.id,
        name: document.author.nickname || document.author.username
      }
    });
  } catch (error: any) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { message: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
