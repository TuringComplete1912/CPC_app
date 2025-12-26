import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 【辅助函数】生成系统上下文
// (原 GET 方法逻辑，改为函数调用更稳定)
async function generateSystemContext(userId: string) {
  try {
    // 1. 获取所有文档
    const documents = await prisma.document.findMany({
      select: {
        title: true,
        status: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10 // 限制数量，防止 Prompt 太长导致超费
    });

    // 2. 获取所有活动日志
    const workLogs = await prisma.workLog.findMany({
      select: {
        title: true,
        status: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // 3. 获取所有学习资料
    const materials = await prisma.material.findMany({
      select: {
        title: true,
        fileType: true,
        createdAt: true,
        uploader: { select: { nickname: true, username: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // 4. 获取所有话题
    const topics = await prisma.topic.findMany({
      select: {
        title: true,
        description: true,
        createdAt: true,
        author: { select: { nickname: true, username: true } },
        _count: { select: { answers: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // 5. 构建数据概览 Prompt
    const dataContext = `
以下是支部现有的资料概览（仅列出最新）：

## 近期文档
${documents.map((doc, i) => `${i + 1}. ${doc.title} - ${doc.status === "published" ? "已发布" : "草稿"} (作者: ${doc.author?.nickname || doc.author?.username})`).join("\n")}

## 活动日志
${workLogs.map((log, i) => `${i + 1}. ${log.title} - ${log.status === "published" ? "已发布" : "草稿"} (作者: ${log.author?.nickname || log.author?.username})`).join("\n")}

## 学习资料
${materials.map((mat, i) => `${i + 1}. ${mat.title} - ${mat.fileType} ${mat.category ? `(分类: ${mat.category.name})` : ""} (上传者: ${mat.uploader?.nickname || mat.uploader?.username})`).join("\n")}

## 社区话题
${topics.map((topic, i) => `${i + 1}. ${topic.title}${topic.description ? ` - ${topic.description}` : ""} (${topic._count?.answers || 0}个回答)`).join("\n")}
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

${dbContext}

回答风格：
- 使用友好、亲切的语气
- 适当使用emoji让对话更生动 🌟
- 简洁明了，重点突出
- 对于不确定的信息，诚实告知用户可以在对应板块查看详情
- 如果用户问及上面概览中不存在的信息，请说明暂未查询到相关记录`;

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