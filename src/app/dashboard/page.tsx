import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DraftEditor from "@/components/DraftEditor";
import FileManager from "@/components/FileManager";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      username: true,
      nickname: true,
      department: true,
      avatar: true,
      role: true,
      createdAt: true
    }
  });

  const displayName =
    user?.nickname?.trim() ||
    user?.username ||
    session.user.name ||
    "用户";

  const avatar =
    user?.avatar?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=dc2626&color=fff`;

  const department = user?.department?.trim() || "未设置部门";
  const roleLabel = user?.role === "admin" ? "管理员" : "成员";
  const joinedAt = user?.createdAt
    ? user.createdAt.toLocaleDateString("zh-CN")
    : "未记录";

  return (
    <div className="min-h-screen bg-brand-50/40">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-brand-600 font-semibold">个人仪表盘</p>
            <h1 className="text-3xl font-bold text-gray-900">
              欢迎回来，{displayName}
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50 font-medium transition"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm border border-brand-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border-2 border-brand-200 object-cover"
                />
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {displayName}
                  </div>
                  <div className="text-sm text-brand-600 font-semibold">
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">用户名</span>
                  <span className="font-medium text-gray-900">
                    {user?.username || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">部门</span>
                  <span className="font-medium text-gray-900">
                    {department}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">加入时间</span>
                  <span className="font-medium text-gray-900">
                    {joinedAt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-sm border border-brand-100 rounded-2xl p-6">
              <DraftEditor />
            </div>
            <FileManager />
          </div>
        </div>
      </div>
    </div>
  );
}

