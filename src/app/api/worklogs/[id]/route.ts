import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取单个活动日志
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

    const workLog = await prisma.workLog.findUnique({
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

    if (!workLog) {
      return NextResponse.json({ message: "活动日志不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: workLog.id,
      title: workLog.title,
      content: workLog.content,
      status: workLog.status,
      createdAt: workLog.createdAt,
      publishedAt: workLog.publishedAt,
      author: {
        id: workLog.author.id,
        name: workLog.author.nickname || workLog.author.username
      },
      editors: workLog.editors.map((e) => ({
        id: e.user.id,
        name: e.user.nickname || e.user.username,
        editedAt: e.editedAt
      }))
    });
  } catch (error: any) {
    console.error("Get worklog error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 更新活动日志
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

    const workLog = await prisma.workLog.findUnique({
      where: { id }
    });

    if (!workLog) {
      return NextResponse.json({ message: "活动日志不存在" }, { status: 404 });
    }

    // 已发布的日志不能修改
    if (workLog.status === "published") {
      return NextResponse.json(
        { message: "已发布的活动日志不能修改" },
        { status: 403 }
      );
    }

    const updated = await prisma.workLog.update({
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
    await prisma.workLogEditor.upsert({
      where: {
        workLogId_userId: {
          workLogId: id,
          userId: session.user.id as string
        }
      },
      create: {
        workLogId: id,
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
    console.error("Update worklog error:", error);
    return NextResponse.json(
      { message: error.message || "更新失败" },
      { status: 500 }
    );
  }
}

// 删除活动日志
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

    const workLog = await prisma.workLog.findUnique({
      where: { id }
    });

    if (!workLog) {
      return NextResponse.json({ message: "活动日志不存在" }, { status: 404 });
    }

    // 获取当前用户
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 只有作者或管理员可以删除
    const isAuthor = workLog.authorId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此活动日志" },
        { status: 403 }
      );
    }

    await prisma.workLog.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete worklog error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
