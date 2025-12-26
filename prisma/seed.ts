import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "123456";
  const role = "admin";
  const nickname = "管理员";
  const department = "组织部";
  const avatar = "https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff";

  const hashed = await bcrypt.hash(password, 10);

  const adminUser = await prisma.user.upsert({
    where: { username },
    update: { password: hashed, role, nickname, department, avatar },
    create: {
      username,
      password: hashed,
      role,
      nickname,
      department,
      avatar
    }
  });

  console.log("Seed completed: admin user ready (username: admin, password: 123456)");

  // 创建初始板块（如果不存在）
  const categories = [
    { name: "土力学", description: "土力学相关学习资料和课程内容" },
    { name: "结构力学", description: "结构力学相关学习资料和课程内容" },
    { name: "混凝土设计原理", description: "混凝土设计原理相关学习资料和课程内容" }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
        creatorId: adminUser.id
      }
    });
  }

  console.log("Seed completed: Initial categories created (土力学, 结构力学, 混凝土设计原理)");

  // 创建2025/12/27飞盘活动草稿
  const existingWorkLog = await prisma.workLog.findFirst({
    where: {
      title: "2025/12/27 飞盘活动"
    }
  });

  if (!existingWorkLog) {
    const workLog = await prisma.workLog.create({
      data: {
        title: "2025/12/27 飞盘活动",
        content: `# 飞盘活动安排

## 活动时间
2025年12月27日 下午14:00-17:00

## 活动地点
学校体育场

## 活动内容
1. 飞盘基础教学
2. 分组对抗赛
3. 自由活动时间

## 注意事项
- 请穿着运动服装和运动鞋
- 自备饮用水
- 注意安全，避免受伤

## 报名方式
请在本周五前联系组织委员报名

欢迎大家积极参与！`,
        status: "draft",
        authorId: adminUser.id
      }
    });

    // 添加管理员为编辑者
    await prisma.workLogEditor.create({
      data: {
        workLogId: workLog.id,
        userId: adminUser.id
      }
    });

    console.log("Seed completed: 2025/12/27 飞盘活动草稿已创建");
  } else {
    console.log("Seed skipped: 2025/12/27 飞盘活动草稿已存在");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

