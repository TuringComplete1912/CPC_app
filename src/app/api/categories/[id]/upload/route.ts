import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: categoryId } = params;
    const formData = await req.formData();
    const file = formData.get("file");
    const title = formData.get("title") as string;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "缺少文件" }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ message: "缺少标题" }, { status: 400 });
    }

    // 检查板块是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ message: "板块不存在" }, { status: 404 });
    }

    // 获取用户信息检查文件大小限制
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const fileSize = (file as any).size ?? 0;
    const maxSize = user?.role === "admin" ? Infinity : 50 * 1024 * 1024; // 50MB

    if (fileSize > maxSize) {
      return NextResponse.json(
        { message: "文件大小超过限制（普通用户最大50MB）" },
        { status: 400 }
      );
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

    const material = await prisma.material.create({
      data: {
        title: title.trim(),
        fileUrl,
        fileType: mime.startsWith("image/")
          ? "image"
          : mime.startsWith("video/")
            ? "video"
            : "document",
        fileSize,
        uploaderId: session.user.id,
        categoryId
      },
      include: { uploader: true }
    });

    return NextResponse.json({
      id: material.id,
      title: material.title,
      fileUrl: material.fileUrl,
      fileType: material.fileType,
      fileSize: material.fileSize,
      createdAt: material.createdAt,
      uploaderName: material.uploader?.username ?? "未知",
      uploaderId: material.uploaderId
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: error.message || "上传失败" },
      { status: 500 }
    );
  }
}
