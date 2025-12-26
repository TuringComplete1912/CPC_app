"use client";

import { X, Download, Users, Clock, User as UserIcon } from "lucide-react";
import { Button } from "./UI";

interface DocumentDetailModalProps {
  document: {
    id: string;
    title: string;
    content: string;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    author: {
      id: string;
      name: string;
    };
    editors: Array<{
      id: string;
      name: string;
      editedAt: string;
    }>;
  };
  onClose: () => void;
}

export default function DocumentDetailModal({
  document,
  onClose
}: DocumentDetailModalProps) {
  const handleDownloadPDF = () => {
    // 创建一个临时的打印窗口
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("请允许弹出窗口以下载PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${document.title}</title>
          <style>
            @page {
              margin: 2cm;
            }
            body {
              font-family: "Microsoft YaHei", "SimSun", sans-serif;
              line-height: 1.8;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #dc2626;
              border-bottom: 3px solid #dc2626;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f5f5f5;
              border-left: 4px solid #dc2626;
            }
            .meta-item {
              margin: 5px 0;
            }
            .content {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #999;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>${document.title}</h1>
          <div class="meta">
            <div class="meta-item"><strong>作者：</strong>${document.author.name}</div>
            <div class="meta-item"><strong>创建时间：</strong>${new Date(document.createdAt).toLocaleString("zh-CN")}</div>
            ${
              document.status === "published" && document.publishedAt
                ? `<div class="meta-item"><strong>发布时间：</strong>${new Date(document.publishedAt).toLocaleString("zh-CN")}</div>`
                : ""
            }
            ${
              document.editors.length > 0
                ? `<div class="meta-item"><strong>参与编辑：</strong>${document.editors.map((e) => e.name).join("、")}</div>`
                : ""
            }
          </div>
          <div class="content">${document.content.replace(/\n/g, "<br>")}</div>
          <div class="footer">
            学生第六党支部 · ${new Date().toLocaleDateString("zh-CN")}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // 等待内容加载完成后打印
    printWindow.onload = () => {
      printWindow.print();
      // 打印完成后关闭窗口
      setTimeout(() => {
        printWindow.close();
      }, 100);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>{document.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {document.status === "published" && document.publishedAt
                    ? new Date(document.publishedAt).toLocaleString("zh-CN")
                    : new Date(document.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              {document.editors.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {document.status === "published"
                      ? `参与编辑: ${document.editors.map((e) => e.name).join(", ")}`
                      : `${document.editors.length} 人编辑`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {document.content}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Download className="w-4 h-4 mr-2" /> 下载为PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
