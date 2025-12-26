import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Search API - finds topics, documents, materials, and categories
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, community, documents, materials, categories

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = query.trim().toLowerCase();
    const results: any = {
      community: [],
      documents: [],
      materials: [],
      categories: []
    };

    // 搜索社区话题（只搜索标题和简介）
    if (type === "all" || type === "community") {
      const topics = await prisma.topic.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } }
          ]
        },
        include: {
          author: {
            select: { nickname: true, username: true }
          },
          _count: {
            select: { answers: true }
          }
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      });

      results.community = topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        type: "community",
        author: topic.author.nickname || topic.author.username,
        answerCount: topic._count.answers,
        createdAt: topic.createdAt,
        url: `/community/${topic.id}`
      }));
    }

    // 搜索文档（只搜索标题）
    if (type === "all" || type === "documents") {
      const documents = await prisma.document.findMany({
        where: {
          AND: [
            { status: "published" },
            { title: { contains: searchQuery } }
          ]
        },
        include: {
          author: {
            select: { nickname: true, username: true }
          }
        },
        take: 10,
        orderBy: { publishedAt: "desc" }
      });

      results.documents = documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 200),
        type: "document",
        author: doc.author.nickname || doc.author.username,
        publishedAt: doc.publishedAt,
        url: `/documents/${doc.id}`
      }));
    }

    // 搜索学习资料（只搜索标题）
    if (type === "all" || type === "materials") {
      const materials = await prisma.material.findMany({
        where: {
          title: { contains: searchQuery }
        },
        include: {
          uploader: true,
          category: true
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      });

      results.materials = materials.map((material) => ({
        id: material.id,
        title: material.title,
        fileType: material.fileType,
        fileUrl: material.fileUrl,
        fileSize: material.fileSize,
        type: "material",
        categoryName: material.category?.name,
        categoryType: (material.category as any)?.type as string | undefined,
        categoryId: material.category?.id,
        uploader: material.uploader.nickname || material.uploader.username,
        createdAt: material.createdAt,
        url: material.categoryId ? `/materials/${material.categoryId}` : `/materials`
      }));
    }

    // 搜索分类/板块（搜索名称和描述）
    if (type === "all" || type === "materials") {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } }
          ]
        },
        include: {
          creator: {
            select: { nickname: true, username: true }
          },
          _count: {
            select: { materials: true }
          }
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      });

      results.categories = categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        type: "category",
        categoryType: (category as any).type as string,
        materialCount: category._count.materials,
        creator: category.creator.nickname || category.creator.username,
        createdAt: category.createdAt,
        url: `/materials/${category.id}`
      }));
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: error.message || "搜索失败" },
      { status: 500 }
    );
  }
}
