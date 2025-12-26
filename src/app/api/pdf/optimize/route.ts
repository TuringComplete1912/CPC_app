import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 调用DeepSeek优化文档排版（支持流式输出）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const { title, content, stream = true } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ message: "标题和内容不能为空" }, { status: 400 });
    }

    // 使用系统API Key
    const SYSTEM_API_KEY = "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";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SYSTEM_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "CPC Student Branch App"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content: `你是"学六小助手"，一个专业的文档排版助手。你的任务是优化文档的排版格式，使其更适合PDF导出。

要求：
1. 保持原文内容不变，只优化排版
2. 使用清晰的标题层级（# ## ###）
3. 合理使用段落分隔
4. 添加适当的列表格式
5. 保持专业的文档风格
6. 输出纯Markdown格式，不要添加任何解释

直接输出优化后的Markdown内容，不要有任何前缀或后缀说明。`
            },
            {
              role: "user",
              content: `请优化以下文档的排版：

标题：${title}

内容：
${content}`
            }
          ],
          stream: stream
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", errorText);
      return NextResponse.json(
        { message: "AI优化失败，请稍后重试" },
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
    const optimizedContent = data.choices?.[0]?.message?.content || content;

    return NextResponse.json({ 
      optimizedContent,
      title 
    });
  } catch (error: any) {
    console.error("Optimize PDF error:", error);
    return NextResponse.json(
      { message: error.message || "优化失败" },
      { status: 500 }
    );
  }
}
