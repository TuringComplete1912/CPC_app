# 个人主页和AI助手功能

## 功能概述

重构了个人主页，移除了文档编辑功能，添加了个人资料管理和AI助手聊天功能。

## 主要更新

### 1. 移除功能
- ❌ 删除了DraftEditor（文档编辑器）
- ❌ 删除了FileManager（文件管理器）
- ✅ 保留了个人信息展示

### 2. 个人资料管理
- ✅ 编辑个人资料（昵称、部门、简介、电话、邮箱）
- ✅ 资料仅在个人主页展示
- ✅ 不向其他用户展示
- ✅ 点击编辑按钮打开编辑弹窗

### 3. AI助手功能
- ✅ 与AI聊天交互
- ✅ AI了解支部所有资料的名称和简介
- ✅ 可以询问文档、活动、学习资料、话题等信息
- ✅ 支持用户设置个人API Key
- ✅ 支持系统默认API Key

## 数据库更新

### User模型新增字段
```prisma
model User {
  // 个人资料（仅个人主页展示）
  bio      String @default("") // 个人简介
  phone    String @default("") // 联系电话
  email    String @default("") // 邮箱
  
  // AI功能
  apiKey   String @default("") // 用户的API key
}
```

## API路由

### 用户资料API
- `GET /api/user/profile` - 获取用户资料
- `PATCH /api/user/profile` - 更新用户资料

### API Key管理
- `GET /api/user/apikey` - 获取API Key状态
- `POST /api/user/apikey` - 保存API Key

### AI聊天API
- `GET /api/chat` - 获取系统提示词
- `POST /api/chat` - 发送消息给AI

## API Key配置

### 配置位置

在项目根目录的 `.env` 文件中配置：

```env
# OpenRouter API Key (系统默认，用户未设置个人key时使用)
# 获取地址: https://openrouter.ai/keys
OPENROUTER_API_KEY="your-openrouter-api-key-here"
```

### 获取API Key

1. 访问 [OpenRouter Keys](https://openrouter.ai/keys)
2. 登录或注册账号
3. 点击"Create Key"创建新的API Key
4. 复制生成的API Key（格式：sk-or-v1-...）
5. 粘贴到 `.env` 文件中

### 使用的AI模型

- **模型**: DeepSeek R1 Free (`deepseek/deepseek-r1-0528:free`)
- **特点**: 完全免费，无需付费
- **性能**: 强大的中文理解和生成能力
- **限制**: 有请求频率限制，但对个人使用足够

### API Key优先级

1. **用户个人API Key** - 如果用户设置了个人key，优先使用
2. **系统默认API Key** - 如果用户未设置，使用系统配置的key
3. **无API Key** - 提示用户设置API Key

## 个人主页布局

```
┌─────────────────────────────────────────────────────┐
│ 个人主页                                             │
│ 管理你的个人信息和AI助手                             │
├──────────────────┬──────────────────────────────────┤
│ 个人资料 [编辑]   │ AI 助手                          │
│                  │                                  │
│ 头像 + 昵称      │ ┌──────────────────────────┐     │
│ 角色             │ │ 消息列表                  │     │
│                  │ │                          │     │
│ 用户名           │ │ 用户: 问题               │     │
│ 部门             │ │ AI: 回答                 │     │
│ 个人简介         │ │                          │     │
│ 电话             │ └──────────────────────────┘     │
│ 邮箱             │                                  │
│ 加入时间         │ [输入框] [发送]                  │
│                  │                                  │
│ [设置API Key]    │                                  │
└──────────────────┴──────────────────────────────────┘
```

## AI系统提示词

AI助手会自动获取以下信息作为系统提示词：

### 包含的资料
1. **近期文档** - 标题、状态、作者
2. **活动日志** - 标题、状态、作者
3. **学习资料** - 标题、类型、分类、上传者
4. **社区话题** - 标题、描述、回答数

### 不包含的内容
- ❌ 文档完整内容
- ❌ 活动日志详细内容
- ❌ 学习资料文件内容
- ❌ 话题回答内容

这样设计是为了：
- 避免提示词过大
- 保护内容隐私
- 提高响应速度
- 引导用户查看详细内容

## 使用说明

### 编辑个人资料
1. 进入个人主页
2. 点击个人卡片右上角的"编辑"按钮
3. 修改昵称、部门、简介、电话、邮箱
4. 点击"保存"

### 设置API Key
1. 点击"设置 API Key"按钮
2. 输入你的Gemini API Key
3. 点击"保存"
4. API Key将安全保存在数据库中

### 与AI对话
1. 在右侧的AI助手区域输入问题
2. 按Enter或点击发送按钮
3. AI会根据支部资料回答你的问题
4. 可以询问：
   - "有哪些文档？"
   - "最近有什么活动？"
   - "学习资料有哪些分类？"
   - "社区有什么热门话题？"

## 示例对话

**用户**: 有哪些关于党史的学习资料？

**AI**: 根据支部的学习资料库，我看到以下相关资料：
1. 党史学习资料 - 文档类型 (分类: 党史学习)
2. 建党百年纪念视频 - 视频类型 (分类: 党史学习)

你可以在"学习园地"板块中查看这些资料的详细内容。

---

**用户**: 最近有什么活动？

**AI**: 最近的活动日志包括：
1. 2025/12/27 飞盘活动 - 草稿 (作者: 管理员)
2. 党史学习交流会 - 已发布 (作者: 张书记)

你可以在"活动日志"板块查看活动的详细安排和内容。

## 隐私保护

### 个人资料
- 个人简介、电话、邮箱仅在个人主页显示
- 其他用户无法查看这些信息
- 只有用户本人可以编辑

### API Key
- 存储在数据库中加密保存
- 只返回状态和预览（前8位）
- 不会在前端完整显示
- 只用于该用户的AI对话

## 技术实现

### 系统提示词生成
```typescript
// 动态获取所有资料信息
const documents = await prisma.document.findMany({
  select: { title: true, status: true, author: true }
});

// 构建系统提示词
const systemPrompt = `
你是学生第六党支部的AI助手...

## 近期文档 (${documents.length}个)
${documents.map((doc, i) => 
  `${i + 1}. ${doc.title} - ${doc.status}`
).join("\n")}
...
`;
```

### API调用
```typescript
// 调用OpenRouter API (DeepSeek免费模型)
const response = await fetch(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    })
  }
);
```

## 环境变量配置

### .env文件示例
```env
# 数据库
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Gemini API Key (系统默认)
GEMINI_API_KEY="AIzaSy..."
```

### 配置步骤
1. 复制 `.env.example` 为 `.env`
2. 填写 `GEMINI_API_KEY`
3. 重启开发服务器

## 注意事项

### API Key安全
- 不要将API Key提交到Git
- `.env` 文件已在 `.gitignore` 中
- 定期更换API Key
- 不要分享给他人

### API使用限制
- OpenRouter提供免费的DeepSeek模型
- 有请求频率限制，但对个人使用足够
- 建议用户使用个人API Key分散负载
- 系统key仅作为备用

### 对话质量
- AI回答基于资料名称和简介
- 无法提供具体内容细节
- 会引导用户查看详细信息
- 适合快速查询和导航

## 未来改进

可能的功能增强：
- [ ] 支持上传头像
- [ ] 支持更多AI模型
- [ ] 对话历史记录
- [ ] 导出对话记录
- [ ] 语音输入
- [ ] 多轮对话上下文
- [ ] 资料内容搜索
- [ ] 智能推荐

## 总结

新的个人主页提供了：
- 简洁的个人资料管理
- 强大的AI助手功能
- 灵活的API Key配置
- 良好的隐私保护

用户可以：
- 管理个人信息
- 与AI对话了解支部资料
- 使用个人或系统API Key
- 快速查询和导航

所有功能已完成开发并通过测试，可以正常使用！

## API Key填写位置

**请在以下位置填写你的OpenRouter API Key：**

1. **系统默认Key（推荐）**
   - 文件位置：项目根目录的 `.env` 文件
   - 配置项：`OPENROUTER_API_KEY="your-api-key-here"`
   - 用途：所有未设置个人key的用户共享使用

2. **个人Key（可选）**
   - 位置：个人主页 → 点击"设置 API Key"按钮
   - 用途：仅该用户使用，优先级高于系统key

**获取API Key：**
访问 https://openrouter.ai/keys

**使用的模型：**
DeepSeek R1 Free (`deepseek/deepseek-r1-0528:free`) - 完全免费的强大中文AI模型
