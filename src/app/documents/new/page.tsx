"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/UI";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";

export default function NewDocumentPage() {
  const router = useRouter();
  useSession({ required: true });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status: "draft" })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "创建失败");
        return;
      }

      const data = await res.json();
      router.push(`/documents/${data.id}`);
    } catch (error) {
      alert("创建失败，请稍后重试");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/documents")}
            className="text-gray-600 hover:text-brand-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
          </Button>

          <Button
            onClick={handleCreate}
            className="bg-brand-600 hover:bg-brand-700"
            isLoading={creating}
          >
            <Save className="w-4 h-4 mr-2" /> 创建文档
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">新建文档</h2>
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="请输入文档标题"
              autoFocus
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="开始编写文档内容..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 提示：文档将保存为草稿，所有人都可以协作编辑。发布后将无法再修改。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
