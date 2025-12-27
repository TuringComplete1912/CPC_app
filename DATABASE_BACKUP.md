# 数据库备份指南

## ⚠️ 重要提示

数据库文件 `prisma/dev.db` 已添加到 `.gitignore`，**不会被 Git 跟踪**。

这意味着：
- ✅ 数据保存在本地，不会丢失（除非删除文件）
- ⚠️ 数据不会被 Git 提交到仓库
- ⚠️ 克隆仓库后需要重新创建数据库
- ⚠️ 需要手动备份数据库文件

## 📦 备份方法

### 方法1：手动复制文件
```bash
# Windows
copy prisma\dev.db prisma\dev.db.backup

# 或者复制到其他位置
copy prisma\dev.db D:\backups\cpc_app_backup_20251227.db
```

### 方法2：使用脚本备份
创建一个备份脚本 `backup-db.bat`:
```batch
@echo off
set BACKUP_DIR=backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
copy prisma\dev.db %BACKUP_DIR%\dev.db.%TIMESTAMP%.backup

echo 备份完成: %BACKUP_DIR%\dev.db.%TIMESTAMP%.backup
```

运行备份：
```bash
backup-db.bat
```

## 🔄 恢复方法

### 从备份恢复
```bash
# 停止应用（如果正在运行）
# 然后复制备份文件

copy prisma\dev.db.backup prisma\dev.db
```

## 📅 建议的备份策略

1. **每日备份**（如果有重要数据更新）
2. **重大操作前备份**（如数据库迁移、批量修改）
3. **定期备份到云存储**（OneDrive、百度云等）

## 🆕 新环境部署

如果在新电脑或新环境部署：

1. 克隆代码仓库
2. 安装依赖: `npm install`
3. 复制数据库文件到 `prisma/dev.db`（如果有备份）
4. 或者创建新数据库: `npx prisma migrate dev`
5. 设置管理员: `npx tsx prisma/set-admins.ts`

## 📊 数据库信息

- **位置**: `D:\CPC_app\prisma\dev.db`
- **类型**: SQLite
- **当前大小**: 172KB
- **Git 状态**: 已忽略（不会提交到仓库）

## 🔒 安全建议

1. **定期备份**：至少每周备份一次
2. **多地备份**：本地 + 云存储
3. **测试恢复**：定期测试备份文件是否可用
4. **权限控制**：确保数据库文件只有授权人员可以访问

## 📝 备份检查清单

- [ ] 设置定期备份计划
- [ ] 测试备份文件可以正常恢复
- [ ] 将备份文件保存到安全位置
- [ ] 记录备份时间和内容
- [ ] 定期清理旧备份（保留最近30天）

## 🛠️ 快速命令

```bash
# 检查数据库状态
npx tsx prisma/check-status.ts

# 查看数据库文件
dir prisma\dev.db

# 备份数据库
copy prisma\dev.db prisma\dev.db.backup

# 恢复数据库
copy prisma\dev.db.backup prisma\dev.db
```

---

**记住**: 数据库文件是您所有党务信息的唯一存储位置，请务必定期备份！
