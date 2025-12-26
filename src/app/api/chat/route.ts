import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取系统提示词（所有资料的名称和简介）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    // 获取所有文档
    const documents = await prisma.document.findMany({
      select: {
        title: true,
        status: true,
        createdAt: true,
        author: {
          select: { nickname: true, username: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 获取所有活动日志
    const workLogs = await prisma.workLog.findMany({
      select: {
        title: true,
        status: true,
        createdAt: true,
        author: {
          select: { nickname: true, username: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 获取所有学习资料
    const materials = await prisma.material.findMany({
      select: {
        title: true,
        fileType: true,
        createdAt: true,
        uploader: {
          select: { nickname: true, username: true }
        },
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 获取所有话题
    const topics = await prisma.topic.findMany({
      select: {
        title: true,
        description: true,
        createdAt: true,
        author: {
          select: { nickname: true, username: true }
        },
        _count: {
          select: { answers: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 构建系统提示词
    const systemPrompt = `你是学生第六党支部的AI助手，可以帮助用户了解支部的各类资料和活动。

以下是支部现有的资料概览：

## 近期文档 (${documents.length}个)
${documents.map((doc, i) => `${i + 1}. ${doc.title} - ${doc.status === "published" ? "已发布" : "草稿"} (作者: ${doc.author.nickname || doc.author.username})`).join("\n")}

## 活动日志 (${workLogs.length}个)
${workLogs.map((log, i) => `${i + 1}. ${log.title} - ${log.status === "published" ? "已发布" : "草稿"} (作者: ${log.author.nickname || log.author.username})`).join("\n")}

## 学习资料 (${materials.length}个)
${materials.map((mat, i) => `${i + 1}. ${mat.title} - ${mat.fileType} ${mat.category ? `(分类: ${mat.category.name})` : ""} (上传者: ${mat.uploader.nickname || mat.uploader.username})`).join("\n")}

## 社区话题 (${topics.length}个)
${topics.map((topic, i) => `${i + 1}. ${topic.title}${topic.description ? ` - ${topic.description}` : ""} (${topic._count.answers}个回答)`).join("\n")}

请根据以上信息回答用户的问题。如果用户询问具体内容，请告知他们可以在对应的板块中查看详细信息。`;

    return NextResponse.json({ systemPrompt });
  } catch (error: any) {
    console.error("Get system prompt error:", error);
    return NextResponse.json(
      { message: error.message || "获取失败" },
      { status: 500 }
    );
  }
}

// AI聊天（支持流式输出）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { message, apiKey, stream = true } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
    }

    // 获取用户的API key和设置
    let userApiKey = apiKey;
    let useOwnKey = false;
    
    if (!userApiKey) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        select: { apiKey: true, useOwnApiKey: true }
      });
      userApiKey = user?.apiKey;
      useOwnKey = user?.useOwnApiKey || false;
    }

    // 系统默认的正确API Key
    const SYSTEM_API_KEY = "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";
    
    // 根据用户设置决定使用哪个key
    const finalApiKey = (useOwnKey && userApiKey) ? userApiKey : SYSTEM_API_KEY;

    if (!finalApiKey) {
      return NextResponse.json(
        { message: "请先设置API Key" },
        { status: 400 }
      );
    }

    // 获取系统提示词
    const systemPromptRes = await GET();
    const { systemPrompt } = await systemPromptRes.json();

    // 添加学六小助手的身份
    const enhancedSystemPrompt = `你是"学六小助手"，学生第六党支部的AI助手。你热情、专业、乐于助人。

${systemPrompt}

回答风格：
- 使用友好、亲切的语气
- 适当使用emoji让对话更生动
- 简洁明了，重点突出
- 对于不确定的信息，诚实告知用户可以在对应板块查看详情`;

    // 调用OpenRouter API
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
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content: enhancedSystemPrompt
            },
            {
              role: "user",
              content: message
            }
          ],
          stream: stream
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      console.error("OpenRouter API error:", error);
      return NextResponse.json(
        { message: `AI服务调用失败: ${error.error?.message || error.message || "未知错误"}` },
        { status: 500 }
      );
    }

    // 如果是流式输出，直接返回流
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // 非流式输出
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "抱歉，我无法回答这个问题。";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { message: error.message || "聊天失败" },
      { status: 500 }
    );
  }
}
