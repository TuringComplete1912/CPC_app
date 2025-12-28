# 学习资料下载功能修复

## 问题描述
用户在下载上传的学习资料时出现请求错误，无法正常下载文件。

## 问题原因
1. 直接使用 `fileUrl` 路径（如 `/uploads/文件名.pdf`）下载文件
2. 文件名包含中文字符时，浏览器无法正确处理编码
3. Next.js 的静态文件服务对中文文件名支持不完善

## 解决方案

### 1. 创建专用下载API
创建了 `/api/materials/[id]/download` API 端点来处理文件下载：

**功能特点：**
- 通过材料ID获取文件信息
- 正确处理中文文件名编码（使用 `filename*=UTF-8''` 格式）
- 自动识别文件类型并设置正确的 MIME 类型
- 支持多种文件格式（PDF、DOC、PPT、ZIP等）
- 返回正确的 Content-Disposition 头以触发浏览器下载

**文件路径：** `src/app/api/materials/[id]/download/route.ts`

### 2. 更新前端下载链接

#### 首页学习资料板块
**文件：** `src/app/page.tsx`
- 修改前：`href={mat.fileUrl}`
- 修改后：`href={/api/materials/${mat.id}/download}`

#### 学习资料详情页
**文件：** `src/app/materials/[id]/page.tsx`
- 修改前：`href={mat.fileUrl}`
- 修改后：`href={/api/materials/${mat.id}/download}`

#### 搜索结果页
**文件：** `src/app/search/page.tsx`
- 修改前：直接使用 `fileUrl` 创建下载链接
- 修改后：使用 `fetch` API 调用下载端点，正确处理响应头中的文件名

**新的下载函数：**
```typescript
const handleDownload = async (materialId: string) => {
  const response = await fetch(`/api/materials/${materialId}/download`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // 从响应头获取
  a.click();
};
```

## 技术细节

### 文件名编码
使用 RFC 5987 标准的 `filename*=UTF-8''` 格式：
```typescript
"Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`
```

### 支持的文件类型
- 文档：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- 压缩包：ZIP, RAR
- 图片：JPG, JPEG, PNG, GIF
- 视频：MP4
- 音频：MP3

### MIME 类型映射
API 根据文件扩展名自动设置正确的 MIME 类型，确保浏览器正确处理文件。

## 测试建议

1. **测试中文文件名下载**
   - 上传包含中文名称的PDF文件
   - 点击下载按钮
   - 验证下载的文件名是否正确

2. **测试不同文件类型**
   - 上传 PDF、PPT、ZIP 等不同格式的文件
   - 验证每种格式都能正常下载

3. **测试不同位置的下载**
   - 首页学习资料板块
   - 学习资料详情页
   - 搜索结果页

## 构建状态
✅ 代码已通过编译检查
✅ 无 TypeScript 类型错误
✅ 构建成功

## 下一步
请测试下载功能是否正常工作。如果仍有问题，请提供具体的错误信息。
