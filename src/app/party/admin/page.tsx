"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Users, Calendar, MapPin, MessageCircle, X, ArrowLeft, UserCog, Save } from "lucide-react";
import { Button, Card, Badge } from "@/components/UI";
import Navbar from "@/components/Navbar";

interface PartyInfoAdmin {
  id: string;
  userId: string;
  userName: string;
  politicalStatus: string;
  className: string;
  hometown: string;
  wechatQQ: string;
  joinLeagueDate: string | null;
  activistDate: string | null;
  probationaryDate: string | null;
  formalDate: string | null;
  updatedAt: string;
}

interface MyPartyInfo {
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

const politicalStatusOptions = ["群众", "共青团员", "入党积极分子", "预备党员", "党员"];

export default function PartyAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState<PartyInfoAdmin[]>([]);
  const [filteredResults, setFilteredResults] = useState<PartyInfoAdmin[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "year" | "stage">("name");
  const [keyword, setKeyword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PartyInfoAdmin | null>(null);
  
  // 管理员自己的党务信息
  const [showMyInfoModal, setShowMyInfoModal] = useState(false);
  const [savingMyInfo, setSavingMyInfo] = useState(false);
  const [myPartyInfo, setMyPartyInfo] = useState<MyPartyInfo>({
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

  useEffect(() => {
    if (status === "authenticated") {
      checkAdmin();
    }
  }, [status]);

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.user.role === "admin") {
          setIsAdmin(true);
          loadData();
        } else {
          alert("无权访问");
          router.push("/party");
        }
      }
    } catch (error) {
      console.error("检查权限失败", error);
      router.push("/party");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/party-info/admin");
      if (res.ok) {
        const data = await res.json();
        setAllResults(data);
        setFilteredResults(data);
      } else {
        const data = await res.json();
        alert(data.message || "加载失败");
      }
    } catch (error) {
      console.error("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyPartyInfo = async () => {
    try {
      const res = await fetch("/api/party-info");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setMyPartyInfo(data);
        }
      }
    } catch (error) {
      console.error("加载个人党务信息失败", error);
    }
  };

  const handleSaveMyInfo = async () => {
    // 验证班级格式（专业+年份，如：土木2201）
    if (myPartyInfo.className && !/^[\u4e00-\u9fa5]+\d{4}$/.test(myPartyInfo.className)) {
      alert("班级格式不正确，请使用标准格式（如：土木2201）");
      return;
    }

    setSavingMyInfo(true);
    try {
      const res = await fetch("/api/party-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(myPartyInfo)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "保存失败");
        return;
      }

      alert("保存成功");
      setShowMyInfoModal(false);
      loadMyPartyInfo();
    } catch (error) {
      alert("保存失败，请稍后重试");
    } finally {
      setSavingMyInfo(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return politicalStatusOptions.indexOf(status);
  };

  const shouldShowField = (fieldName: string) => {
    const statusIndex = getStatusIndex(myPartyInfo.politicalStatus);
    
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

  // 排序逻辑
  const sortResults = (results: PartyInfoAdmin[], sortType: "name" | "year" | "stage") => {
    const sorted = [...results];
    switch (sortType) {
      case "name":
        return sorted.sort((a, b) => {
          const nameA = a.userName.charAt(0);
          const nameB = b.userName.charAt(0);
          return nameA.localeCompare(nameB, "zh-CN");
        });
      case "year":
        return sorted.sort((a, b) => {
          const yearA = a.className ? a.className.match(/\d+/)?.[0] || "" : "";
          const yearB = b.className ? b.className.match(/\d+/)?.[0] || "" : "";
          return yearA.localeCompare(yearB);
        });
      case "stage":
        const statusOrder = ["党员", "预备党员", "入党积极分子", "共青团员", "群众"];
        return sorted.sort((a, b) => {
          const indexA = statusOrder.indexOf(a.politicalStatus);
          const indexB = statusOrder.indexOf(b.politicalStatus);
          return indexA - indexB;
        });
      default:
        return sorted;
    }
  };

  // 搜索逻辑
  const handleSearch = () => {
    if (!keyword.trim()) {
      setFilteredResults(sortResults(allResults, sortBy));
      return;
    }

    const searchLower = keyword.toLowerCase();
    const filtered = allResults.filter((info) => {
      return (
        info.userName.toLowerCase().includes(searchLower) ||
        info.className?.toLowerCase().includes(searchLower) ||
        info.politicalStatus.toLowerCase().includes(searchLower) ||
        info.hometown?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredResults(sortResults(filtered, sortBy));
  };

  // 切换排序
  const handleSort = (newSort: "name" | "year" | "stage") => {
    setSortBy(newSort);
    setFilteredResults(sortResults(filteredResults, newSort));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "党员":
        return "bg-red-50 text-red-700 border-red-200";
      case "预备党员":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "入党积极分子":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "共青团员":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">检查权限中...</div>
      </div>
    );
  }

  // 详情页面
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
          <Button
            onClick={() => setSelectedUser(null)}
            className="mb-6 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
          </Button>

          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-brand-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.userName}</h2>
                <Badge className={`${getStatusColor(selectedUser.politicalStatus)} border text-base px-3 py-1`}>
                  {selectedUser.politicalStatus}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">班级</label>
                <p className="text-lg text-gray-900">{selectedUser.className || "未填写"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">籍贯</label>
                <p className="text-lg text-gray-900">{selectedUser.hometown || "未填写"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">联系方式</label>
                <p className="text-lg text-gray-900">{selectedUser.wechatQQ || "未填写"}</p>
              </div>

              {selectedUser.joinLeagueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">入团时间</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedUser.joinLeagueDate).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              )}

              {selectedUser.activistDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">成为积极分子时间</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedUser.activistDate).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              )}

              {selectedUser.probationaryDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">成为预备党员时间</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedUser.probationaryDate).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              )}

              {selectedUser.formalDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">成为正式党员时间</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedUser.formalDate).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">最后更新时间</label>
                <p className="text-lg text-gray-900">
                  {new Date(selectedUser.updatedAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // 列表页面
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">党务管理 - 管理员</h2>
            <p className="text-gray-500 mt-1">查看和管理所有党员信息</p>
          </div>
          <Button
            onClick={() => {
              loadMyPartyInfo();
              setShowMyInfoModal(true);
            }}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <UserCog className="w-4 h-4 mr-2" /> 我的党务信息
          </Button>
        </header>

        {/* 筛选和搜索 */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="text-sm text-gray-600 flex items-center">筛选排序：</span>
            <button
              onClick={() => handleSort("name")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "name"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              按姓名首字母
            </button>
            <button
              onClick={() => handleSort("year")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "year"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              按年份
            </button>
            <button
              onClick={() => handleSort("stage")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "stage"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              按发展阶段
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索姓名、班级、政治面貌、籍贯..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {keyword && (
                <button
                  onClick={() => {
                    setKeyword("");
                    setFilteredResults(sortResults(allResults, sortBy));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} className="bg-brand-600 hover:bg-brand-700">
              <Search className="w-4 h-4 mr-2" /> 搜索
            </Button>
          </div>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {["党员", "预备党员", "入党积极分子", "共青团员", "群众"].map((status) => {
            const count = filteredResults.filter((r) => r.politicalStatus === status).length;
            return (
              <Card key={status} className="p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{status}</div>
              </Card>
            );
          })}
        </div>

        {/* 结果列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((info) => (
              <Card
                key={info.id}
                className="p-5 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedUser(info)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-gray-900 mb-1">{info.userName}</h4>
                    <Badge className={`${getStatusColor(info.politicalStatus)} border text-xs`}>
                      {info.politicalStatus}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {info.className && (
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {info.className}
                    </p>
                  )}
                  {info.hometown && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {info.hometown}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{keyword ? "未找到匹配的结果" : "暂无数据"}</p>
          </div>
        )}
      </main>

      {/* 我的党务信息弹窗 */}
      {showMyInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">我的党务信息</h3>
                <button
                  onClick={() => setShowMyInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 政治面貌 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    政治面貌 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={myPartyInfo.politicalStatus}
                    onChange={(e) => setMyPartyInfo({ ...myPartyInfo, politicalStatus: e.target.value })}
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
                      checked={myPartyInfo.showPoliticalStatus}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showPoliticalStatus: e.target.checked })}
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
                    value={myPartyInfo.className}
                    onChange={(e) => setMyPartyInfo({ ...myPartyInfo, className: e.target.value })}
                    placeholder="土木2201"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="showClassName"
                      checked={myPartyInfo.showClassName}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showClassName: e.target.checked })}
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
                    value={myPartyInfo.hometown}
                    onChange={(e) => setMyPartyInfo({ ...myPartyInfo, hometown: e.target.value })}
                    placeholder="请输入籍贯"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="showHometown"
                      checked={myPartyInfo.showHometown}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showHometown: e.target.checked })}
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
                    value={myPartyInfo.wechatQQ}
                    onChange={(e) => setMyPartyInfo({ ...myPartyInfo, wechatQQ: e.target.value })}
                    placeholder="请输入微信号或QQ号"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="showWechatQQ"
                      checked={myPartyInfo.showWechatQQ}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showWechatQQ: e.target.checked })}
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
                      入团时间 {getStatusIndex(myPartyInfo.politicalStatus) >= 1 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={myPartyInfo.joinLeagueDate || ""}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, joinLeagueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="showJoinLeagueDate"
                        checked={myPartyInfo.showJoinLeagueDate}
                        onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showJoinLeagueDate: e.target.checked })}
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
                      成为积极分子时间 {getStatusIndex(myPartyInfo.politicalStatus) >= 2 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={myPartyInfo.activistDate || ""}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, activistDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="showActivistDate"
                        checked={myPartyInfo.showActivistDate}
                        onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showActivistDate: e.target.checked })}
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
                      成为预备党员时间 {getStatusIndex(myPartyInfo.politicalStatus) >= 3 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={myPartyInfo.probationaryDate || ""}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, probationaryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="showProbationaryDate"
                        checked={myPartyInfo.showProbationaryDate}
                        onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showProbationaryDate: e.target.checked })}
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
                      成为正式党员时间 {getStatusIndex(myPartyInfo.politicalStatus) >= 4 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={myPartyInfo.formalDate || ""}
                      onChange={(e) => setMyPartyInfo({ ...myPartyInfo, formalDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="showFormalDate"
                        checked={myPartyInfo.showFormalDate}
                        onChange={(e) => setMyPartyInfo({ ...myPartyInfo, showFormalDate: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600"
                      />
                      <label htmlFor="showFormalDate" className="text-sm text-gray-600">
                        公开显示
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowMyInfoModal(false)}
                  variant="secondary"
                  className="px-6"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveMyInfo}
                  className="bg-brand-600 hover:bg-brand-700 px-6"
                  isLoading={savingMyInfo}
                >
                  <Save className="w-4 h-4 mr-2" /> 保存信息
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
