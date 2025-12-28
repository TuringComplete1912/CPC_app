"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Plus, User as UserIcon, Clock, Edit, Trash2, Users, FileDown, Upload } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import PDFExportModal from "@/components/PDFExportModal";
import UserBadge from "@/components/UserBadge";

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

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pdfExportDoc, setPdfExportDoc] = useState<Document | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      loadDocuments();
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

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("加载文档失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      const res = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadDocuments();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDelete = (doc: Document) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || doc.author.id === currentUser.id;
  };

  const canEdit = (doc: Document) => {
    return doc.status === "draft";
  };

  const openDeleteDialog = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handlePDFExport = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setPdfExportDoc(doc);
  };

  const handleUploadPDF = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("上传失败");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("只支持PDF格式文件");
        return;
      }
      setImportFile(file);
      if (!importTitle) {
        // 移除.pdf扩展名作为默认标题
        const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
        setImportTitle(nameWithoutExt);
      }
    }
  };

  const handleImportPDF = async () => {
    if (!importFile) {
      alert("请选择PDF文件");
      return;
    }
    if (!importTitle.trim()) {
      alert("请输入文档标题");
      return;
    }

    setImporting(true);
    try {
      // 读取PDF文件内容（这里简化处理，实际可以使用pdf.js解析）
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = `[已导入PDF文件: ${importFile.name}]\n\n此文档从PDF导入，请编辑添加内容。`;
        
        // 创建文档
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: importTitle.trim(),
            content: content,
            status: "draft"
          })
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.message || "导入失败");
          return;
        }

        const newDoc = await res.json();

        // 上传PDF作为附件
        const formData = new FormData();
        formData.append("file", importFile);
        
        const uploadRes = await fetch(`/api/documents/${newDoc.id}/attachments`, {
          method: "POST",
          body: formData
        });

        if (!uploadRes.ok) {
          console.error("附件上传失败");
        }

        setImportTitle("");
        setImportFile(null);
        setShowImportModal(false);
        loadDocuments();
        
        // 跳转到新创建的文档编辑页面
        router.push(`/documents/${newDoc.id}`);
      };
      reader.readAsText(importFile);
    } catch (error) {
      console.error("导入失败:", error);
      alert("导入失败，请稍后重试");
    } finally {
      setImporting(false);
    }
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
            <h2 className="text-2xl font-bold text-gray-900">近期文档</h2>
            <p className="text-gray-500 mt-1">查看和编辑支部文档</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-4 h-4 mr-2" /> 导入PDF
            </Button>
            <Button
              onClick={() => router.push("/documents/new")}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <Plus className="w-4 h-4 mr-2" /> 新建文档
            </Button>
          </div>
        </header>

        <div className="space-y-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{doc.title}</h3>
                    <Badge
                      className={
                        doc.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }
                    >
                      {doc.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </div>

                  <p className="text-gray-600 line-clamp-2">
                    {doc.content.substring(0, 150)}
                    {doc.content.length > 150 && "..."}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>作者: </span>
                      <UserBadge userId={doc.author.id} userName={doc.author.name} showClass={false} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {doc.status === "published" && doc.publishedAt
                          ? new Date(doc.publishedAt).toLocaleString("zh-CN")
                          : new Date(doc.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {doc.editors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {doc.status === "published"
                            ? `参与编辑: ${doc.editors.map((e) => e.name).join(", ")}`
                            : `${doc.editors.length} 人编辑中`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handlePDFExport(e, doc)}
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                    title="导出PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  {canEdit(doc) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/documents/${doc.id}`);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(doc) && (
                    <button
                      onClick={(e) => openDeleteDialog(e, doc)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无文档，点击上方按钮创建第一个文档</p>
          </div>
        )}
      </main>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleDelete}
        title="删除文档"
        description="您确定要删除此文档吗？"
        itemName={documentToDelete?.title}
      />

      {pdfExportDoc && (
        <PDFExportModal
          title={pdfExportDoc.title}
          content={pdfExportDoc.content}
          onClose={() => setPdfExportDoc(null)}
          onUpload={handleUploadPDF}
        />
      )}

      {/* 导入PDF弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900">导入PDF文档</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  文档标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="请输入文档标题"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  选择PDF文件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {importFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    已选择: {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  仅支持PDF格式 | 文件将作为附件保存
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportTitle("");
                  setImportFile(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleImportPDF}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                isLoading={importing}
              >
                导入
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
