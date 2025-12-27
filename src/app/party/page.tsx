"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User as UserIcon, Calendar, MapPin, MessageCircle, Save, Search, Users } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";

interface PartyInfo {
  id?: string;
  politicalStatus: string;
  className: string;
  hometown: string;
  wechatQQ: string;
  joinLeagueDate: string | null;
  activistDate: string | null;
  probationaryDate: string | null;
  formalDate: string | null;
  showPoliticalStatus: boolean;
  showClassName: boolean;
  showHometown: boolean;
  showWechatQQ: boolean;
  showJoinLeagueDate: boolean;
  showActivistDate: boolean;
  showProbationaryDate: boolean;
  showFormalDate: boolean;
}

interface SearchResult {
  id: string;
  userId: string;
  userName: string;
  politicalStatus: string | null;
  className: string | null;
  hometown: string | null;
  wechatQQ: string | null;
  joinLeagueDate: string | null;
  activistDate: string | null;
  probationaryDate: string | null;
  formalDate: string | null;
}

const politicalStatusOptions = ["群众", "共青团员", "入党积极分子", "预备党员", "党员"];

export default function PartyManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partyInfo, setPartyInfo] = useState<PartyInfo>({
    politicalStatus: "群众",
    className: "",
    hometown: "",
    wechatQQ: "",
    joinLeagueDate: null,
    activistDate: null,
    probationaryDate: null,
    formalDate: null,
    showPoliticalStatus: true,
    showClassName: true,
    showHometown: true,
    showWechatQQ: false,
    showJoinLeagueDate: true,
    showActivistDate: true,
    showProbationaryDate: true,
    showFormalDate: true
  });

  const [searchType, setSearchType] = useState<"year" | "stage">("year");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      checkIfAdmin();
    }
  }, [status]);

  const checkIfAdmin = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.user.role === "admin") {
          // 管理员直接跳转到管理员页面
          router.push("/party/admin");
          return;
        }
      }
      loadPartyInfo();
    } catch (error) {
      console.error("检查权限失败", error);
      loadPartyInfo();
    }
  };

  const loadPartyInfo = async () => {
    try {
      const res = await fetch("/api/party-info");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setPartyInfo(data);
        }
      }
    } catch (error) {
      console.error("加载党务信息失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 验证班级格式（专业+年份，如：土木2201）
    if (partyInfo.className && !/^[\u4e00-\u9fa5]+\d{4}$/.test(partyInfo.className)) {
      alert("班级格式不正确，请使用标准格式（如：土木2201）");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/party-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partyInfo)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "保存失败");
        return;
      }

      alert("保存成功");
      loadPartyInfo();
    } catch (error) {
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (searchType === "year" && !partyInfo.className) {
      alert("请先填写班级信息");
      return;
    }
    if (searchType === "stage" && !partyInfo.politicalStatus) {
      alert("请先选择政治面貌");
      return;
    }

    setSearching(true);
    try {
      const value = searchType === "year" ? partyInfo.className : partyInfo.politicalStatus;
      const res = await fetch(`/api/party-info/search?type=${searchType}&value=${encodeURIComponent(value)}`);
      
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        const data = await res.json();
        alert(data.message || "搜索失败");
      }
    } catch (error) {
      alert("搜索失败，请稍后重试");
    } finally {
      setSearching(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return politicalStatusOptions.indexOf(status);
  };

  const shouldShowField = (fieldName: string) => {
    const statusIndex = getStatusIndex(partyInfo.politicalStatus);
    
    switch (fieldName) {
      case "joinLeagueDate":
        return statusIndex >= 1;
      case "activistDate":
        return statusIndex >= 2;
      case "probationaryDate":
        return statusIndex >= 3;
      case "formalDate":
        return statusIndex >= 4;
      default:
        return true;
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
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">党务管理</h2>
          <p className="text-gray-500 mt-1">管理您的党务信息，查找同年/同阶段同志</p>
        </header>

        {/* 个人党务信息卡片 */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">我的党务信息</h3>
            <Badge className="bg-blue-50 text-blue-700">
              管理员有权查看所有信息
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 政治面貌 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                政治面貌 <span className="text-red-500">*</span>
              </label>
              <select
                value={partyInfo.politicalStatus}
                onChange={(e) => setPartyInfo({ ...partyInfo, politicalStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {politicalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showPoliticalStatus"
                  checked={partyInfo.showPoliticalStatus}
                  onChange={(e) => setPartyInfo({ ...partyInfo, showPoliticalStatus: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <label htmlFor="showPoliticalStatus" className="text-sm text-gray-600">
                  公开显示
                </label>
              </div>
            </div>

            {/* 班级 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                班级 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">（格式：土木2201）</span>
              </label>
              <input
                type="text"
                value={partyInfo.className}
                onChange={(e) => setPartyInfo({ ...partyInfo, className: e.target.value })}
                placeholder="土木2201"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showClassName"
                  checked={partyInfo.showClassName}
                  onChange={(e) => setPartyInfo({ ...partyInfo, showClassName: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <label htmlFor="showClassName" className="text-sm text-gray-600">
                  公开显示
                </label>
              </div>
            </div>

            {/* 籍贯 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                籍贯
              </label>
              <input
                type="text"
                value={partyInfo.hometown}
                onChange={(e) => setPartyInfo({ ...partyInfo, hometown: e.target.value })}
                placeholder="请输入籍贯"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showHometown"
                  checked={partyInfo.showHometown}
                  onChange={(e) => setPartyInfo({ ...partyInfo, showHometown: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <label htmlFor="showHometown" className="text-sm text-gray-600">
                  公开显示
                </label>
              </div>
            </div>

            {/* 微信号/QQ号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                微信号/QQ号
              </label>
              <input
                type="text"
                value={partyInfo.wechatQQ}
                onChange={(e) => setPartyInfo({ ...partyInfo, wechatQQ: e.target.value })}
                placeholder="请输入微信号或QQ号"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showWechatQQ"
                  checked={partyInfo.showWechatQQ}
                  onChange={(e) => setPartyInfo({ ...partyInfo, showWechatQQ: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <label htmlFor="showWechatQQ" className="text-sm text-gray-600">
                  公开显示
                </label>
              </div>
            </div>

            {/* 入团时间 */}
            {shouldShowField("joinLeagueDate") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  入团时间 {getStatusIndex(partyInfo.politicalStatus) >= 1 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={partyInfo.joinLeagueDate || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, joinLeagueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="showJoinLeagueDate"
                    checked={partyInfo.showJoinLeagueDate}
                    onChange={(e) => setPartyInfo({ ...partyInfo, showJoinLeagueDate: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <label htmlFor="showJoinLeagueDate" className="text-sm text-gray-600">
                    公开显示
                  </label>
                </div>
              </div>
            )}

            {/* 成为积极分子时间 */}
            {shouldShowField("activistDate") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  成为积极分子时间 {getStatusIndex(partyInfo.politicalStatus) >= 2 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={partyInfo.activistDate || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, activistDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="showActivistDate"
                    checked={partyInfo.showActivistDate}
                    onChange={(e) => setPartyInfo({ ...partyInfo, showActivistDate: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <label htmlFor="showActivistDate" className="text-sm text-gray-600">
                    公开显示
                  </label>
                </div>
              </div>
            )}

            {/* 成为预备党员时间 */}
            {shouldShowField("probationaryDate") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  成为预备党员时间 {getStatusIndex(partyInfo.politicalStatus) >= 3 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={partyInfo.probationaryDate || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, probationaryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="showProbationaryDate"
                    checked={partyInfo.showProbationaryDate}
                    onChange={(e) => setPartyInfo({ ...partyInfo, showProbationaryDate: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <label htmlFor="showProbationaryDate" className="text-sm text-gray-600">
                    公开显示
                  </label>
                </div>
              </div>
            )}

            {/* 成为正式党员时间 */}
            {shouldShowField("formalDate") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  成为正式党员时间 {getStatusIndex(partyInfo.politicalStatus) >= 4 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={partyInfo.formalDate || ""}
                  onChange={(e) => setPartyInfo({ ...partyInfo, formalDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="showFormalDate"
                    checked={partyInfo.showFormalDate}
                    onChange={(e) => setPartyInfo({ ...partyInfo, showFormalDate: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <label htmlFor="showFormalDate" className="text-sm text-gray-600">
                    公开显示
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              className="bg-brand-600 hover:bg-brand-700"
              isLoading={saving}
            >
              <Save className="w-4 h-4 mr-2" /> 保存信息
            </Button>
          </div>
        </Card>

        {/* 查找同志 */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">查找同志</h3>

          <div className="flex gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType("year")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "year"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                同年同志
              </button>
              <button
                onClick={() => setSearchType("stage")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "stage"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                同阶段同志
              </button>
            </div>
            <Button
              onClick={handleSearch}
              className="bg-brand-600 hover:bg-brand-700"
              isLoading={searching}
            >
              <Search className="w-4 h-4 mr-2" /> 搜索
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result) => (
                <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-2">{result.userName}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {result.politicalStatus && (
                          <p className="flex items-center gap-1">
                            <Badge className="bg-brand-50 text-brand-700">
                              {result.politicalStatus}
                            </Badge>
                          </p>
                        )}
                        {result.className && (
                          <p className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {result.className}
                          </p>
                        )}
                        {result.hometown && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {result.hometown}
                          </p>
                        )}
                        {result.wechatQQ && (
                          <p className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {result.wechatQQ}
                          </p>
                        )}
                        {result.activistDate && (
                          <p className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" /> 积极分子: {new Date(result.activistDate).toLocaleDateString("zh-CN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !searching && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>点击搜索按钮查找同年/同阶段同志</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
