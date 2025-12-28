import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

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

    // 查找学习资料
    const material = await prisma.material.findUnique({
      where: { id }
    });

    if (!material) {
      return NextResponse.json({ message: "资料不存在" }, { status: 404 });
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), "public", material.fileUrl);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = await fs.readFile(filePath);

    // 从 fileUrl 中提取实际文件的扩展名（而不是从 title）
    const actualFileExt = path.extname(material.fileUrl).toLowerCase();
    
    // 确保下载的文件名包含正确的扩展名
    let downloadFileName = material.title;
    const titleExt = path.extname(material.title).toLowerCase();
    
    // 如果 title 没有扩展名，或者扩展名与实际文件不匹配，则添加正确的扩展名
    if (!titleExt || titleExt !== actualFileExt) {
      // 移除 title 中可能存在的错误扩展名
      const titleWithoutExt = titleExt ? material.title.slice(0, -titleExt.length) : material.title;
      downloadFileName = titleWithoutExt + actualFileExt;
    }

    // 获取文件扩展名来确定 MIME 类型
    const ext = actualFileExt;
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".zip": "application/zip",
      ".rar": "application/x-rar-compressed",
      ".7z": "application/x-7z-compressed",
      ".txt": "text/plain",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg"
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";

    // 对文件名进行 URL 编码以支持中文
    const encodedFilename = encodeURIComponent(downloadFileName);

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": fileBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error("Download material error:", error);
    return NextResponse.json(
      { message: error.message || "下载失败" },
      { status: 500 }
    );
  }
}
