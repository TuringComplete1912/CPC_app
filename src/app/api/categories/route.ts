import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取所有板块
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        select: { username: true, nickname: true }
      },
      _count: {
        select: { materials: true }
      }
    }
  });

  return NextResponse.json(
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: cat.type,
      createdAt: cat.createdAt,
      creatorName: cat.creator.nickname || cat.creator.username,
      creatorId: cat.creatorId,
      materialCount: cat._count.materials
    }))
  );
}

// 创建新板块
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { name, description, type = "course" } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "板块名称不能为空" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        type: type,
        creatorId: session.user.id as string
      },
      include: {
        creator: {
          select: { username: true, nickname: true }
        }
      }
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      type: category.type,
      createdAt: category.createdAt,
      creatorName: category.creator.nickname || category.creator.username,
      creatorId: category.creatorId
    });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { message: error.message || "创建板块失败" },
      { status: 500 }
    );
  }
}

