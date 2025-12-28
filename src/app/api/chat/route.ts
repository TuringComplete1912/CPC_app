import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 【辅助函数】生成系统上下文
// (原 GET 方法逻辑，改为函数调用更稳定)
async function generateSystemContext(userId: string) {
  try {
    // 1. 获取所有已发布的文档（包含内容摘要）
    const documents = await prisma.document.findMany({
      where: { status: "published" },
      select: {
        title: true,
        content: true,
        status: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // 2. 获取所有已发布的活动日志（包含内容摘要）
    const workLogs = await prisma.workLog.findMany({
      where: { status: "published" },
      select: {
        title: true,
        content: true,
        status: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // 3. 获取所有学习资料（包含分类信息）
    const materials = await prisma.material.findMany({
      select: {
        title: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        uploader: { select: { nickname: true, username: true } },
        category: { select: { name: true, description: true, type: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    // 4. 获取所有话题（包含描述和回答数）
    const topics = await prisma.topic.findMany({
      select: {
        title: true,
        description: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } },
        _count: { select: { answers: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    // 5. 获取学习资料分类统计
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        description: true,
        type: true,
        _count: { select: { materials: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // 6. 获取统计数据
    const stats = {
      totalDocuments: await prisma.document.count({ where: { status: "published" } }),
      totalWorkLogs: await prisma.workLog.count({ where: { status: "published" } }),
      totalMaterials: await prisma.material.count(),
      totalTopics: await prisma.topic.count(),
      totalUsers: await prisma.user.count()
    };

    // 7. 构建增强的数据概览 Prompt
    const dataContext = `
# 学生第六党支部数据库概览

## 📊 统计数据
- 已发布文档: ${stats.totalDocuments} 篇
- 活动日志: ${stats.totalWorkLogs} 条
- 学习资料: ${stats.totalMaterials} 个文件
- 社区话题: ${stats.totalTopics} 个
- 支部成员: ${stats.totalUsers} 人

## 📚 学习资料分类
${categories.map(cat => `- ${cat.name} (${cat.type === "theory" ? "理论学习" : "课程学习"}): ${cat._count.materials} 个文件${cat.description ? ` - ${cat.description}` : ""}`).join("\n")}

## 📄 近期文档 (已发布)
${documents.map((doc, i) => {
  const contentPreview = doc.content.substring(0, 150).replace(/\n/g, " ");
  return `${i + 1}. 《${doc.title}》
   作者: ${doc.author?.nickname || doc.author?.username}
   时间: ${new Date(doc.createdAt).toLocaleDateString("zh-CN")}
   摘要: ${contentPreview}${doc.content.length > 150 ? "..." : ""}`;
}).join("\n\n")}

## 📝 活动日志 (已发布)
${workLogs.map((log, i) => {
  const contentPreview = log.content.substring(0, 150).replace(/\n/g, " ");
  return `${i + 1}. 《${log.title}》
   作者: ${log.author?.nickname || log.author?.username}
   时间: ${new Date(log.createdAt).toLocaleDateString("zh-CN")}
   摘要: ${contentPreview}${log.content.length > 150 ? "..." : ""}`;
}).join("\n\n")}

## 📖 学习资料清单
${materials.map((mat, i) => {
  const sizeInMB = (mat.fileSize / 1024 / 1024).toFixed(2);
  const fileTypeLabel = mat.fileType === "document" ? "文档" : mat.fileType === "presentation" ? "演示文稿" : "压缩包";
  return `${i + 1}. ${mat.title}
   类型: ${fileTypeLabel} | 大小: ${sizeInMB}MB
   分类: ${mat.category?.name || "未分类"}${mat.category?.type === "theory" ? " (理论学习)" : mat.category?.type === "course" ? " (课程学习)" : ""}
   上传者: ${mat.uploader?.nickname || mat.uploader?.username}
   时间: ${new Date(mat.createdAt).toLocaleDateString("zh-CN")}`;
}).join("\n\n")}

## 💬 社区话题
${topics.map((topic, i) => `${i + 1}. ${topic.title}
   ${topic.description ? `简介: ${topic.description}` : ""}
   发起人: ${topic.author?.nickname || topic.author?.username}
   回答数: ${topic._count?.answers || 0}
   时间: ${new Date(topic.createdAt).toLocaleDateString("zh-CN")}`).join("\n\n")}
`;

    return dataContext;
  } catch (error) {
    console.error("生成上下文失败:", error);
    return ""; // 如果数据库挂了，至少不影响聊天，只是没数据
  }
}

// AI聊天主入口
export async function POST(req: NextRequest) {
  // 1. 鉴权
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { message, apiKey, stream = true } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
    }

    // 2. 决定使用哪个 API Key
    let finalApiKey = apiKey; // 优先用前端传来的（如果有）
    
    // 如果前端没传，检查用户个人设置
    if (!finalApiKey) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        select: { apiKey: true, useOwnApiKey: true }
      });
      
      if (user?.useOwnApiKey && user?.apiKey) {
        finalApiKey = user.apiKey;
      }
    }

    // 如果还是没有，使用系统环境变量 (这里修复了之前的 bug)
    // 优先读 OPENROUTER_API_KEY，其次读 OPENAI_API_KEY
    if (!finalApiKey) {
      finalApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    }

    // 最后检查
    if (!finalApiKey) {
      console.error("无有效 API Key");
      return NextResponse.json(
        { message: "系统未配置API Key，请联系管理员或在个人设置中填写。" },
        { status: 500 }
      );
    }

    // 3. 获取数据库里的支部数据 (你的特色功能)
    const dbContext = await generateSystemContext(session.user.id);

    // 4. 拼接完整 System Prompt (你的学六小助手人设)
    const systemPrompt = `你是"学六小助手"，学生第六党支部的AI助手。你热情、专业、乐于助人。

你可以访问支部的完整数据库，包括：
- 所有已发布的文档及其内容摘要
- 所有活动日志及其内容摘要
- 所有学习资料的详细信息（文件名、类型、大小、分类）
- 所有社区话题及其描述
- 学习资料的分类体系（理论学习、课程学习）

${dbContext}

## 你的能力
1. **信息查询**: 帮助用户快速找到文档、资料、话题
2. **内容推荐**: 根据用户需求推荐相关学习资料
3. **数据统计**: 提供支部活动、资料的统计信息
4. **导航指引**: 告诉用户在哪个板块可以找到相关内容

## 回答风格
- 使用友好、亲切的语气，像支部的热心学长/学姐 😊
- 适当使用emoji让对话更生动 (📚 📄 💡 ✨ 等)
- 简洁明了，重点突出，分点列举
- 当用户询问具体文档或资料时，提供标题、作者、时间等关键信息
- 如果数据库中有相关内容，优先引用；如果没有，诚实告知
- 对于学习资料，可以说明文件类型、大小、所属分类
- 鼓励用户到对应板块查看完整内容

## 回答示例
用户: "有没有关于党章的学习资料？"
你: "📚 让我帮你查找一下党章相关的学习资料！

根据数据库，我找到以下资料：
1. 《中国共产党章程》- PDF文档，理论学习分类
2. 《党章学习解读》- PPT演示文稿，理论学习分类

你可以在【学习园地】→【理论学习】板块中找到这些资料并下载哦！✨"

用户: "最近有什么活动？"
你: "📝 最近的支部活动有：

1. 《党员发展对象座谈会》- 2024年1月15日
2. 《理论学习研讨会》- 2024年1月10日

详细内容可以在【活动日志】板块查看完整记录！"`;


    // 5. 调用 OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${finalApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "CPC Student Branch App"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free", // 或者 deepseek/deepseek-chat
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          stream: stream
        })
      }
    );

    // 6. 错误处理
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return NextResponse.json(
        { message: "AI 思考累了，请稍后再试或检查 API Key。" },
        { status: response.status }
      );
    }

    // 7. 返回流式响应
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // 非流式兼容
    const data = await response.json();
    return NextResponse.json({ 
      reply: data.choices?.[0]?.message?.content || "无回复" 
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { message: error.message || "聊天服务暂时不可用" },
      { status: 500 }
    );
  }
}