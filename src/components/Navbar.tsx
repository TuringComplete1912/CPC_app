"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "./UI";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentUser = session?.user
    ? {
        id: session.user.id || "unknown",
        name: session.user.name || "未命名用户",
        role: (session.user as any).role === "admin" ? "admin" : "member",
        avatar: `https://ui-avatars.com/api/?name=${session.user.name || "User"}&background=dc2626&color=fff`
      }
    : null;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="w-full flex justify-between items-center py-5 px-8 max-w-7xl mx-auto border-b border-gray-100 bg-white sticky top-0 z-30">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <div className="bg-brand-600 text-white p-2 rounded shadow-md">
          <div className="font-serif font-bold text-lg leading-none">党</div>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">学生第六党支部</span>
      </div>

      {currentUser ? (
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/community")}
            className={`text-base font-medium transition-colors ${
              isActive("/community") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            社区
          </button>
          <button
            onClick={() => router.push("/")}
            className={`text-base font-medium transition-colors ${
              isActive("/") && !isActive("/documents") && !isActive("/worklogs") && !isActive("/community") && !isActive("/party") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            工作台
          </button>
          <button
            onClick={() => router.push("/documents")}
            className={`text-base font-medium transition-colors ${
              isActive("/documents") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            近期文档
          </button>
          <button
            onClick={() => router.push("/worklogs")}
            className={`text-base font-medium transition-colors ${
              isActive("/worklogs") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            活动日志
          </button>
          <button
            onClick={() => router.push("/materials")}
            className={`text-base font-medium transition-colors ${
              isActive("/materials") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            学习园地
          </button>
          <button
            onClick={() => router.push("/party")}
            className={`text-base font-medium transition-colors ${
              isActive("/party") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            党务管理
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className={`text-base font-medium transition-colors ${
              isActive("/dashboard") ? "text-brand-600 font-bold" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            个人主页
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">{currentUser.name}</div>
              <div className="text-xs text-brand-600">
                {currentUser.role === "admin" ? "管理员" : "党员"}
              </div>
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
}

