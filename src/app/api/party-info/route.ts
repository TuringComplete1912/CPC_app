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
    const body = await req.json();
    const userId = session.user.id as string;

    // 验证班级格式（专业+年份，如：土木2201）- 可选
    if (body.className && body.className.trim() && !/^[\u4e00-\u9fa5]+\d{4}$/.test(body.className)) {
      return NextResponse.json(
        { message: "班级格式不正确，请使用标准格式（如：土木2201）" },
        { status: 400 }
      );
    }

    // 根据政治面貌验证必填时间
    const statusOrder = ["群众", "共青团员", "入党积极分子", "预备党员", "党员"];
    const currentStatusIndex = statusOrder.indexOf(body.politicalStatus);

    if (currentStatusIndex >= 1 && !body.joinLeagueDate) {
      return NextResponse.json(
        { message: "共青团员及以上需要填写入团时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 2 && !body.activistDate) {
      return NextResponse.json(
        { message: "入党积极分子及以上需要填写成为积极分子时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 3 && !body.probationaryDate) {
      return NextResponse.json(
        { message: "预备党员及以上需要填写成为预备党员时间" },
        { status: 400 }
      );
    }

    if (currentStatusIndex >= 4 && !body.formalDate) {
      return NextResponse.json(
        { message: "党员需要填写成为正式党员时间" },
        { status: 400 }
      );
    }

    // 只提取需要的字段，避免传入不必要的字段
    const data = {
      politicalStatus: body.politicalStatus,
      className: body.className || "",
      hometown: body.hometown || "",
      wechatQQ: body.wechatQQ || "",
      joinLeagueDate: body.joinLeagueDate ? new Date(body.joinLeagueDate) : null,
      activistDate: body.activistDate ? new Date(body.activistDate) : null,
      probationaryDate: body.probationaryDate ? new Date(body.probationaryDate) : null,
      formalDate: body.formalDate ? new Date(body.formalDate) : null,
      showPoliticalStatus: body.showPoliticalStatus ?? true,
      showClassName: body.showClassName ?? true,
      showHometown: body.showHometown ?? true,
      showWechatQQ: body.showWechatQQ ?? false,
      showJoinLeagueDate: body.showJoinLeagueDate ?? true,
      showActivistDate: body.showActivistDate ?? true,
      showProbationaryDate: body.showProbationaryDate ?? true,
      showFormalDate: body.showFormalDate ?? true,
    };

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
