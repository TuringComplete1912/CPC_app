import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
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
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

  const mime = (file as any).type || "application/octet-stream";
  const fileUrl = `/uploads/${filename}`;
  const fileSize = (file as any).size ?? buffer.byteLength ?? 0;

  // 兼容旧的学习资料逻辑（保留）
  await prisma.material.create({
    data: {
      title: file.name,
      fileUrl,
      fileType: mime.startsWith("image/")
        ? "image"
        : mime.startsWith("video/")
          ? "video"
          : "document",
      uploaderId: session.user.id
    }
  });

  const createdFile = await prisma.file.create({
    data: {
      filename: file.name,
      path: filepath,
      url: fileUrl,
      mimeType: mime,
      size: fileSize,
      uploaderId: session.user.id
    },
    include: { uploader: true }
  });

  return NextResponse.json({
    id: createdFile.id,
    filename: createdFile.filename,
    url: createdFile.url,
    mimeType: createdFile.mimeType,
    size: createdFile.size,
    createdAt: createdFile.createdAt,
    uploaderName: createdFile.uploader?.username ?? "未知",
    uploaderId: createdFile.uploaderId
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const files = await prisma.file.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: true }
  });

  return NextResponse.json(
    files.map((f) => ({
      id: f.id,
      filename: f.filename,
      url: f.url,
      mimeType: f.mimeType,
      size: f.size,
      createdAt: f.createdAt,
      uploaderName: f.uploader?.username ?? "未知",
      uploaderId: f.uploaderId
    }))
  );
}

