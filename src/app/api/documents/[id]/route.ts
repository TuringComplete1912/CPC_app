import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取单个文档
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

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        },
        editors: {
          include: {
            user: {
              select: { id: true, username: true, nickname: true }
            }
          },
          orderBy: { editedAt: "desc" }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ message: "文档不存在" }, { status: 404 });
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
      },
      editors: document.editors.map((e) => ({
        id: e.user.id,
        name: e.user.nickname || e.user.username,
        editedAt: e.editedAt
      }))
    });
  } catch (error: any) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 更新文档
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { title, content, status } = await req.json();

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ message: "文档不存在" }, { status: 404 });
    }

    // 已发布的文档不能修改
    if (document.status === "published") {
      return NextResponse.json(
        { message: "已发布的文档不能修改" },
        { status: 403 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && {
          status,
          publishedAt: status === "published" ? new Date() : null
        })
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true }
        }
      }
    });

    // 记录编辑者
    await prisma.documentEditor.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: session.user.id as string
        }
      },
      create: {
        documentId: id,
        userId: session.user.id as string
      },
      update: {
        editedAt: new Date()
      }
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      status: updated.status,
      createdAt: updated.createdAt,
      publishedAt: updated.publishedAt,
      author: {
        id: updated.author.id,
        name: updated.author.nickname || updated.author.username
      }
    });
  } catch (error: any) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { message: error.message || "更新失败" },
      { status: 500 }
    );
  }
}

// 删除文档
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

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ message: "文档不存在" }, { status: 404 });
    }

    // 获取当前用户
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 只有作者或管理员可以删除
    const isAuthor = document.authorId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此文档" },
        { status: 403 }
      );
    }

    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
