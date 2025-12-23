"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  User as UserIcon,
  LogOut,
  Clock,
  BookOpen,
  PenTool,
  CheckCircle,
  ChevronRight,
  Save,
  Wand2,
  Download,
  Plus
} from "lucide-react";
import { polishText } from "@/services/geminiService";
import { Badge, Button, Card } from "@/components/UI";
import {
  Document,
  LearningMaterial,
  ModificationLog,
  User,
  ViewState
} from "@/types";

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DOCS: Document[] = [
  {
    id: "1",
    title: "第三季度党支部工作总结",
    content: "第三季度，学生第六党支部在学院党委的领导下，深入开展了...",
    lastModified: Date.now() - 100000,
    lastModifiedBy: "张书记",
    version: 1,
    status: "published"
  },
  {
    id: "2",
    title: "预备党员转正会议记录",
    content:
      "1. 会议时间：2023年10月...\n2. 会议地点：...\n3. 讨论事项：关于李华同志的转正申请...",
    lastModified: Date.now() - 500000,
    lastModifiedBy: "李华",
    version: 2,
    status: "draft"
  }
];

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);

  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [logs, setLogs] = useState<ModificationLog[]>([]);

  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setCurrentUser({
        id: session.user.id || "unknown",
        name: session.user.name || "未命名用户",
        role: (session.user as any).role === "admin" ? "admin" : "member",
        avatar: `https://ui-avatars.com/api/?name=${session.user.name || "User"}&background=dc2626&color=fff`
      });
      setView(ViewState.DASHBOARD);
    }
  }, [session]);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const res = await fetch("/api/materials");
        if (!res.ok) return;
        const data = await res.json();
        setMaterials(
          data.map((item: any) => ({
            id: item.id,
            title: item.title,
            fileUrl: item.fileUrl,
            fileType: item.fileType,
            createdAt: item.createdAt,
            uploaderName: item.uploaderName,
            uploaderId: item.uploaderId
          }))
        );
      } catch (error) {
        console.error("加载资料失败", error);
      }
    };
    if (status === "authenticated") {
      loadMaterials();
    }
  }, [status]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const createNewDoc = () => {
    const newDoc: Document = {
      id: generateId(),
      title: "未命名文档",
      content: "",
      lastModified: Date.now(),
      lastModifiedBy: currentUser?.name || "未知",
      version: 1,
      status: "draft"
    };
    setDocuments([newDoc, ...documents]);
    openEditor(newDoc);
  };

  const openEditor = (doc: Document) => {
    setCurrentDoc(doc);
    setEditorContent(doc.content);
    setAiSuggestion(null);
    setView(ViewState.EDITOR);
  };

  const saveDocument = () => {
    if (!currentDoc || !currentUser) return;

    const updatedDoc = {
      ...currentDoc,
      content: editorContent,
      lastModified: Date.now(),
      lastModifiedBy: currentUser.name,
      version: currentDoc.version + 1
    };

    setDocuments((docs) => docs.map((d) => (d.id === currentDoc.id ? updatedDoc : d)));

    const log: ModificationLog = {
      id: generateId(),
      docId: currentDoc.id,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      action: "update",
      description: `更新了文档 "${currentDoc.title}" 至版本 v${updatedDoc.version}`
    };
    setLogs([log, ...logs]);

    setCurrentDoc(updatedDoc);
    alert("文档保存成功！");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        alert("上传失败，请重试");
        return;
      }
      const saved = await res.json();
      const newMaterial: LearningMaterial = {
        id: saved.id,
        title: saved.title,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        createdAt: saved.createdAt,
        uploaderName: saved.uploaderName,
        uploaderId: saved.uploaderId
      };
      setMaterials((prev) => [newMaterial, ...prev]);

      const log: ModificationLog = {
        id: generateId(),
        docId: newMaterial.id,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        action: "upload",
        description: `上传了学习资料 "${file.name}"`
      };
      setLogs([log, ...logs]);
      e.target.value = "";
    } catch (error) {
      console.error("上传失败", error);
      alert("上传失败，请稍后再试");
    }
  };

  const triggerAiPolish = async () => {
    if (!editorContent) return;
    setAiLoading(true);
    const result = await polishText(editorContent);
    setAiSuggestion(result);
    setAiLoading(false);
  };

  if (status === "loading" || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        页面加载中...
      </div>
    );
  }

  const Navbar = () => (
    <nav className="w-full flex justify-between items-center py-5 px-8 max-w-7xl mx-auto border-b border-gray-100 bg-white sticky top-0 z-30">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => (currentUser ? setView(ViewState.DASHBOARD) : setView(ViewState.LANDING))}
      >
        <div className="bg-brand-600 text-white p-2 rounded shadow-md">
          <div className="font-serif font-bold text-lg leading-none">党</div>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">学生第六党支部</span>
      </div>

      {currentUser ? (
        <div className="flex items-center gap-6">
          <button
            onClick={() => setView(ViewState.DASHBOARD)}
            className={`text-base font-medium transition-colors ${
              view === ViewState.DASHBOARD ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            工作台
          </button>
          <button
            onClick={() => setView(ViewState.MATERIALS)}
            className={`text-base font-medium transition-colors ${
              view === ViewState.MATERIALS ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            学习园地
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">{currentUser.name}</div>
              <div className="text-xs text-brand-600">{currentUser.role === "admin" ? "管理员" : "党员"}</div>
            </div>
            <img
              src={currentUser.avatar}
              alt="User"
              className="w-9 h-9 rounded-full border-2 border-brand-100"
            />
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-brand-600 transition-colors ml-2"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            去登录
          </a>
          <Button
            variant="primary"
            onClick={() => router.push("/login")}
            className="bg-brand-600 hover:bg-brand-700"
          >
            党员登录
          </Button>
        </div>
      )}
    </nav>
  );

  const LandingView = () => (
    <div className="flex flex-col min-h-screen bg-brand-50/50">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between px-8 max-w-7xl mx-auto w-full pt-10 pb-20">
        <div className="lg:w-1/2 space-y-8 z-10">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-brand-100">
            <span className="text-brand-500 text-lg">★</span>
            <span className="text-sm font-bold text-gray-800">智慧党建 · 高效协同</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            学生第六党支部 <br />
            <span className="text-brand-600">数字化工作平台</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
            致力于打造规范化、智能化的党支部工作环境。
            支持文档协作管理、学习资料共享、活动记录追踪，以科技赋能基层党建工作。
          </p>

          <Button onClick={() => setView(ViewState.DASHBOARD)} className="bg-brand-600 hover:bg-brand-700">
            进入工作台
          </Button>

          <div className="flex items-center gap-8 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium text-gray-700">实名身份认证</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium text-gray-700">全流程修改留痕</span>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 relative mt-12 lg:mt-0 flex justify-center lg:justify-end">
          <div className="relative w-[400px] h-[500px] bg-gradient-to-br from-brand-600 to-brand-900 rounded-[1rem] overflow-hidden shadow-2xl ring-8 ring-white/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500 rounded-bl-full opacity-20 mix-blend-overlay" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black/20 backdrop-blur-sm" />

            <div className="absolute top-16 -left-8 bg-white p-4 rounded-xl shadow-xl w-48 border-l-4 border-accent-400">
              <div className="text-xs text-gray-500 mb-1">本月完成度</div>
              <div className="text-2xl font-bold text-brand-900">92%</div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>

            <div className="absolute bottom-20 -right-6 bg-white p-5 rounded-xl shadow-xl w-60 border-t-4 border-brand-500">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900">近期活动</span>
                <div className="px-2 py-0.5 rounded text-[10px] bg-brand-100 text-brand-700 font-bold">进行中</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">党史学习交流会</div>
                    <div className="text-[10px] text-gray-500">下午 2:00</div>
                  </div>
                </div>
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
              alt="Meeting"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 grayscale"
            />

            <div className="absolute bottom-6 left-6 text-white/90">
              <div className="text-2xl font-bold">不忘初心</div>
              <div className="text-sm opacity-80">牢记使命，砥砺前行</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">工作台</h2>
            <p className="text-gray-500 mt-1">欢迎回来，{currentUser?.name}同志。以下是支部的最新动态。</p>
          </div>
          <Button onClick={createNewDoc} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4 mr-2" /> 新建文档
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" /> 近期文档
              </h3>
            </div>
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-transparent hover:border-l-brand-500"
                >
                  <div className="flex justify-between items-start" onClick={() => openEditor(doc)}>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-brand-600 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-1">{doc.content || "暂无内容..."}</p>
                      <div className="flex gap-4 mt-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> {doc.lastModifiedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(doc.lastModified).toLocaleDateString("zh-CN")}
                        </span>
                        <Badge
                          className={
                            doc.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {doc.status === "published" ? "已发布" : "草稿"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-full group-hover:bg-brand-50 transition-colors">
                      <PenTool className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400" /> 数据概览
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                  <div className="text-3xl font-bold text-white">{documents.length}</div>
                  <div className="text-xs text-gray-300 mt-1">文档总数</div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                  <div className="text-3xl font-bold text-accent-400">{materials.length}</div>
                  <div className="text-xs text-gray-300 mt-1">学习资料</div>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" /> 活动日志
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto">
                <div className="space-y-6 relative border-l-2 border-gray-100 ml-2">
                  {logs.length === 0 && <p className="text-sm text-gray-400 pl-6">暂无近期活动。</p>}
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-1">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white shadow-sm" />
                      <p className="text-sm font-medium text-gray-900 leading-snug">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="font-medium text-gray-500">{log.userName}</span> •{" "}
                        {new Date(log.timestamp).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const EditorView = () => (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setView(ViewState.DASHBOARD)}
            className="px-2 text-gray-600 hover:text-brand-600"
          >
            ← 返回列表
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <input
            value={currentDoc?.title}
            onChange={(e) => currentDoc && setCurrentDoc({ ...currentDoc, title: e.target.value })}
            className="font-bold text-xl text-gray-900 outline-none placeholder-gray-400 bg-transparent focus:ring-0 border-b border-transparent focus:border-brand-300 transition-colors"
            placeholder="请输入文档标题"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={triggerAiPolish}
            isLoading={aiLoading}
            disabled={!editorContent}
            className="border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            <Wand2 className="w-4 h-4 mr-2 text-brand-500" /> AI 润色
          </Button>
          <Button onClick={saveDocument} className="bg-brand-600 hover:bg-brand-700">
            <Save className="w-4 h-4 mr-2" /> 保存修改
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-gray-50">
          <div className="max-w-4xl mx-auto bg-white p-12 min-h-[80vh] shadow-sm border border-gray-200 rounded-lg">
            <textarea
              className="w-full h-full min-h-[60vh] outline-none resize-none text-lg leading-loose text-gray-800 placeholder-gray-300 font-sans"
              placeholder="在此处输入正文..."
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
            />
          </div>
        </div>

        {aiSuggestion && (
          <div className="w-96 border-l border-gray-200 bg-white p-6 overflow-y-auto shadow-xl z-10">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-brand-500" /> AI 建议
              </h3>
              <button onClick={() => setAiSuggestion(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3">润色后版本</h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed text-justify">{aiSuggestion}</p>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setEditorContent(aiSuggestion);
                setAiSuggestion(null);
              }}
              className="w-full text-sm py-2 bg-brand-600 hover:bg-brand-700"
            >
              采纳建议
            </Button>
          </div>
        )}
      </main>
    </div>
  );

  const MaterialsView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">学习资料</h2>
            <p className="text-gray-500 mt-2">党章党规、系列讲话及支部学习材料共享。</p>
          </div>
          <div className="relative group">
            <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} />
            <label
              htmlFor="fileUpload"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <Upload className="w-4 h-4 mr-2" /> 上传资料
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {materials.map((mat) => (
            <Card
              key={mat.id}
              className="flex flex-col justify-between h-48 hover:shadow-md transition-all group relative overflow-hidden border border-gray-100 hover:border-brand-300"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-brand-900">
                <BookOpen size={80} />
              </div>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    className={
                      mat.fileType === "video"
                        ? "bg-red-50 text-red-700 border border-red-100"
                        : mat.fileType === "image"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                    }
                  >
                    {mat.fileType === "video" ? "视频" : mat.fileType === "image" ? "图片" : "文档"}
                  </Badge>
                </div>
                <h4 className="font-bold text-lg text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                  {mat.title}
                </h4>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  <p className="mb-0.5">上传人: {mat.uploaderName}</p>
                  <p>{new Date(mat.createdAt).toLocaleDateString("zh-CN")}</p>
                </div>
                <a
                  href={mat.fileUrl}
                  className="p-2 rounded-full bg-gray-50 hover:bg-brand-600 hover:text-white transition-colors"
                  title="下载"
                  download
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );

  return (
    <>
      {view === ViewState.LANDING && <LandingView />}
      {view === ViewState.DASHBOARD && <DashboardView />}
      {view === ViewState.EDITOR && <EditorView />}
      {view === ViewState.MATERIALS && <MaterialsView />}
    </>
  );
}

