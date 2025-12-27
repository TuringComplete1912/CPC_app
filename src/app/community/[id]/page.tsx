"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, User as UserIcon, Clock, Trash2, ThumbsUp, MessageCircle } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import UserBadge from "@/components/UserBadge";

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  author: {
    id: string;
    name: string;
  };
  replies: Reply[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  answers: Answer[];
}

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params?.id as string;
  const { data: session, status } = useSession({ required: true });
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [answerToDelete, setAnswerToDelete] = useState<Answer | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "authenticated" && topicId) {
      loadTopic();
      loadCurrentUser();
    }
  }, [status, topicId]);

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

  const loadTopic = async () => {
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setTopic(data);
    } catch (error) {
      console.error("加载话题失败", error);
      alert("话题不存在或已被删除");
      router.push("/community");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      alert("请输入回答内容");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "提交失败");
        return;
      }

      setAnswerContent("");
      loadTopic();
    } catch (error) {
      alert("提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (answerId: string) => {
    try {
      const res = await fetch(`/api/answers/${answerId}/like`, {
        method: "POST"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "操作失败");
        return;
      }

      loadTopic();
    } catch (error) {
      alert("操作失败，请稍后重试");
    }
  };

  const handleSubmitReply = async (answerId: string) => {
    if (!replyContent.trim()) {
      alert("请输入回复内容");
      return;
    }

    try {
      const res = await fetch(`/api/answers/${answerId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "回复失败");
        return;
      }

      setReplyContent("");
      setReplyingTo(null);
      loadTopic();
    } catch (error) {
      alert("回复失败，请稍后重试");
    }
  };

  const toggleReplies = (answerId: string) => {
    const newShowReplies = new Set(showReplies);
    if (newShowReplies.has(answerId)) {
      newShowReplies.delete(answerId);
    } else {
      newShowReplies.add(answerId);
    }
    setShowReplies(newShowReplies);
  };

  const handleDeleteAnswer = async () => {
    if (!answerToDelete) return;

    try {
      const res = await fetch(`/api/answers/${answerToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "删除失败");
        return;
      }

      loadTopic();
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const canDeleteAnswer = (answer: Answer) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || answer.author.id === currentUser.id;
  };

  const openDeleteDialog = (e: React.MouseEvent, answer: Answer) => {
    e.stopPropagation();
    setAnswerToDelete(answer);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">话题不存在</p>
          <Button onClick={() => router.push("/community")}>返回社区</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/community")}
            className="text-gray-600 hover:text-brand-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回社区
          </Button>
        </div>

        {/* 话题信息 */}
        <Card className="p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{topic.title}</h1>
          {topic.description && (
            <p className="text-gray-600 mb-4">{topic.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>发起人: </span>
              <UserBadge userId={topic.author.id} userName={topic.author.name} />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(topic.createdAt).toLocaleString("zh-CN")}</span>
            </div>
            <Badge className="bg-blue-50 text-blue-700">
              {topic.answers.length} 个回答
            </Badge>
          </div>
        </Card>

        {/* 写回答 */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">写回答</h3>
          <textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="分享你的想法..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSubmitAnswer}
              className="bg-brand-600 hover:bg-brand-700"
              isLoading={submitting}
            >
              <Send className="w-4 h-4 mr-2" /> 提交回答
            </Button>
          </div>
        </Card>

        {/* 回答列表 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">
            全部回答 ({topic.answers.length})
            <span className="text-sm font-normal text-gray-500 ml-2">按点赞数排序</span>
          </h3>
          {topic.answers.map((answer) => (
            <Card key={answer.id} className="p-6 relative group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-brand-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <UserBadge userId={answer.author.id} userName={answer.author.name} />
                    <span className="text-xs text-gray-400">
                      {new Date(answer.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                    {answer.content}
                  </p>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(answer.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        answer.isLiked
                          ? "bg-brand-100 text-brand-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${answer.isLiked ? "fill-current" : ""}`} />
                      <span className="text-sm font-medium">{answer.likeCount}</span>
                    </button>
                    <button
                      onClick={() => toggleReplies(answer.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{answer.replies.length}</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(answer.id)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      回复
                    </button>
                  </div>

                  {/* 回复输入框 */}
                  {replyingTo === answer.id && (
                    <div className="mt-4 pl-4 border-l-2 border-brand-200">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="写下你的回复..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleSubmitReply(answer.id)}
                          className="bg-brand-600 hover:bg-brand-700 text-sm py-1.5"
                        >
                          提交
                        </Button>
                        <Button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          variant="secondary"
                          className="text-sm py-1.5"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 回复列表 */}
                  {showReplies.has(answer.id) && answer.replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                      {answer.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <UserBadge userId={reply.author.id} userName={reply.author.name} showClass={false} />
                            <span className="text-xs text-gray-400">
                              {new Date(reply.createdAt).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {canDeleteAnswer(answer) && (
                  <button
                    onClick={(e) => openDeleteDialog(e, answer)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="删除回答"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}

          {topic.answers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>暂无回答，快来抢沙发吧！</p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAnswerToDelete(null);
        }}
        onConfirm={handleDeleteAnswer}
        title="删除回答"
        description="您确定要删除此回答吗？"
        itemName={answerToDelete?.content.substring(0, 50)}
      />
    </div>
  );
}
