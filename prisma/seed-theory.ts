import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 获取第一个用户作为创建者
  const firstUser = await prisma.user.findFirst();
  
  if (!firstUser) {
    console.log("没有找到用户，请先创建用户");
    return;
  }

  // 创建理论学习分类
  const theoryCategories = [
    {
      name: "马克思列宁主义",
      description: "马克思列宁主义基本原理和经典著作学习",
      type: "theory"
    },
    {
      name: "毛泽东思想",
      description: "毛泽东思想理论体系和重要著作学习",
      type: "theory"
    },
    {
      name: "习近平新时代中国特色社会主义思想",
      description: "习近平新时代中国特色社会主义思想学习",
      type: "theory"
    }
  ];

  for (const category of theoryCategories) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name }
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          creatorId: firstUser.id
        }
      });
      console.log(`✓ 创建分类: ${category.name}`);
    } else {
      console.log(`- 分类已存在: ${category.name}`);
    }
  }

  console.log("\n理论学习分类创建完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
