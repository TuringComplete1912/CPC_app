"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Plus, User as UserIcon, Clock, Edit, Trash2, Users, FileDown } from "lucide-react";
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
          <Button
            onClick={() => router.push("/documents/new")}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="w-4 h-4 mr-2" /> 新建文档
          </Button>
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
    </div>
  );
}
