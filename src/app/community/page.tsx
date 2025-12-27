"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquare, Plus, User as UserIcon, Clock, Trash2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import UserBadge from "@/components/UserBadge";

interface Topic {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  answerCount: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadTopics();
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

  const loadTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setTopics(data);
    } catch (error) {
      console.error("加载话题失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!title.trim()) {
      alert("请输入话题标题");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "创建失败");
        return;
      }

      setTitle("");
      setDescription("");
      setShowModal(false);
      loadTopics();
    } catch (error) {
      alert("创建失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;

    try {
      const res = await fetch(`/api/topics/${topicToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadTopics();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDelete = (topic: Topic) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || topic.author.id === currentUser.id;
  };

  const openDeleteDialog = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    setTopicToDelete(topic);
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
            <h2 className="text-2xl font-bold text-gray-900">社区</h2>
            <p className="text-gray-500 mt-1">分享交流，共同进步</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="w-4 h-4 mr-2" /> 添加话题
          </Button>
        </header>

        <div className="space-y-4">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
              onClick={() => router.push(`/community/${topic.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {topic.title}
                    </h3>
                  </div>

                  {topic.description && (
                    <p className="text-gray-600 line-clamp-2">{topic.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <UserBadge userId={topic.author.id} userName={topic.author.name} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(topic.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700">
                      {topic.answerCount} 个回答
                    </Badge>
                  </div>
                </div>

                {canDelete(topic) && (
                  <button
                    onClick={(e) => openDeleteDialog(e, topic)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="删除话题"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无话题，点击上方按钮创建第一个话题</p>
          </div>
        )}
      </main>

      {/* 创建话题弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900">添加话题</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  话题标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入话题标题"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  话题描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简要描述这个话题..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowModal(false);
                  setTitle("");
                  setDescription("");
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateTopic}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={submitting}
              >
                确认
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTopicToDelete(null);
        }}
        onConfirm={handleDelete}
        title="删除话题"
        description="您确定要删除此话题吗？话题下的所有回答也将被删除。"
        itemName={topicToDelete?.title}
      />
    </div>
  );
}
