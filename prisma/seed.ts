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

  await prisma.user.upsert({
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

