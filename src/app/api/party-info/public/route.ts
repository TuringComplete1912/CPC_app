import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取用户的公开党务信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "缺少用户ID" }, { status: 400 });
    }

    const partyInfo = await prisma.partyInfo.findUnique({
      where: { userId },
      select: {
        politicalStatus: true,
        className: true,
        showPoliticalStatus: true,
        showClassName: true
      }
    });

    if (!partyInfo) {
      return NextResponse.json(null);
    }

    return NextResponse.json(partyInfo);
  } catch (error: any) {
    console.error("Get public party info error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
