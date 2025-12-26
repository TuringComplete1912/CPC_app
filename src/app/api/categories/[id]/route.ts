import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

// 删除板块
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;

  try {
    const { id } = params;

    // 查找板块及其关联的材料
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        materials: {
          select: {
            id: true,
            uploaderId: true,
            fileUrl: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ message: "板块不存在" }, { status: 404 });
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    const isCreator = category.creatorId === userId;
    const isAdmin = currentUser?.role === "admin";

    // 检查是否有他人上传的文件
    const hasOtherUserFiles = category.materials.some(
      (material) => material.uploaderId !== userId
    );

    // 权限检查
    if (!isAdmin) {
      if (!isCreator) {
        return NextResponse.json(
          { message: "无权删除此板块" },
          { status: 403 }
        );
      }

      if (hasOtherUserFiles) {
        return NextResponse.json(
          { message: "板块中有他人上传的文件，无法删除" },
          { status: 403 }
        );
      }
    }

    // 删除所有关联文件（从服务器）
    for (const material of category.materials) {
      if (material.fileUrl) {
        const filePath = path.join(process.cwd(), "public", material.fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error("删除文件失败:", error);
          // 继续删除其他文件
        }
      }
    }

    // 删除板块（级联删除关联的材料记录）
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
