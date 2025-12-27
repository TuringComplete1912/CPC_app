import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 党务管理系统 - 快速状态检查 ===\n');
  
  // 管理员
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { username: true, nickname: true }
  });
  
  console.log(`管理员 (${admins.length}):`);
  admins.forEach(admin => {
    console.log(`  ✓ ${admin.username} (${admin.nickname || '未设置昵称'})`);
  });
  
  // 用户统计
  const totalUsers = await prisma.user.count();
  const usersWithPartyInfo = await prisma.partyInfo.count();
  
  console.log(`\n用户统计:`);
  console.log(`  总用户: ${totalUsers}`);
  console.log(`  已填写党务信息: ${usersWithPartyInfo}`);
  
  // 政治面貌统计
  if (usersWithPartyInfo > 0) {
    const partyInfos = await prisma.partyInfo.findMany({
      select: { politicalStatus: true }
    });
    
    const statusCount: Record<string, number> = {};
    partyInfos.forEach(info => {
      statusCount[info.politicalStatus] = (statusCount[info.politicalStatus] || 0) + 1;
    });
    
    console.log(`\n政治面貌分布:`);
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }
  
  console.log(`\n数据库: prisma/dev.db ✓`);
}

main()
  .catch((e) => {
    console.error('检查失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
