import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 上传文档附件
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: documentId } = params;
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "缺少文件" }, { status: 400 });
    }

    // 检查文档是否存在
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ message: "文档不存在" }, { status: 404 });
    }

    // 只允许上传PDF文件
    const fileType = (file as any).type || "";
    if (!fileType.includes("pdf")) {
      return NextResponse.json(
        { message: "只支持上传PDF文件" },
        { status: 400 }
      );
    }

    const fileSize = (file as any).size ?? 0;
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (fileSize > maxSize) {
      return NextResponse.json(
        { message: "文件大小超过限制（最大50MB）" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/\s+/g, "_");
    const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    const fileUrl = `/uploads/documents/${filename}`;

    const attachment = await prisma.documentAttachment.create({
      data: {
        documentId,
        filename: file.name,
        url: fileUrl,
        size: fileSize
      }
    });

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      url: attachment.url,
      size: attachment.size,
      createdAt: attachment.createdAt
    });
  } catch (error: any) {
    console.error("Upload document attachment error:", error);
    return NextResponse.json(
      { message: error.message || "上传失败" },
      { status: 500 }
    );
  }
}

// 获取文档的所有附件
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { id: documentId } = params;

    const attachments = await prisma.documentAttachment.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error("Get document attachments error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
