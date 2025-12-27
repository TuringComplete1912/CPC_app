import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取当前用户的党务信息
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const partyInfo = await prisma.partyInfo.findUnique({
      where: { userId: session.user.id as string },
      include: {
        user: {
          select: { nickname: true, username: true }
        }
      }
    });

    if (!partyInfo) {
      return NextResponse.json(null);
    }

    return NextResponse.json(partyInfo);
  } catch (error: any) {
    console.error("Get party info error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// 创建或更新党务信息
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const userId = session.user.id as string;

    // 验证班级格式（专业+年份，如：土木2201）
    if (data.className && !/^[\u4e00-\u9fa5]+\d{4}$/.test(data.className)) {
      return NextResponse.json(
        { message: "班级格式不正确，请使用标准格式（如：土木2201）" },
        { status: 400 }
      );
    }

    // 根据政治面貌验证必填时间
    const statusOrder = ["群众", "共青团员", "入党积极分子", "预备党员", "党员"];
    const currentStatusIndex = statusOrder.indexOf(data.politicalStatus);

    if (currentStatusIndex >= 1 && !data.joinLeagueDate) {
      return NextResponse.json(
        { message: "共青团员及以上需要填写入团时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 2 && !data.activistDate) {
      return NextResponse.json(
        { message: "入党积极分子及以上需要填写成为积极分子时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 3 && !data.probationaryDate) {
      return NextResponse.json(
        { message: "预备党员及以上需要填写成为预备党员时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 4 && !data.formalDate) {
      return NextResponse.json(
        { message: "党员需要填写成为正式党员时间" },
        { status: 400 }
      );
    }

    const partyInfo = await prisma.partyInfo.upsert({
      where: { userId },
      create: {
        userId,
        ...data
      },
      update: data
    });

    return NextResponse.json(partyInfo);
  } catch (error: any) {
    console.error("Update party info error:", error);
    return NextResponse.json(
      { message: error.message || "保存失败" },
      { status: 500 }
    );
  }
}
