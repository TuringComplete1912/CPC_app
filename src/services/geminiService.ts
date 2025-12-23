import { GoogleGenerativeAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const modelName = "gemini-1.5-flash";

const createClient = () => {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export async function polishText(content: string): Promise<string> {
  const client = createClient();
  if (!client) {
    return `${content}\n\n【AI润色示例】请在环境变量 NEXT_PUBLIC_GEMINI_API_KEY 中配置密钥以启用真实请求。`;
  }

  try {
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(
      `请帮助润色以下中文段落，保持语气庄重、精炼，并返回修改后的文本：\n${content}`
    );
    return result.response.text() || content;
  } catch (error) {
    console.error("Gemini polishText error:", error);
    return content;
  }
}

export async function summarizeDocument(content: string): Promise<string> {
  const client = createClient();
  if (!client) {
    return "请配置 NEXT_PUBLIC_GEMINI_API_KEY 以启用摘要功能。";
  }

  try {
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(
      `请用中文总结以下文档的要点，保持简洁且条理清晰：\n${content}`
    );
    return result.response.text();
  } catch (error) {
    console.error("Gemini summarizeDocument error:", error);
    return "生成摘要时出现问题，请稍后重试。";
  }
}

