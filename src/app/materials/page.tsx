"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, Plus, User as UserIcon, Clock, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  creatorName: string;
  creatorId: string;
  materialCount: number;
}

export default function MaterialsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadCategories();
      loadCurrentUser();
    }
  }, [status]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("加载用户信息失败", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("加载板块失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      alert("请输入板块名称");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          description: categoryDesc.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "创建失败");
        return;
      }

      setCategoryName("");
      setCategoryDesc("");
      setShowModal(false);
      loadCategories();
    } catch (error) {
      alert("创建失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadCategories();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDeleteCategory = (category: Category) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || category.creatorId === currentUser.id;
  };

  const openDeleteDialog = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">学习园地</h2>
            <p className="text-gray-500 mt-1">按板块浏览学习资料</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4 mr-2" /> 添加板块
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-brand-500 relative group"
              onClick={() => router.push(`/materials/${cat.id}`)}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3 h-3" />
                    <span>创建者: {cat.creatorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    <span>{cat.materialCount} 个文件</span>
                  </div>
                </div>
              </div>
              {canDeleteCategory(cat) && (
                <button
                  onClick={(e) => openDeleteDialog(e, cat)}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  title="删除板块"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无板块，点击上方按钮创建第一个板块</p>
          </div>
        )}
      </main>

      {/* 创建板块弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900">创建新板块</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  板块名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="例如：土力学"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">基本介绍</label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="简要介绍此板块的内容..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowModal(false);
                  setCategoryName("");
                  setCategoryDesc("");
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateCategory}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={submitting}
              >
                确认
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        title="删除板块"
        description="您确定要删除此板块吗？板块中的所有文件也将被删除。"
        itemName={categoryToDelete?.name}
      />
    </div>
  );
}

