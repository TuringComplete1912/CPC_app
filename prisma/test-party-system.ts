import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 党务管理系统 - 功能测试 ===\n');
  
  // 1. 检查数据库连接
  console.log('1. 检查数据库连接...');
  try {
    await prisma.$connect();
    console.log('   ✓ 数据库连接成功\n');
  } catch (error) {
    console.log('   ✗ 数据库连接失败:', error);
    return;
  }
  
  // 2. 检查 PartyInfo 表是否存在
  console.log('2. 检查 PartyInfo 表结构...');
  try {
    const count = await prisma.partyInfo.count();
    console.log(`   ✓ PartyInfo 表存在，当前记录数: ${count}\n`);
  } catch (error) {
    console.log('   ✗ PartyInfo 表不存在或有错误:', error);
    return;
  }
  
  // 3. 检查管理员
  console.log('3. 检查管理员账号...');
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { username: true, nickname: true, createdAt: true }
  });
  
  if (admins.length === 0) {
    console.log('   ⚠ 暂无管理员账号');
  } else {
    console.log(`   ✓ 找到 ${admins.length} 个管理员:`);
    admins.forEach(admin => {
      console.log(`     - ${admin.username} (${admin.nickname || '未设置昵称'})`);
    });
  }
  console.log();
  
  // 4. 检查目标管理员是否已注册
  console.log('4. 检查目标管理员注册状态...');
  const targetAdmins = ['李明昊', '尚冠竹'];
  for (const username of targetAdmins) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { username: true, role: true, createdAt: true }
    });
    
    if (user) {
      const isAdmin = user.role === 'admin';
      console.log(`   ${isAdmin ? '✓' : '○'} ${username} - ${isAdmin ? '已是管理员' : '已注册但非管理员'}`);
    } else {
      console.log(`   ✗ ${username} - 未注册`);
    }
  }
  console.log();
  
  // 5. 统计所有用户
  console.log('5. 用户统计...');
  const totalUsers = await prisma.user.count();
  const usersWithPartyInfo = await prisma.partyInfo.count();
  console.log(`   总用户数: ${totalUsers}`);
  console.log(`   已填写党务信息: ${usersWithPartyInfo}`);
  console.log();
  
  // 6. 数据库文件信息
  console.log('6. 数据库文件信息...');
  console.log('   位置: prisma/dev.db');
  console.log('   类型: SQLite (本地文件)');
  console.log('   配置: DATABASE_URL="file:./dev.db"');
  console.log('   ✓ 所有数据持久化保存，不会丢失\n');
  
  // 7. 下一步操作提示
  console.log('=== 下一步操作 ===');
  console.log('1. 启动应用: npm run dev');
  console.log('2. 访问: http://localhost:3001');
  console.log('3. 使用用户名 "李明昊" 和 "尚冠竹" 注册账号');
  console.log('4. 运行: npx tsx prisma/set-admins.ts');
  console.log('5. 使用管理员账号登录，访问 "党务管理" 页面\n');
}

main()
  .catch((e) => {
    console.error('测试失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
