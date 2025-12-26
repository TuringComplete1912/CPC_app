"use client";

import { useState } from "react";
import { Upload, File, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "./UI";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  disabled?: boolean;
  acceptTypes?: string;
  maxSize?: number;
}

export default function AttachmentUploader({
  attachments,
  onUpload,
  onDelete,
  disabled = false,
  acceptTypes = ".pdf",
  maxSize = 50
}: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      alert(`文件大小不能超过 ${maxSize}MB`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      e.target.value = "";
    } catch (error: any) {
      alert(error.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!confirm("确定要删除此附件吗？")) return;

    setDeleting(id);
    try {
      await onDelete(id);
    } catch (error: any) {
      alert(error.message || "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          PDF附件
        </label>
        {!disabled && (
          <div className="relative">
            <input
              type="file"
              accept={acceptTypes}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="attachment-upload"
            />
            <label
              htmlFor="attachment-upload"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                uploading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  上传PDF
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)} •{" "}
                    {new Date(attachment.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={attachment.url}
                  download
                  className="p-2 text-gray-600 hover:text-brand-600 hover:bg-white rounded transition-colors"
                  title="下载"
                >
                  <Download className="w-4 h-4" />
                </a>
                {onDelete && !disabled && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleting === attachment.id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    {deleting === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <File className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">暂无附件</p>
        </div>
      )}
    </div>
  );
}
