"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Upload, Download, User as UserIcon, Clock, FileText, Trash2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface Material {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploaderName: string;
  uploaderId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  creatorName: string;
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { data: session, status } = useSession({ required: true });
  const [category, setCategory] = useState<Category | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && categoryId) {
      loadData();
      loadCurrentUser();
    }
  }, [status, categoryId]);

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

  const loadData = async () => {
    try {
      // 加载板块信息
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const cats = await catRes.json();
        const found = cats.find((c: any) => c.id === categoryId);
        if (found) setCategory(found);
      }

      // 加载资料列表
      const matRes = await fetch(`/api/categories/${categoryId}/materials`);
      if (matRes.ok) {
        const data = await matRes.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert("请选择文件");
      return;
    }
    if (!uploadTitle.trim()) {
      alert("请输入标题");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());

      const res = await fetch(`/api/categories/${categoryId}/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "上传失败");
        return;
      }

      setUploadTitle("");
      setUploadFile(null);
      setShowUploadModal(false);
      loadData();
    } catch (error) {
      alert("上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      const res = await fetch(`/api/materials/${materialToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadData();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDeleteMaterial = (material: Material) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || material.uploaderId === currentUser.id;
  };

  const openDeleteDialog = (e: React.MouseEvent, material: Material) => {
    e.preventDefault();
    e.stopPropagation();
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">板块不存在</p>
          <Button onClick={() => router.push("/materials")}>返回列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/materials")}
            className="text-gray-600 hover:text-brand-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回板块列表
          </Button>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-500">{category.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
            <span>创建者: {category.creatorName}</span>
            <span>•</span>
            <span>{materials.length} 个文件</span>
          </div>
        </header>

        <div className="mb-6">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Upload className="w-4 h-4 mr-2" /> 上传文件
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <Card key={mat.id} className="p-4 hover:shadow-md transition-shadow relative group">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">
                    {mat.title}
                  </h4>
                  <Badge
                    className={
                      mat.fileType === "video"
                        ? "bg-red-50 text-red-700"
                        : mat.fileType === "image"
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                    }
                  >
                    {mat.fileType === "video" ? "视频" : mat.fileType === "image" ? "图片" : "文档"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    <span>上传者: {mat.uploaderName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(mat.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{formatFileSize(mat.fileSize)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <a
                    href={mat.fileUrl}
                    download
                    className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Download className="w-4 h-4" /> 下载
                  </a>
                  {canDeleteMaterial(mat) && (
                    <button
                      onClick={(e) => openDeleteDialog(e, mat)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除文件"
                    >
                      <Trash2 className="w-4 h-4" /> 删除
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {materials.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>此板块暂无文件，点击上方按钮上传第一个文件</p>
          </div>
        )}
      </main>

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900">上传文件</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="请输入文件标题"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  选择文件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {uploadFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    已选择: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  普通用户限制: 50MB，管理员无限制
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadTitle("");
                  setUploadFile(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={uploading}
              >
                确定
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
          setMaterialToDelete(null);
        }}
        onConfirm={handleDeleteMaterial}
        title="删除文件"
        description="您确定要删除此文件吗？文件将从服务器永久删除。"
        itemName={materialToDelete?.title}
      />
    </div>
  );
}

