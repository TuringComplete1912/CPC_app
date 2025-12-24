import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type StaticUser = { username: string; password: string; role: string; name?: string };

// 默认写死账号，可通过环境变量 AUTH_USERS_JSON 覆盖（格式：JSON 数组，每项 {username,password,role,name?}）
const DEFAULT_USERS: StaticUser[] = [
  { username: "李明昊", password: "lmh123", role: "admin", name: "李明昊" },
  { username: "尚冠竹", password: "sgz123", role: "admin", name: "尚冠竹" }
];

const loadStaticUsers = (): StaticUser[] => {
  const raw = process.env.AUTH_USERS_JSON;
  if (!raw) return DEFAULT_USERS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn("AUTH_USERS_JSON 解析失败，使用默认账号");
  }
  return DEFAULT_USERS;
};

const staticUsers = loadStaticUsers();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "凭证登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // 1) 先查静态账号
        const foundStatic = staticUsers.find(
          (u) => u.username === credentials.username && u.password === credentials.password
        );
        if (foundStatic) {
          return {
            id: `static-${foundStatic.username}`,
            name: foundStatic.name || foundStatic.username,
            email: `${foundStatic.username}@example.com`,
            role: foundStatic.role || "member"
          };
        }

        // 2) 再查数据库（兼容原逻辑）
        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          email: `${user.username}@example.com`,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "member";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token as any).role || "member";
        session.user.id = token.sub || "unknown";
      }
      return session;
    }
  }
};

export const authHandler = NextAuth(authOptions);

