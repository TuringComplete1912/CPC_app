import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "缺少文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/\s+/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

  const mime = (file as any).type || "";
  const fileType = mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
      ? "video"
      : "document";

  const created = await prisma.material.create({
    data: {
      title: file.name,
      fileUrl: `/uploads/${filename}`,
      fileType,
      uploaderId: session.user.id
    },
    include: { uploader: true }
  });

  return NextResponse.json({
    id: created.id,
    title: created.title,
    fileUrl: created.fileUrl,
    fileType: created.fileType,
    createdAt: created.createdAt,
    uploaderName: created.uploader?.username ?? "未知",
    uploaderId: created.uploaderId
  });
}

