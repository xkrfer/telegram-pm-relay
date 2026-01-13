# Telegram PM Relay

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

**A Telegram Private Message Relay Bot based on Cloudflare Workers**

Supports multiple verification methods, intelligent rate limiting, blocklist management, quick replies, and more.

[English](README.md) • [中文](README_CN.md)

</div>

---

## ✨ Features

### Core Features
- 🚀 **Serverless Architecture** - Built on Cloudflare Workers, zero server maintenance
- 💾 **D1 Database** - Uses Cloudflare D1 (SQLite) for data storage
- 📱 **Two-way Message Relay** - Seamless messaging between admin and users
- 🔍 **Full-text Search** - Efficient message search powered by FTS5
- 🌍 **Multi-language Support** - English and Chinese interface

### Security & Protection
- 🔒 **Multiple Verification Methods** - Math, Quiz, Turnstile, AI verification
- 🛡️ **Intelligent Rate Limiting** - Multi-tier rate limiting strategies
- 🚫 **Blocklist Management** - Import/export, temporary/permanent bans
- ⏰ **Automated Tasks** - Cron job for cleaning expired data

### Productivity Tools
- 📝 **Quick Reply Templates** - Custom templates for efficient responses
- 📊 **Statistics & Analytics** - Real-time bot usage statistics
- 💬 **Message History** - Complete conversation record management
- 🔔 **Smart Notifications** - Silent hours automatic control

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Telegram Bot Token](https://core.telegram.org/bots#6-botfather)

### Installation

```bash
# Clone the repository
git clone https://github.com/xkrfer/telegram-pm-relay.git
cd telegram-pm-relay

# Install dependencies
bun install
```

### Configuration

1. **Edit config file** (`wrangler.jsonc`):

```jsonc
{
  "vars": {
    "LANGUAGE": "en",
    "BOT_SECRET": "your-webhook-secret",
    "ADMIN_UID": "your-telegram-id",
    "VERIFICATION_BASE_URL": "https://your-worker.workers.dev"
  }
}
```

2. **Set Secrets**:

```bash
# Bot Token
npx wrangler secret put BOT_TOKEN

# Turnstile Secret (optional)
npx wrangler secret put CLOUDFLARE_TURNSTILE_SECRET_KEY
```

3. **Create Database**:

```bash
# Create D1 database
npx wrangler d1 create telegram_pm_relay

# Copy the returned database_id to wrangler.jsonc d1_databases.database_id
```

4. **Apply Migrations**:

```bash
# Local testing
npx wrangler d1 migrations apply DB --local

# Production
npx wrangler d1 migrations apply DB --remote
```

### Run

```bash
# Local development
npm run dev

# Deploy to production
npm run deploy
```

### Set Webhook

After successful deployment, set up the Telegram Webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-worker.workers.dev/webhook",
    "secret_token": "your-webhook-secret"
  }'
```

## 🌍 Language Configuration

Set the `LANGUAGE` environment variable to switch between languages:

| Value | Language |
|-------|----------|
| `en` | English (default) |
| `zh` | Chinese |

Example in `wrangler.jsonc`:
```jsonc
{
  "vars": {
    "LANGUAGE": "en"
  }
}
```

## 🎮 Admin Commands

### Basic Operations
```
Reply to user message        Direct reply to forwarded messages
/start                      Show admin command list
/check                      View user details (reply to message)
/history                    View conversation history (reply to message)
```

### Quick Replies
```
/template add <key> <content>   Add quick reply template
/template list                   List all templates
/template delete <key>           Delete template
/reply <key>                     Reply using template (reply to message)
/<key>                           Shortcut (reply to message)
```

### Search & Statistics
```
/search <keyword>         Search message content
/stats                    View bot statistics
```

### Blocklist Management
```
/ban <user_id> [reason] [hours]    Ban user
/unban <user_id>                   Unban user
/banlist                           View blocklist
/export                            Export blocklist CSV
/import                            Import blocklist (reply to CSV file)
```

### Verification Management
```
/verification status            View verification system status
/verification set <method>      Set verification method (math/quiz/turnstile/ai)
/verification enable            Enable verification system
/verification disable           Disable verification system
/verify <user_id>               Send verification link to user
/reverify <user_id>             Clear user verification status
/reset-verification <user_id>   Reset verification attempt count
```

## 🔒 Verification Methods

| Method | Description | Requirements | Recommended |
|--------|-------------|--------------|-------------|
| **Math** | Simple arithmetic | None | ⭐⭐⭐⭐⭐ |
| **Quiz** | Built-in quiz bank | None | ⭐⭐⭐⭐⭐ |
| **Turnstile** | Cloudflare CAPTCHA | Site Key + Secret Key | ⭐⭐⭐⭐ |
| **AI** | AI-generated questions | AI API Key | ⭐⭐ |

**Switch verification method:**
```bash
/verification set math
```

## 🏗️ Tech Stack

| Category | Technology | Description |
|----------|------------|-------------|
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge computing |
| Web Framework | [Hono.js](https://hono.dev/) | Lightweight high-performance framework |
| Bot SDK | [Grammy](https://grammy.dev/) | Modern Telegram Bot framework |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe ORM |
| Language | TypeScript | Type safety |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

Made with ❤️ using Cloudflare Workers

</div>
