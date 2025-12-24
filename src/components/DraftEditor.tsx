"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input } from "./UI";

const STORAGE_KEY = "user_draft_content";

export default function DraftEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<
    { id: string; title: string; content: string; createdAt: string }[]
  >([]);
  const hydratedRef = useRef(false);

  // 初始化时从 localStorage 读取草稿
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { title: string; content: string };
        setTitle(parsed.title || "");
        setContent(parsed.content || "");
      } catch {
        // 兼容老数据（非 JSON 字符串）
        setContent(cached);
      }
    }
    hydratedRef.current = true;
  }, []);

  // 输入变化时立即写入 localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    const payload = JSON.stringify({ title, content });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [title, content]);

  // 拉取历史提交
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/worklogs");
        if (!res.ok) return;
        const data = await res.json();
        setHistory(
          data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            createdAt: item.createdAt
          }))
        );
      } catch {
        // ignore
      }
    };
    loadHistory();
  }, []);

  const handleSubmit = () => {
    if (submitting) return;
    const payload = { title: title.trim(), content: content.trim() };
    if (!payload.title || !payload.content) {
      alert("标题和内容不能为空");
      return;
    }

    setSubmitting(true);
    fetch("/api/worklogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg.message || "提交失败");
        }
        return res.json();
      })
      .then((created) => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
        setTitle("");
        setContent("");
        setHistory((prev) => [created, ...prev]);
        alert("提交成功");
      })
      .catch((err: any) => {
        alert(err.message || "提交失败");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" />
        您的内容正在自动保存至本地
      </div>
      <div className="space-y-3">
        <Input
          placeholder="请输入标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white"
        />
        <textarea
          className="w-full min-h-[220px] rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
          placeholder="输入正文内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <Button onClick={handleSubmit} className="bg-brand-600 hover:bg-brand-700" isLoading={submitting}>
        提交存档
      </Button>
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <div className="text-sm font-semibold text-gray-900">我的历史提交记录</div>
        {history.length === 0 && <div className="text-sm text-gray-400">暂无提交记录。</div>}
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-gray-900 line-clamp-1">{item.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

