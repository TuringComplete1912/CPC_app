import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 管理员查看所有党务信息
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    // 检查是否为管理员
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string }
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json({ message: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "name"; // name, year, stage
    const keyword = searchParams.get("keyword") || "";

    let orderBy: any = {};
    let whereClause: any = {};

    // 关键字搜索
    if (keyword) {
      whereClause = {
        OR: [
          { className: { contains: keyword } },
          { politicalStatus: { contains: keyword } },
          { hometown: { contains: keyword } },
          { user: { nickname: { contains: keyword } } },
          { user: { username: { contains: keyword } } }
        ]
      };
    }

    // 排序
    switch (sortBy) {
      case "year":
        orderBy = { className: "asc" };
        break;
      case "stage":
        orderBy = { politicalStatus: "asc" };
        break;
      case "name":
      default:
        orderBy = { user: { nickname: "asc" } };
        break;
    }

    const results = await prisma.partyInfo.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, nickname: true, username: true }
        }
      },
      orderBy
    });

    // 管理员可以看到所有信息
    const formattedResults = results.map((info) => ({
      id: info.id,
      userId: info.userId,
      userName: info.user.nickname || info.user.username,
      politicalStatus: info.politicalStatus,
      className: info.className,
      hometown: info.hometown,
      wechatQQ: info.wechatQQ,
      joinLeagueDate: info.joinLeagueDate,
      activistDate: info.activistDate,
      probationaryDate: info.probationaryDate,
      formalDate: info.formalDate,
      updatedAt: info.updatedAt
    }));

    return NextResponse.json(formattedResults);
  } catch (error: any) {
    console.error("Admin get party info error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
