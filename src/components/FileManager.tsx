"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "./UI";

type FileItem = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploaderName: string;
};

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/upload");
      if (!res.ok) return;
      const data = await res.json();
      setFiles(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "上传失败");
      }
      const created = await res.json();
      setFiles((prev) => [created, ...prev]);
    } catch (err: any) {
      alert(err.message || "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">文件上传</h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            isLoading={uploading}
            className="text-sm"
          >
            上传文件
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        文件将保存到服务器的 public/uploads，并记录上传者。
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {files.length === 0 && (
          <div className="text-sm text-gray-400">暂无文件</div>
        )}
        {files.map((f) => (
          <div
            key={f.id}
            className="p-3 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white transition"
          >
            <div className="flex items-center justify-between gap-2">
              <a
                className="font-semibold text-gray-900 line-clamp-1 hover:text-brand-600"
                href={f.url}
                target="_blank"
                rel="noreferrer"
              >
                {f.filename}
              </a>
              <div className="text-xs text-gray-400">
                {new Date(f.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
              <span>类型: {f.mimeType || "未知"}</span>
              <span>大小: {(f.size / 1024).toFixed(1)} KB</span>
              <span>上传者: {f.uploaderName}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

