# 文档功能更新说明

## 更新内容

### 1. 修复下载文件格式问题 ✅

**问题：** 下载的文件格式与上传时不一致

**解决方案：**
- 修改下载API，从实际文件路径（`fileUrl`）中提取真实的文件扩展名
- 确保下载的文件名包含正确的扩展名
- 如果用户设置的标题没有扩展名或扩展名错误，自动添加/修正为正确的扩展名

**示例：**
- 上传文件：`钢结构设计原理.pdf`
- 用户标题：`钢结构设计原理` 或 `钢结构设计原理.doc`（错误）
- 下载文件：`钢结构设计原理.pdf`（自动修正）

**修改文件：** `src/app/api/materials/[id]/download/route.ts`

### 2. 文档页面添加PDF导入功能 ✅

**功能描述：**
在"近期文档"页面添加"导入PDF"按钮，允许用户导入PDF文件作为文档。

**功能特点：**
- 只支持PDF格式文件
- 用户可以自定义文档标题
- PDF文件作为附件保存到文档中
- 导入后自动跳转到文档编辑页面
- 用户可以继续编辑文档内容

**使用流程：**
1. 点击"导入PDF"按钮
2. 输入文档标题
3. 选择PDF文件（自动验证格式）
4. 点击"导入"
5. 系统创建草稿文档并上传PDF作为附件
6. 自动跳转到文档编辑页面

**UI设计：**
- 导入按钮：紫色（`bg-purple-600`），与新建文档按钮并列
- 弹窗包含标题输入框和文件选择器
- 显示文件大小和格式提示
- 加载状态显示

**修改文件：** `src/app/documents/page.tsx`

**相关API：**
- 创建文档：`POST /api/documents`
- 上传附件：`POST /api/documents/[id]/attachments`

## 技术实现细节

### 下载文件格式修正逻辑

```typescript
// 从 fileUrl 中提取实际文件的扩展名
const actualFileExt = path.extname(material.fileUrl).toLowerCase();

// 确保下载的文件名包含正确的扩展名
let downloadFileName = material.title;
const titleExt = path.extname(material.title).toLowerCase();

// 如果 title 没有扩展名，或者扩展名与实际文件不匹配
if (!titleExt || titleExt !== actualFileExt) {
  const titleWithoutExt = titleExt ? material.title.slice(0, -titleExt.length) : material.title;
  downloadFileName = titleWithoutExt + actualFileExt;
}
```

### PDF导入流程

```typescript
1. 用户选择PDF文件 → 验证格式
2. 创建草稿文档 → POST /api/documents
3. 上传PDF作为附件 → POST /api/documents/[id]/attachments
4. 跳转到编辑页面 → router.push(`/documents/${newDoc.id}`)
```

## 文件限制

### 学习资料上传
- 支持格式：PDF、PPT、PPTX、ZIP
- 文件大小：普通用户 50MB

### 文档PDF导入
- 支持格式：仅PDF
- 文件大小：50MB
- 附件存储路径：`public/uploads/documents/`

## 构建状态
✅ 代码已通过编译检查
✅ 无 TypeScript 类型错误
✅ 构建成功

## 测试建议

### 测试下载格式修正
1. 上传一个PDF文件，标题不带扩展名（如"测试文档"）
2. 下载文件，验证下载的文件名是否为"测试文档.pdf"
3. 上传一个ZIP文件，标题带错误扩展名（如"资料包.pdf"）
4. 下载文件，验证下载的文件名是否自动修正为"资料包.zip"

### 测试PDF导入功能
1. 进入"近期文档"页面
2. 点击"导入PDF"按钮
3. 输入标题，选择PDF文件
4. 点击"导入"
5. 验证是否跳转到编辑页面
6. 验证文档是否创建成功
7. 检查附件是否上传成功

### 测试格式验证
1. 尝试导入非PDF文件（如.docx）
2. 验证是否显示"只支持PDF格式文件"提示
3. 验证文件选择器是否只显示PDF文件

## 注意事项

1. **文件名编码**：所有文件名都使用UTF-8编码，支持中文
2. **附件存储**：文档附件存储在 `public/uploads/documents/` 目录
3. **学习资料存储**：学习资料存储在 `public/uploads/` 目录
4. **文件大小限制**：所有上传都有50MB限制
5. **PDF导入**：导入的PDF作为附件保存，文档内容需要用户手动编辑
