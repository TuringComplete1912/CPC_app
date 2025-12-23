export async function polishText(content: string): Promise<string> {
  // 为了兼容生产构建，这里暂时不直接依赖 @google/genai。
  // 如需真实调用，可在此处按最新 SDK 文档集成，并确保构建通过。
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return `${content}\n\n【AI润色示例】请在环境变量 NEXT_PUBLIC_GEMINI_API_KEY 中配置密钥以启用真实请求。`;
  }
  // 演示环境：直接回传原文，避免构建阶段外部 SDK 兼容性问题。
  return content;
}

export async function summarizeDocument(content: string): Promise<string> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return "请配置 NEXT_PUBLIC_GEMINI_API_KEY 以启用摘要功能。";
  }
  return "（演示环境）这里将展示由 Gemini 生成的摘要内容。";
}

