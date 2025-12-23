import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: true }
  });

  const data = materials.map((m) => ({
    id: m.id,
    title: m.title,
    fileUrl: m.fileUrl,
    fileType: m.fileType as "image" | "video" | "document",
    createdAt: m.createdAt,
    uploaderName: m.uploader?.username ?? "未知",
    uploaderId: m.uploaderId
  }));

  return NextResponse.json(data);
}

