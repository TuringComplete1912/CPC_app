import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 党务管理系统 - 管理员设置工具 ===\n');
  
  // 设置李明昊和尚冠竹为管理员
  const adminUsernames = ['李明昊', '尚冠竹'];
  
  console.log('正在设置管理员权限...\n');
  
  for (const username of adminUsernames) {
    try {
      const user = await prisma.user.findUnique({
        where: { username }
      });

      if (user) {
        await prisma.user.update({
          where: { username },
          data: { role: 'admin' }
        });
        console.log(`✓ ${username} 已设置为管理员`);
      } else {
        console.log(`✗ 用户 ${username} 不存在`);
        console.log(`  提示: 请使用用户名 "${username}" 在系统中注册后再运行此脚本`);
      }
    } catch (error) {
      console.error(`✗ 设置 ${username} 失败:`, error);
    }
  }
  
  // 显示所有管理员
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { username: true, nickname: true, role: true, createdAt: true }
  });
  
  console.log('\n=== 当前管理员列表 ===');
  if (admins.length === 0) {
    console.log('暂无管理员');
  } else {
    admins.forEach(admin => {
      console.log(`- ${admin.username} (${admin.nickname || '未设置昵称'}) - 注册时间: ${admin.createdAt.toLocaleString('zh-CN')}`);
    });
  }
  
  console.log('\n数据库位置: prisma/dev.db');
  console.log('所有党务信息都保存在本地数据库文件中，不会丢失。\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
