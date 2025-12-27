"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Clock, Plus, User as UserIcon, Edit, Trash2, Users, FileDown } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import PDFExportModal from "@/components/PDFExportModal";
import UserBadge from "@/components/UserBadge";

interface WorkLog {
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

export default function WorkLogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workLogToDelete, setWorkLogToDelete] = useState<WorkLog | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pdfExportLog, setPdfExportLog] = useState<WorkLog | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadWorkLogs();
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

  const loadWorkLogs = async () => {
    try {
      const res = await fetch("/api/worklogs");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setWorkLogs(data);
    } catch (error) {
      console.error("加载活动日志失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workLogToDelete) return;

    try {
      const res = await fetch(`/api/worklogs/${workLogToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadWorkLogs();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDelete = (log: WorkLog) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || log.author.id === currentUser.id;
  };

  const canEdit = (log: WorkLog) => {
    return log.status === "draft";
  };

  const openDeleteDialog = (e: React.MouseEvent, log: WorkLog) => {
    e.stopPropagation();
    setWorkLogToDelete(log);
    setDeleteDialogOpen(true);
  };

  const handlePDFExport = (e: React.MouseEvent, log: WorkLog) => {
    e.stopPropagation();
    setPdfExportLog(log);
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
            <h2 className="text-2xl font-bold text-gray-900">活动日志</h2>
            <p className="text-gray-500 mt-1">记录和查看支部活动</p>
          </div>
          <Button
            onClick={() => router.push("/worklogs/new")}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="w-4 h-4 mr-2" /> 新建活动日志
          </Button>
        </header>

        <div className="space-y-4">
          {workLogs.map((log) => (
            <Card
              key={log.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
              onClick={() => router.push(`/worklogs/${log.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{log.title}</h3>
                    <Badge
                      className={
                        log.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }
                    >
                      {log.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </div>

                  <p className="text-gray-600 line-clamp-2">
                    {log.content.substring(0, 150)}
                    {log.content.length > 150 && "..."}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>作者: </span>
                      <UserBadge userId={log.author.id} userName={log.author.name} showClass={false} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {log.status === "published" && log.publishedAt
                          ? new Date(log.publishedAt).toLocaleString("zh-CN")
                          : new Date(log.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {log.editors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {log.status === "published"
                            ? `参与编辑: ${log.editors.map((e) => e.name).join(", ")}`
                            : `${log.editors.length} 人编辑中`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handlePDFExport(e, log)}
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                    title="导出PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  {canEdit(log) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/worklogs/${log.id}`);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(log) && (
                    <button
                      onClick={(e) => openDeleteDialog(e, log)}
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

        {workLogs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无活动日志，点击上方按钮创建第一个活动日志</p>
          </div>
        )}
      </main>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWorkLogToDelete(null);
        }}
        onConfirm={handleDelete}
        title="删除活动日志"
        description="您确定要删除此活动日志吗？"
        itemName={workLogToDelete?.title}
      />

      {pdfExportLog && (
        <PDFExportModal
          title={pdfExportLog.title}
          content={pdfExportLog.content}
          onClose={() => setPdfExportLog(null)}
          onUpload={handleUploadPDF}
        />
      )}
    </div>
  );
}
