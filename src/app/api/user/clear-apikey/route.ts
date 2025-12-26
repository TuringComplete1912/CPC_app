import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { apiKey: "" }
    });

    return NextResponse.json({ message: "API Key已清除，将使用系统默认Key" });
  } catch (error: any) {
    console.error("Clear API Key error:", error);
    return NextResponse.json(
      { message: error.message || "清除失败" },
      { status: 500 }
    );
  }
}
