"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Edit, MessageSquare, Key, Save, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card } from "@/components/UI";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // 编辑资料
  const [nickname, setNickname] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // API Key
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [useOwnApiKey, setUseOwnApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // AI聊天
  const [messages, setMessages] = useState<Array<{ role: string; content: string; reasoning?: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number[]>([]); // 展开的思考过程索引
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadProfile();
      loadApiKeyStatus();
    }
  }, [status]);

  // 平滑滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setUser(data);
      setNickname(data.nickname || "");
      setDepartment(data.department || "");
      setBio(data.bio || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
    } catch (error) {
      console.error("加载用户信息失败", error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeyStatus = async () => {
    try {
      const res = await fetch("/api/user/apikey");
      if (res.ok) {
        const data = await res.json();
        setHasApiKey(data.hasApiKey);
        setUseOwnApiKey(data.useOwnApiKey || false);
      }
    } catch (error) {
      console.error("加载API Key状态失败", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, department, bio, phone, email })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "保存失败");
        return;
      }

      const updated = await res.json();
      setUser(updated);
      setShowEditModal(false);
      alert("保存成功");
    } catch (error) {
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      alert("请输入API Key");
      return;
    }

    setSavingApiKey(true);
    try {
      const res = await fetch("/api/user/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, useOwnApiKey })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "保存失败");
        return;
      }

      setHasApiKey(true);
      setShowApiKeyModal(false);
      setApiKey("");
      alert("API Key 已保存");
      loadApiKeyStatus(); // 重新加载状态
    } catch (error) {
      alert("保存失败，请稍后重试");
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleToggleUseOwnKey = async (checked: boolean) => {
    try {
      const res = await fetch("/api/user/apikey", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useOwnApiKey: checked })
      });

      if (res.ok) {
        setUseOwnApiKey(checked);
      }
    } catch (error) {
      console.error("更新设置失败", error);
    }
  };

  const handleClearApiKey = async () => {
    if (!confirm("确定要清除个人API Key吗？清除后将使用系统默认Key。")) {
      return;
    }

    setSavingApiKey(true);
    try {
      const res = await fetch("/api/user/clear-apikey", {
        method: "POST"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "清除失败");
        return;
      }

      setHasApiKey(false);
      setUseOwnApiKey(false);
      setShowApiKeyModal(false);
      alert("API Key 已清除，现在将使用系统默认Key");
    } catch (error) {
      alert("清除失败，请稍后重试");
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages([...messages, { role: "user", content: userMessage }]);
    setSending(true);

    // 添加一个空的助手消息用于流式更新
    const assistantMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", reasoning: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, stream: true })
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: "assistant",
            content: `错误: ${data.message}`
          };
          return newMessages;
        });
        return;
      }

      // 处理流式响应
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedReasoning = "";
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 100;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                const reasoning = parsed.choices?.[0]?.delta?.reasoning || "";

                // 收集思考过程
                if (reasoning) {
                  accumulatedReasoning += reasoning;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[assistantMessageIndex] = {
                        role: "assistant",
                        content: "💭 正在思考...",
                        reasoning: accumulatedReasoning
                      };
                      return newMessages;
                    });
                    lastUpdateTime = now;
                  }
                }

                // 显示正式回答
                if (content) {
                  accumulatedContent += content;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[assistantMessageIndex] = {
                        role: "assistant",
                        content: accumulatedContent,
                        reasoning: accumulatedReasoning
                      };
                      return newMessages;
                    });
                    lastUpdateTime = now;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        
        // 最后一次更新
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: "assistant",
            content: accumulatedContent,
            reasoning: accumulatedReasoning
          };
          return newMessages;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[assistantMessageIndex] = {
          role: "assistant",
          content: "发送失败，请稍后重试"
        };
        return newMessages;
      });
    } finally {
      setSending(false);
    }
  };

  const toggleReasoning = (index: number) => {
    setExpandedReasoning((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const displayName = user?.nickname || user?.username || "用户";
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=dc2626&color=fff`;
  const roleLabel = user?.role === "admin" ? "管理员" : "成员";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">个人主页</h2>
          <p className="text-gray-500 mt-1">管理你的个人信息和AI助手</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 个人卡片 */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">个人资料</h3>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="编辑资料"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border-2 border-brand-200 object-cover"
                />
                <div>
                  <div className="text-lg font-bold text-gray-900">{displayName}</div>
                  <div className="text-sm text-brand-600 font-semibold">{roleLabel}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">用户名</span>
                  <span className="font-medium text-gray-900">{user?.username || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">部门</span>
                  <span className="font-medium text-gray-900">{user?.department || "未设置"}</span>
                </div>
                {user?.bio && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 block mb-1">个人简介</span>
                    <p className="text-gray-700 text-sm">{user.bio}</p>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">电话</span>
                    <span className="font-medium text-gray-900">{user.phone}</span>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">邮箱</span>
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">加入时间</span>
                  <span className="font-medium text-gray-900">
                    {new Date(user?.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  onClick={() => setShowApiKeyModal(true)}
                  variant="secondary"
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {hasApiKey ? "更新 API Key" : "设置 API Key"}
                </Button>
                {hasApiKey && (
                  <div className="mt-2 text-xs text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded ${
                      useOwnApiKey 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {useOwnApiKey ? "✓ 使用个人Key" : "使用系统Key"}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI聊天 */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[600px] flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                <MessageSquare className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold text-gray-900">学六小助手</h3>
                <span className="text-xs text-gray-500 ml-auto">
                  可以询问支部的文档、活动、资料等信息
                </span>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 scroll-smooth">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">你好！我是学六小助手 👋</p>
                    <p className="text-sm mt-2">开始与我对话吧</p>
                    <p className="text-xs mt-2">你可以询问支部的文档、活动、学习资料等信息</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                    
                    {/* 思考过程（可折叠） */}
                    {msg.role === "assistant" && msg.reasoning && msg.reasoning.length > 0 && (
                      <div className="flex justify-start mt-2">
                        <div className="max-w-[80%]">
                          <button
                            onClick={() => toggleReasoning(idx)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg transition-colors"
                          >
                            <span>💭 查看思考过程</span>
                            {expandedReasoning.includes(idx) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {expandedReasoning.includes(idx) && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg max-h-[200px] overflow-y-auto">
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {msg.reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-gray-500">正在思考...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入框 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                  placeholder="输入你的问题..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-brand-600 hover:bg-brand-700"
                  isLoading={sending}
                  disabled={!inputMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900">编辑个人资料</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">部门</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">个人简介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">联系电话</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={saving}
              >
                <Save className="w-4 h-4 mr-2" /> 保存
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* API Key设置弹窗 */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900">设置 API Key</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 OpenRouter API Key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  API Key 将安全保存，仅用于你的AI对话
                </p>
              </div>
              
              {hasApiKey && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useOwnApiKey}
                      onChange={(e) => setUseOwnApiKey(e.target.checked)}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      优先使用我的API Key
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    关闭后将使用系统默认Key，你的Key会被保留
                  </p>
                </div>
              )}
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  💡 如果不设置个人API Key，将使用系统默认的API Key
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setApiKey("");
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
              {hasApiKey && (
                <Button
                  onClick={handleClearApiKey}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                  isLoading={savingApiKey}
                >
                  清除Key
                </Button>
              )}
              <Button
                onClick={handleSaveApiKey}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                isLoading={savingApiKey}
              >
                <Save className="w-4 h-4 mr-2" /> 保存
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
