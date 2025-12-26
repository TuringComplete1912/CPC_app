# OpenRouter + DeepSeek 配置指南

## 已完成配置

✅ 你的API Key已经配置完成！

```
OPENROUTER_API_KEY="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"
```

## 使用的AI模型

- **服务商**: OpenRouter
- **模型**: DeepSeek R1 Free (`deepseek/deepseek-r1-0528:free`)
- **特点**: 
  - ✅ 完全免费
  - ✅ 强大的中文理解能力
  - ✅ 快速响应
  - ✅ 无需信用卡

## 如何使用

### 1. 启动应用
```bash
npm run dev
```

### 2. 登录系统
- 访问 http://localhost:3000
- 使用你的账号登录

### 3. 使用AI助手
- 进入"个人主页"
- 在右侧的AI助手区域输入问题
- AI会根据支部资料回答你的问题

## 示例对话

**你可以问：**
- "有哪些文档？"
- "最近有什么活动？"
- "学习资料有哪些分类？"
- "社区有什么热门话题？"
- "2025/12/27的飞盘活动是什么？"

**AI会回答：**
基于支部的文档、活动日志、学习资料和社区话题的名称和简介，为你提供信息导航。

## API Key管理

### 系统默认Key（已配置）
- 位置：`.env` 文件
- 所有用户共享使用
- 已配置你提供的key

### 个人Key（可选）
- 位置：个人主页 → "设置 API Key"按钮
- 每个用户可以设置自己的key
- 优先级高于系统key

## 技术细节

### API端点
```
https://openrouter.ai/api/v1/chat/completions
```

### 请求格式
```json
{
  "model": "deepseek/deepseek-r1-0528:free",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词（包含所有资料信息）"
    },
    {
      "role": "user",
      "content": "用户的问题"
    }
  ]
}
```

### 必需的HTTP头部
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
HTTP-Referer: http://localhost:3000
X-Title: CPC Student Branch App
```

⚠️ **重要**: OpenRouter要求提供 `HTTP-Referer` 和 `X-Title` 头部，否则会返回 "No cookie auth credentials found" 错误。

### 响应格式
```json
{
  "choices": [
    {
      "message": {
        "content": "AI的回答"
      }
    }
  ]
}
```

## 注意事项

### 安全性
- ✅ API Key已安全存储在 `.env` 文件中
- ✅ `.env` 文件已在 `.gitignore` 中，不会提交到Git
- ⚠️ 不要将API Key分享给他人
- ⚠️ 不要在公开场合展示API Key

### 使用限制
- 免费模型有请求频率限制
- 建议合理使用，避免频繁请求
- 如果遇到限制，可以等待一段时间后重试

### 故障排除

**问题1: AI无法回答**
- 检查 `.env` 文件中的API Key是否正确
- 重启开发服务器
- 检查网络连接

**问题2: 提示"请先设置API Key"**
- 确认 `.env` 文件中有 `OPENROUTER_API_KEY` 配置
- 确认API Key格式正确（sk-or-v1-...）
- 重启开发服务器

**问题3: "No cookie auth credentials found" 错误**
- ✅ 已修复：需要在请求中添加 `HTTP-Referer` 和 `X-Title` 头部
- 这是OpenRouter的安全要求
- 代码已自动处理，无需手动配置

**问题4: 响应很慢**
- DeepSeek模型可能在高峰期响应较慢
- 可以稍后重试
- 考虑设置个人API Key分散负载

## 获取更多API Key

如果需要更多API Key：

1. 访问 https://openrouter.ai/keys
2. 登录你的账号
3. 点击"Create Key"
4. 复制新的API Key
5. 在个人主页设置为个人Key

## 支持的其他模型

OpenRouter还支持其他免费模型：
- `google/gemini-flash-1.5-8b-exp-free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`

如需切换模型，修改 `src/app/api/chat/route.ts` 中的 `model` 参数。

## 总结

✅ 配置完成，可以开始使用AI助手了！
✅ 使用完全免费的DeepSeek模型
✅ 强大的中文对话能力
✅ 了解支部所有资料信息

祝使用愉快！🎉
