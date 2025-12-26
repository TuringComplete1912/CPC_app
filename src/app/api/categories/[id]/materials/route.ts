import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取指定板块的材料列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id } = params;

    const materials = await prisma.material.findMany({
      where: { categoryId: id },
      orderBy: { createdAt: "desc" },
      include: { uploader: true }
    });

    const data = materials.map((m) => ({
      id: m.id,
      title: m.title,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSize: m.fileSize,
      createdAt: m.createdAt,
      uploaderName: m.uploader?.username ?? "未知",
      uploaderId: m.uploaderId
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Get materials error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
