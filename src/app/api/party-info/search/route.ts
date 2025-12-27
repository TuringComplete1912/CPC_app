import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 搜索同志
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // year, stage
    const value = searchParams.get("value");

    if (!type || !value) {
      return NextResponse.json({ message: "缺少参数" }, { status: 400 });
    }

    let whereClause: any = {};

    if (type === "year") {
      // 搜索同年同志（根据班级前两位）
      const year = value.substring(0, 2);
      whereClause = {
        className: { startsWith: year },
        showClassName: true // 只显示公开班级的
      };
    } else if (type === "stage") {
      // 搜索同阶段同志
      whereClause = {
        politicalStatus: value,
        showPoliticalStatus: true // 只显示公开政治面貌的
      };
    }

    const results = await prisma.partyInfo.findMany({
      where: {
        ...whereClause,
        userId: { not: session.user.id as string } // 排除自己
      },
      include: {
        user: {
          select: { id: true, nickname: true, username: true }
        }
      },
      take: 50
    });

    // 只返回公开的信息
    const filteredResults = results.map((info) => ({
      id: info.id,
      userId: info.userId,
      userName: info.user.nickname || info.user.username,
      politicalStatus: info.showPoliticalStatus ? info.politicalStatus : null,
      className: info.showClassName ? info.className : null,
      hometown: info.showHometown ? info.hometown : null,
      wechatQQ: info.showWechatQQ ? info.wechatQQ : null,
      joinLeagueDate: info.showJoinLeagueDate ? info.joinLeagueDate : null,
      activistDate: info.showActivistDate ? info.activistDate : null,
      probationaryDate: info.showProbationaryDate ? info.probationaryDate : null,
      formalDate: info.showFormalDate ? info.formalDate : null
    }));

    return NextResponse.json(filteredResults);
  } catch (error: any) {
    console.error("Search party info error:", error);
    return NextResponse.json(
      { message: error.message || "搜索失败" },
      { status: 500 }
    );
  }
}
