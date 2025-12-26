import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";

// 删除上传的文件
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

    // 查找文件
    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 权限检查：只有上传者本人或管理员可以删除
    const isOwner = file.uploaderId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此文件" },
        { status: 403 }
      );
    }

    // 删除服务器上的文件
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error("删除文件失败:", error);
      // 继续删除数据库记录，即使文件删除失败
    }

    // 删除数据库记录
    await prisma.file.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
