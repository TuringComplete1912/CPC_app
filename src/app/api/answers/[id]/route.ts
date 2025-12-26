import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 删除回答
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

    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return NextResponse.json({ message: "回答不存在" }, { status: 404 });
    }

    // 获取当前用户
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // 只有作者或管理员可以删除
    const isAuthor = answer.authorId === session.user.id;
    const isAdmin = currentUser?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { message: "无权删除此回答" },
        { status: 403 }
      );
    }

    await prisma.answer.delete({
      where: { id }
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error: any) {
    console.error("Delete answer error:", error);
    return NextResponse.json(
      { message: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
