import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

// 删除材料
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

    // 查找材料
    const material = await prisma.material.findUnique({
      where: { id },
      include: { uploader: true }
    });

    if (!material) {
      return NextResponse.json({ message: "材料不存在" }, { status: 404 });
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 权限检查：只有上传者本人或管理员可以删除
    const isOwner = material.uploaderId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此文件" },
        { status: 403 }
      );
    }

    // 删除服务器上的文件
    if (material.fileUrl) {
      const filePath = path.join(process.cwd(), "public", material.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error("删除文件失败:", error);
        // 继续删除数据库记录，即使文件删除失败
      }
    }

    // 删除数据库记录
    await prisma.material.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
