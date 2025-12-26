import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 点赞/取消点赞回答
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: answerId } = params;
    const userId = session.user.id as string;

    // 检查回答是否存在
    const answer = await prisma.answer.findUnique({
      where: { id: answerId }
    });

    if (!answer) {
      return NextResponse.json({ message: "回答不存在" }, { status: 404 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.answerLike.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId
        }
      }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.answerLike.delete({
        where: { id: existingLike.id }
      });

      return NextResponse.json({ liked: false, message: "已取消点赞" });
    } else {
      // 点赞
      await prisma.answerLike.create({
        data: {
          answerId,
          userId
        }
      });

      return NextResponse.json({ liked: true, message: "点赞成功" });
    }
  } catch (error: any) {
    console.error("Like answer error:", error);
    return NextResponse.json(
      { message: error.message || "操作失败" },
      { status: 500 }
    );
  }
}

// 获取点赞状态
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: answerId } = params;
    const userId = session.user.id as string;

    const like = await prisma.answerLike.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId
        }
      }
    });

    return NextResponse.json({ liked: !!like });
  } catch (error: any) {
    console.error("Get like status error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
