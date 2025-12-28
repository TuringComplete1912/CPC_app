# 学习园地添加 7Z 格式支持

## 更新内容

### 支持 .7z 高压缩比文件格式 ✅

**功能描述：**
在学习园地的文件上传功能中添加了对 .7z 格式的支持，用户现在可以上传高压缩比的 7z 压缩文件。

## 修改详情

### 1. 前端文件选择器更新
**文件：** `src/app/materials/[id]/page.tsx`

**修改内容：**
- 文件选择器 `accept` 属性添加 `.7z`
- 提示文本更新为："支持格式: PDF、PPT、ZIP、7Z"
- 文件类型徽章智能识别：根据文件名自动显示 "7Z" 或 "ZIP"

```typescript
// 文件选择器
accept=".pdf,.ppt,.pptx,.zip,.7z"

// 智能显示徽章
{mat.fileType === "archive" 
  ? (mat.title.toLowerCase().endsWith('.7z') ? "7Z" : "ZIP")
  : "PDF"}
```

### 2. 上传API验证更新
**文件：** `src/app/api/categories/[id]/upload/route.ts`

**修改内容：**
- 允许的 MIME 类型添加 `application/x-7z-compressed`
- 允许的文件扩展名添加 `.7z`
- 文件类型识别逻辑更新，支持 7z 文件归类为 "archive"
- 错误提示更新为："只支持上传PDF、PPT、ZIP和7Z文件"

```typescript
const allowedTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed"  // 新增
];

const allowedExtensions = [".pdf", ".ppt", ".pptx", ".zip", ".7z"];  // 新增 .7z
```

### 3. 下载API MIME类型更新
**文件：** `src/app/api/materials/[id]/download/route.ts`

**修改内容：**
- MIME 类型映射表添加 7z 格式
- 确保 7z 文件下载时使用正确的 Content-Type

```typescript
const mimeTypes: Record<string, string> = {
  // ... 其他类型
  ".zip": "application/zip",
  ".7z": "application/x-7z-compressed",  // 新增
  ".rar": "application/x-rar-compressed",
  // ...
};
```

## 功能特点

### 7Z 格式优势
- **高压缩比**：7z 格式通常比 ZIP 提供更高的压缩率
- **大文件支持**：适合压缩大型课程资料和文档集合
- **开源格式**：7-Zip 是开源软件，广泛使用

### 文件类型归类
- 7Z 文件归类为 "archive"（压缩包）类型
- 与 ZIP、RAR 使用相同的紫色徽章显示
- 徽章文本智能显示 "7Z" 或 "ZIP"

### 上传限制
- 普通用户：最大 50MB
- 管理员：无限制
- 支持的压缩格式：ZIP、7Z

## 使用示例

### 上传 7Z 文件
1. 进入学习园地的某个板块
2. 点击"上传文件"按钮
3. 选择 .7z 格式的压缩文件
4. 输入文件标题
5. 点击"确定"上传

### 下载 7Z 文件
1. 在文件列表中找到 7Z 文件（显示紫色 "7Z" 徽章）
2. 点击"下载"按钮
3. 文件以正确的 .7z 扩展名下载

## 支持的文件格式总览

### 学习园地支持的格式
| 格式 | 类型 | 徽章颜色 | 用途 |
|------|------|----------|------|
| PDF | document | 蓝色 | 文档、讲义 |
| PPT/PPTX | presentation | 橙色 | 演示文稿 |
| ZIP | archive | 紫色 | 压缩包 |
| 7Z | archive | 紫色 | 高压缩比压缩包 |

### MIME 类型映射
```
.7z  → application/x-7z-compressed
.zip → application/zip
.pdf → application/pdf
.ppt → application/vnd.ms-powerpoint
.pptx → application/vnd.openxmlformats-officedocument.presentationml.presentation
```

## 技术细节

### 文件验证逻辑
```typescript
// 同时检查 MIME 类型和文件扩展名
const hasValidType = allowedTypes.some(type => mime.includes(type));
const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

if (!hasValidType && !hasValidExtension) {
  return NextResponse.json({ message: "格式不支持" }, { status: 400 });
}
```

### 文件类型识别
```typescript
// 根据 MIME 类型和文件名判断
if (mime.includes("zip") || mime.includes("7z") || 
    fileName.endsWith(".zip") || fileName.endsWith(".7z")) {
  fileTypeCategory = "archive";
}
```

## 构建状态
✅ 代码已通过编译检查
✅ 无 TypeScript 类型错误
✅ 构建成功

## 测试建议

### 基本功能测试
1. **上传测试**
   - 上传一个 .7z 文件
   - 验证文件是否成功上传
   - 检查文件列表中是否显示 "7Z" 徽章

2. **下载测试**
   - 下载上传的 7z 文件
   - 验证下载的文件扩展名是否为 .7z
   - 验证文件是否可以正常解压

3. **格式验证测试**
   - 尝试上传不支持的格式（如 .exe）
   - 验证是否显示正确的错误提示

### 边界情况测试
1. **大文件测试**
   - 上传接近 50MB 的 7z 文件
   - 验证普通用户的大小限制

2. **中文文件名测试**
   - 上传包含中文名称的 7z 文件
   - 验证下载时文件名是否正确

3. **混合格式测试**
   - 在同一板块上传 ZIP 和 7Z 文件
   - 验证徽章是否正确区分显示

## 注意事项

1. **浏览器兼容性**：所有现代浏览器都支持 7z 文件的下载
2. **解压软件**：用户需要安装 7-Zip 或其他支持 7z 格式的解压软件
3. **压缩建议**：对于大型文件集合，推荐使用 7z 格式以获得更好的压缩率
4. **文件命名**：建议在文件名中明确标注是 7z 格式，方便用户识别
