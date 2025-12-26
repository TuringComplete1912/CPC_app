"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button, Card, Input } from "@/components/UI";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 恢复“记住账号”
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("login_saved");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { username: string; password: string };
        setUsername(parsed.username || "");
        setPassword(parsed.password || "");
        setRemember(true);
      } catch {
        // ignore
      }
    }
  }, []);

  // 移除自动跳转：即使已登录也要显示登录页面，用户必须手动登录

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      callbackUrl: "/"
    });
    setLoading(false);
    if (res?.error) {
      setError("用户名或密码错误");
      return;
    }
    if (remember && typeof window !== "undefined") {
      localStorage.setItem("login_saved", JSON.stringify({ username, password }));
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("login_saved");
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-600 text-white font-bold text-xl">
            党
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学生第六党支部</h1>
            <p className="text-sm text-gray-500 mt-1">数字化工作平台</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">用户名</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember" className="cursor-pointer">
              记住密码
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700" isLoading={loading}>
            登录
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-center text-gray-600">
            还没有账号？{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              立即注册
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

