"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save, Send, Users } from "lucide-react";
import { Button } from "@/components/UI";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";

interface Document {
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
}

export default function DocumentEditPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  const { data: session, status } = useSession({ required: true });
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && documentId) {
      loadDocument();
    }
  }, [status, documentId]);

  const loadDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setDocument(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      console.error("加载文档失败", error);
      alert("文档不存在或已被删除");
      router.push("/documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status: "draft" })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "保存失败");
        return;
      }

      alert("保存成功");
      loadDocument();
    } catch (error) {
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status: "published" })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "发布失败");
        return;
      }

      alert("发布成功");
      router.push("/documents");
    } catch (error) {
      alert("发布失败，请稍后重试");
    } finally {
      setSaving(false);
      setShowPublishConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">文档不存在</p>
          <Button onClick={() => router.push("/documents")}>返回列表</Button>
        </div>
      </div>
    );
  }

  const isPublished = document.status === "published";
  const canEdit = !isPublished;

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

          {canEdit && (
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                variant="secondary"
                isLoading={saving}
              >
                <Save className="w-4 h-4 mr-2" /> 保存草稿
              </Button>
              <Button
                onClick={() => setShowPublishConfirm(true)}
                className="bg-brand-600 hover:bg-brand-700"
                isLoading={saving}
              >
                <Send className="w-4 h-4 mr-2" /> 发布
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* 文档信息 */}
          {isPublished && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✓ 此文档已发布，无法再编辑
              </p>
              {document.editors.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                  <Users className="w-4 h-4" />
                  <span>
                    参与编辑: {document.editors.map((e) => e.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isPublished && document.editors.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Users className="w-4 h-4" />
                <span>
                  协作编辑中: {document.editors.map((e) => e.name).join(", ")}
                </span>
              </div>
            </div>
          )}

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPublished}
              className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="请输入文档标题"
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
              disabled={isPublished}
              placeholder="开始编写文档内容..."
            />
          </div>
        </div>
      </main>

      {/* 发布确认对话框 */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">确认发布</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                您确定要发布此文档吗？
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ 注意：发布后将无法再修改内容！
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPublishConfirm(false)}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handlePublish}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={saving}
              >
                确认发布
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
