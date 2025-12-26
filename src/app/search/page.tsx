"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, FileText, MessageSquare, BookOpen, Download, User, Calendar, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/UI";
import Navbar from "@/components/Navbar";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
  [key: string]: any;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession({ required: true });
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState(searchParams.get("type") || "all");
  const [results, setResults] = useState<any>({ community: [], documents: [], materials: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    if (q) {
      setQuery(q);
      setSearchType(type || "all");
      performSearch(q, type || "all");
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, type: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("搜索失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const totalResults = results.community.length + results.documents.length + results.materials.length + results.categories.length;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* 搜索框 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">全局搜索</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索话题、文档、学习资料..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 px-8">
                搜索
              </Button>
            </div>

            {/* 搜索类型选择 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "all"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setSearchType("community")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "community"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />
                社区
              </button>
              <button
                type="button"
                onClick={() => setSearchType("documents")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "documents"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                文档
              </button>
              <button
                type="button"
                onClick={() => setSearchType("materials")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "materials"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-1" />
                学习资料
              </button>
            </div>
          </form>
        </div>

        {/* 搜索结果 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <span className="ml-3 text-gray-600">搜索中...</span>
          </div>
        )}

        {!loading && searched && (
          <div className="space-y-6">
            {totalResults > 0 ? (
              <>
                <div className="text-sm text-gray-600">
                  找到 <span className="font-semibold text-gray-900">{totalResults}</span> 条结果
                </div>

                {/* 社区话题结果 */}
                {results.community.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-brand-600" />
                      社区话题 ({results.community.length})
                    </h3>
                    <div className="space-y-3">
                      {results.community.map((item: any) => (
                        <Card
                          key={item.id}
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(item.url)}
                        >
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.author}
                            </span>
                            <span>{item.answerCount} 个回答</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 文档结果 */}
                {results.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-600" />
                      近期文档 ({results.documents.length})
                    </h3>
                    <div className="space-y-3">
                      {results.documents.map((item: any) => (
                        <Card
                          key={item.id}
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(item.url)}
                        >
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.publishedAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 学习资料结果 */}
                {results.materials.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-600" />
                      学习资料 ({results.materials.length})
                    </h3>
                    <div className="space-y-3">
                      {results.materials.map((item: any) => (
                        <Card
                          key={item.id}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => router.push(item.url)}>
                              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                  {item.fileType}
                                </span>
                                <span>{formatFileSize(item.fileSize)}</span>
                                <span>{item.categoryName}</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.uploader}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item.fileUrl, item.title);
                              }}
                              variant="secondary"
                              className="text-sm"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              下载
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 分类/板块结果 */}
                {results.categories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-600" />
                      学习板块 ({results.categories.length})
                    </h3>
                    <div className="space-y-3">
                      {results.categories.map((item: any) => (
                        <Card
                          key={item.id}
                          className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                            item.categoryType === 'theory' ? 'border-l-red-500' : 'border-l-brand-500'
                          }`}
                          onClick={() => router.push(item.url)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  item.categoryType === 'theory' 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {item.categoryType === 'theory' ? '理论学习' : '课程学习'}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  创建者: {item.creator}
                                </span>
                                <span>{item.materialCount} 个文件</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>没有找到相关结果</p>
                <p className="text-sm mt-2">试试其他关键词或搜索类型</p>
              </div>
            )}
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>输入关键词开始搜索</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
