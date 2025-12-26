"use client";

import { useState } from "react";
import { X, Download, Upload, Eye, Edit3, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card } from "./UI";
import jsPDF from "jspdf";

interface PDFExportModalProps {
  title: string;
  content: string;
  onClose: () => void;
  onUpload?: (file: File) => Promise<void>;
}

export default function PDFExportModal({
  title,
  content,
  onClose,
  onUpload
}: PDFExportModalProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState("");
  const [reasoningContent, setReasoningContent] = useState(""); // 保存思考过程
  const [showReasoning, setShowReasoning] = useState(false); // 是否显示思考过程
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 优化排版
  const handleOptimize = async () => {
    setOptimizing(true);
    setProgress(0);
    setOptimizedContent("");
    setReasoningContent("");
    setEditedContent("");

    try {
      const res = await fetch("/api/pdf/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, stream: true })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "优化失败");
        return;
      }

      // 处理流式响应
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedReasoning = "";
      let currentProgress = 0;
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 150;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setProgress(100);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content || "";
                const reasoning = parsed.choices?.[0]?.delta?.reasoning || "";

                currentProgress = Math.min(currentProgress + 1, 95);

                // 收集思考过程
                if (reasoning) {
                  accumulatedReasoning += reasoning;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    setProgress(currentProgress);
                    setReasoningContent(accumulatedReasoning);
                    setOptimizedContent(`💭 学六小助手正在思考如何优化排版...\n\n${accumulatedReasoning}`);
                    lastUpdateTime = now;
                  }
                }

                // 显示优化后的内容
                if (deltaContent) {
                  accumulatedContent += deltaContent;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    setProgress(currentProgress);
                    setOptimizedContent(accumulatedContent);
                    setEditedContent(accumulatedContent);
                    lastUpdateTime = now;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        
        // 最后一次更新
        setOptimizedContent(accumulatedContent);
        setEditedContent(accumulatedContent);
        setReasoningContent(accumulatedReasoning);
      }

      setProgress(100);
    } catch (error) {
      alert("优化失败，请稍后重试");
    } finally {
      setOptimizing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // 生成PDF
  const generatePDF = (contentToUse: string): Blob => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    doc.setFont("helvetica");
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // 添加标题
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 10;
    });

    yPosition += 5;

    // 添加内容
    doc.setFontSize(12);
    const lines = contentToUse.split("\n");
    
    lines.forEach((line) => {
      if (line.startsWith("# ")) {
        doc.setFontSize(18);
        line = line.substring(2);
      } else if (line.startsWith("## ")) {
        doc.setFontSize(16);
        line = line.substring(3);
      } else if (line.startsWith("### ")) {
        doc.setFontSize(14);
        line = line.substring(4);
      } else {
        doc.setFontSize(12);
      }

      const textLines = doc.splitTextToSize(line || " ", maxWidth);
      textLines.forEach((textLine: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += 7;
      });
    });

    return doc.output("blob");
  };

  // 下载PDF
  const handleDownload = () => {
    const contentToUse = editMode ? editedContent : (optimizedContent || content);
    const pdfBlob = generatePDF(contentToUse);
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 上传PDF
  const handleUploadPDF = async () => {
    if (!onUpload) return;

    setUploading(true);
    try {
      const contentToUse = editMode ? editedContent : (optimizedContent || content);
      const pdfBlob = generatePDF(contentToUse);
      const file = new File([pdfBlob], `${title}.pdf`, { type: "application/pdf" });
      await onUpload(file);
      alert("上传成功！");
      onClose();
    } catch (error) {
      alert("上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">导出PDF</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 优化按钮 */}
          {!optimizedContent && !optimizing && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                使用学六小助手优化文档排版，使其更适合PDF导出
              </p>
              <Button
                onClick={handleOptimize}
                className="bg-brand-600 hover:bg-brand-700"
              >
                开始优化排版
              </Button>
            </div>
          )}

          {/* 优化中 */}
          {optimizing && (
            <div className="py-8">
              <div className="text-center mb-4">
                <Loader2 className="w-8 h-8 mx-auto text-brand-600 animate-spin mb-2" />
                <p className="text-gray-700 font-medium">学六小助手正在优化排版...</p>
              </div>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">{progress}%</p>
              </div>
              {optimizedContent && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto scroll-smooth">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{optimizedContent}</p>
                </div>
              )}
            </div>
          )}

          {/* 预览/编辑区 */}
          {optimizedContent && !optimizing && (
            <>
              {/* 思考过程（可折叠） */}
              {reasoningContent && (
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-medium">💭 查看学六小助手的思考过程</span>
                      <span className="text-xs text-blue-600">({reasoningContent.length} 字)</span>
                    </div>
                    {showReasoning ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                  {showReasoning && (
                    <div className="p-4 bg-white border-t border-blue-200 max-h-[300px] overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {reasoningContent}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditMode(false)}
                    variant={!editMode ? "primary" : "secondary"}
                    className="text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" /> 预览
                  </Button>
                  <Button
                    onClick={() => setEditMode(true)}
                    variant={editMode ? "primary" : "secondary"}
                    className="text-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-1" /> 编辑
                  </Button>
                </div>
              </div>

              {editMode ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                  placeholder="编辑内容..."
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-96">
                  <h1 className="text-2xl font-bold mb-4">{title}</h1>
                  <div className="prose max-w-none">
                    {editedContent.split("\n").map((line, idx) => {
                      if (line.startsWith("# ")) {
                        return <h1 key={idx} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                      } else if (line.startsWith("## ")) {
                        return <h2 key={idx} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
                      } else if (line.startsWith("### ")) {
                        return <h3 key={idx} className="text-base font-bold mt-2 mb-1">{line.substring(4)}</h3>;
                      } else if (line.trim() === "") {
                        return <br key={idx} />;
                      } else {
                        return <p key={idx} className="mb-2">{line}</p>;
                      }
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部操作 */}
        {optimizedContent && !optimizing && (
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" /> 保存到本地
            </Button>
            {onUpload && (
              <Button
                onClick={handleUploadPDF}
                isLoading={uploading}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                <Upload className="w-4 h-4 mr-2" /> 一键上传
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
