<div align="center">

# Telegram PM Relay

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

**基于 Cloudflare Workers 的 Telegram 私信中继机器人**

支持多种验证方式、智能限流、黑名单管理、快捷回复等功能。

[English](README.md) • [中文](README_CN.md)

</div>

---

## ✨ 功能特性

### 核心功能
- 🚀 **Serverless 架构** - 基于 Cloudflare Workers，零服务器运维
- 💾 **D1 数据库** - 使用 Cloudflare D1 (SQLite) 存储数据
- 📱 **双向消息中继** - 管理员与用户间的无缝消息传递
- 🔍 **全文搜索** - 基于 FTS5 的高效消息搜索
- 🌍 **多语言支持** - 支持英文和中文界面

### 安全与防护
- 🔒 **多种验证方式** - Math、Quiz、Cloudflare Workers AI 三种验证方式
- 🛡️ **智能限流** - 多级限流策略，防止消息滥用
- 🚫 **黑名单管理** - 支持导入/导出，临时/永久封禁
- ⏰ **自动化任务** - Cron 定时清理过期数据

### 效率工具
- 📝 **快捷回复模板** - 自定义模板，提高回复效率
- 📊 **统计分析** - 实时查看机器人使用情况
- 💬 **消息历史** - 完整的对话记录管理
- 🔔 **智能通知** - 静默时段自动控制

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- [Telegram Bot Token](https://core.telegram.org/bots#6-botfather)

### 安装

```bash
# 克隆仓库
git clone https://github.com/xkrfer/telegram-pm-relay.git
cd telegram-pm-relay

# 安装依赖
bun install
```

### 配置

1. **编辑配置文件** (`wrangler.jsonc`):

```jsonc
{
  "vars": {
    "LANGUAGE": "zh",
    "BOT_SECRET": "your-webhook-secret",
    "ADMIN_UID": "your-telegram-id",
    "VERIFICATION_BASE_URL": "https://your-worker.workers.dev"
  }
}
```

2. **设置 Secrets**:

```bash
# Bot Token
npx wrangler secret put BOT_TOKEN
```

3. **创建数据库**:

```bash
# 创建 D1 数据库
npx wrangler d1 create telegram_pm_relay

# 复制返回的 database_id 到 wrangler.jsonc 的 d1_databases.database_id
```

4. **应用数据库迁移**:

```bash
# 本地测试
npx wrangler d1 migrations apply DB --local

# 生产环境
npx wrangler d1 migrations apply DB --remote
```

### 运行

```bash
# 本地开发
npm run dev

# 部署到生产环境
npm run deploy
```

### 设置 Webhook

部署成功后，设置 Telegram Webhook：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-worker.workers.dev/webhook",
    "secret_token": "your-webhook-secret"
  }'
```

## 🌍 语言配置

通过设置 `LANGUAGE` 环境变量来切换语言：

| 值 | 语言 |
|----|------|
| `en` | 英文（默认） |
| `zh` | 中文 |

在 `wrangler.jsonc` 中设置示例：
```jsonc
{
  "vars": {
    "LANGUAGE": "zh"
  }
}
```

## 🎮 管理命令

### 基本操作
```
回复用户消息              直接回复转发来的消息
/start                  查看管理员命令列表
/check                  查看用户详细信息（回复消息）
/history                查看对话历史（回复消息）
```

### 快捷回复
```
/template add <key> <content>   添加快捷回复模板
/template list                   列出所有模板
/template delete <key>           删除模板
/reply <key>                     使用模板回复（回复消息）
/<key>                           快捷方式（回复消息）
```

### 搜索与统计
```
/search <关键词>         搜索消息内容
/stats                  查看机器人统计信息
```

### 黑名单管理
```
/ban <user_id> [原因] [小时]    封禁用户
/unban <user_id>                解除封禁
/banlist                        查看黑名单
/export                         导出黑名单 CSV
/import                         导入黑名单（回复 CSV 文件）
```

### 验证管理
```
/verification status            查看验证系统状态
/verification set <方式>        设置验证方式 (math/quiz/ai)
/verification enable            启用验证系统
/verification disable           禁用验证系统
/verify <user_id>               发送验证题目给指定用户
/reverify <user_id>             清除用户验证状态
/reset-verification <user_id>   重置验证尝试次数
```

## 🔒 验证方式

| 方式 | 说明 | 配置要求 | 推荐度 |
|------|------|----------|--------|
| **Math** | 简单算术题 | 无 | ⭐⭐⭐⭐⭐ |
| **Quiz** | 内置题库问答 | 无 | ⭐⭐⭐⭐⭐ |
| **AI** | AI 生成问题 | Cloudflare Workers AI 绑定 (`AI`) | ⭐⭐ |

AI 出题直接使用 `wrangler.jsonc` 中的 `AI` 绑定（Cloudflare Workers AI），模型为 `@cf/qwen/qwen3.8-27b`，无需外部 API 地址或密钥。使用 `/verification set ai` 启用。生成失败时不会放行用户，请重试或切换为 math/quiz。

升级时运行 `bun run db:migrations:apply`：旧 Turnstile 配置会切换为 math，旧网页验证会话将清除，已验证用户不受影响。旧 Turnstile 密钥、AI API 密钥/地址及 `VERIFICATION_BASE_URL` 不再使用。`/verify` 直接向用户发送 Telegram 按钮题目。Workers AI 本地开发也需要连接 Cloudflare 账号，会使用账号的 AI 配额。

**切换验证方式：**
```bash
/verification set math
```

## 🏗️ 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 运行环境 | [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless 边缘计算 |
| Web 框架 | [Hono.js](https://hono.dev/) | 轻量级高性能框架 |
| Bot SDK | [Grammy](https://grammy.dev/) | 现代化 Telegram Bot 框架 |
| 数据库 | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) | 类型安全的 ORM |
| 语言 | TypeScript | 类型安全 |

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️ Star！**

Made with ❤️ using Cloudflare Workers

</div>
