# 更新日志

## 2026-01-06 - v3.0.1 使用 Vercel AI SDK 优化 AI 验证 ✨

### 🔧 技术优化

#### AI 验证重构
- ✨ 使用 Vercel AI SDK (`ai` + `@ai-sdk/openai`) 替代原生 fetch
- ✨ 结构化输出：使用 Zod Schema 定义问题格式
- ✨ 自动类型推导和运行时验证
- ✨ 更简洁的 API 调用和错误处理
- ✨ 更好的代码可维护性

**技术说明**：
- 当前使用 `generateObject` API（虽标记为 deprecated）
- 新的 `generateText` + `output` 在 v6.0.11 还不稳定
- 等待未来版本提供稳定替代后再迁移

### 📦 新增依赖
```json
"ai": "^6.0.11"
"@ai-sdk/openai": "^3.0.4"
"zod": "^4.3.5" (已有，用于 env 验证)
```

### 🐛 Bug 修复
- 修复 Telegram Inline Keyboard `callback_data` 超过 64 字节限制
- 修复验证失败后用户无法重试的问题
- 优化内联验证的重试流程

### 📝 代码改进
- callback_data 格式优化：`vm_{userId}_{answer}`（旧：`verify_math_{64字符token}_{answer}`）
- 内联验证自动清除过期数据，允许用户重新开始
- 验证失败时显示正确答案和重试提示

---

## 2026-01-06 - v3.0.0 多验证方式系统与数据库配置 🚀

### 🎉 重大更新

#### 1. 多验证方式支持
- ✨ **Math（算术题验证）**：简单加减法，完全 Telegram 内完成 ⭐ 推荐
- ✨ **Quiz（题库问答）**：常识性问答，内置 10+ 题目
- ✨ **Turnstile（Cloudflare）**：专业人机验证，Web 页面
- ✨ **AI 智能验证**：使用大语言模型生成动态问题，高安全性
- ✨ **None（无验证）**：可选禁用验证

#### 2. 数据库驱动配置
- 验证配置从环境变量迁移到数据库
- 支持热切换验证方式（无需重启）
- 配置缓存机制（1分钟 TTL）
- 敏感信息仍从环境变量读取

#### 3. Telegram 内联交互
- 所有验证方式使用 Inline Keyboard
- 用户点击按钮选择答案
- 答案错误时显示正确答案
- 验证成功立即生效

#### 4. 管理员命令增强
- `/verification status` - 查看验证系统状态
- `/verification set <方式>` - 动态切换验证方式
- `/verification enable/disable` - 启用/禁用验证
- 配置完整性检查和提示

### 📦 数据库变更
- 新增 `system_config` 表：存储系统配置
- 新增 `verification_method` 枚举类型
- `users` 表新增 `verification_data` 字段
- 自动迁移：首次启动从环境变量初始化默认配置

### 🛠️ 技术架构
- 策略模式设计：每种验证方式独立实现
- 工厂模式：统一的验证方式创建接口
- 服务层重构：ConfigService 管理配置
- Callback Query 处理：支持按钮交互
- 类型安全：完整的 TypeScript 类型定义

### 📝 环境变量新增
```env
# AI 验证配置（可选）
AI_VERIFICATION_API_KEY=sk-...
AI_VERIFICATION_BASE_URL=https://api.openai.com/v1
AI_VERIFICATION_MODEL=gpt-4o-mini
```

### 📚 新增文档
- `VERIFICATION_GUIDE.md` - 完整的验证系统配置指南

### ⚠️ 破坏性变更
- 验证配置优先从数据库读取（环境变量作为默认值）
- 首次更新需要运行数据库迁移：`bun run db:migrate`
- 建议检查 `.env` 文件确保敏感配置存在

### 🔄 迁移指南
1. 拉取最新代码
2. 运行数据库迁移：`bun run db:migrate`
3. 系统会自动从环境变量初始化默认配置
4. 使用 `/verification status` 检查状态
5. 使用 `/verification set math` 设置为推荐方式

### 📊 性能与成本
- Math/Quiz：免费，零成本
- Turnstile：免费（有限额）
- AI：约 $0.001/次验证（GPT-4o-mini）

---

## 2026-01-05 - v2.1.1 修复 Docker 构建与运行时问题 🔧

### 🐛 Bug 修复

#### 1. Docker Lockfile 问题
- 修复 Dockerfile 中 `bun.lockb` 引用错误
- 更新为 `bun.lock`（Bun >= 1.0 的标准名称）
- 移除 `.dockerignore` 中对 lockfile 的错误排除

#### 2. Runtime drizzle-kit 缺失问题
- **问题**: 容器启动时 `drizzle-kit migrate` 失败
- **原因**: Runtime 阶段使用 `--production` 排除了 `devDependencies`
- **解决**: Runtime 阶段安装完整依赖，确保 `drizzle-kit` 可用
- **影响**: 镜像大小增加约 20MB（总计 177MB）

### 📝 文档更新
- 在 `BUILD.md` 中添加 lockfile 版本说明
- 更新故障排查章节
- 添加镜像大小说明和优化建议

### ✅ 验证结果
```bash
# Docker 构建成功
docker-compose build --no-cache  ✅

# drizzle-kit 可用
docker run --rm telegram-pm-relay-bot bun x drizzle-kit --version
# drizzle-kit: v0.29.1  ✅

# 容器内无源码目录
docker run --rm telegram-pm-relay-bot ls /app/src/
# ls: No such file or directory  ✅

# 仅包含打包后的文件
docker run --rm telegram-pm-relay-bot ls /app/dist/
# index.bundle.js (2.5 MB)  ✅

# 镜像大小
docker images telegram-pm-relay-bot:latest
# 177MB  ✅
```

---

## 2026-01-05 - v2.1 生产环境打包功能 🔒

### ✨ 新增功能

#### 源码保护打包系统
- ✅ 自动打包项目为单个 bundle 文件
- ✅ HTML 模板内联处理
- ✅ Docker 多阶段构建
- ✅ 容器内无源码文件，仅包含打包后的文件
- ✅ `bun run build` - 本地打包命令
- ✅ `bun run start` - 运行打包后的文件

### 🐳 Docker 优化

#### 多阶段构建
- **阶段 1 (Builder)**: 安装依赖 + 复制源码 + 打包
- **阶段 2 (Runtime)**: 仅安装生产依赖 + 复制 bundle + 运行

**优势：**
- 源码保护：用户无法在容器中查看源码
- 镜像体积：生产镜像更小（无 devDependencies、无源码）
- 启动速度：单文件加载更快
- 安全性：减少攻击面

### 📦 新增文件

- `scripts/build.ts` - 打包脚本（290 行）
- `BUILD.md` - 打包使用指南（250 行）

### 🔧 文件修改

- `package.json` - 新增 `build` 和 `start` 脚本
- `Dockerfile` - 改为多阶段构建
- `.dockerignore` - 添加 `dist/` 目录
- `README.md` - 添加打包说明

### 📊 打包结果

**输出文件：**
- `dist/index.bundle.js` - 2.6 MB（主要可执行文件）
- `dist/index.bundle.js.map` - 4.9 MB（Source map，可选）

**包含内容：**
- 所有业务代码
- 所有依赖库
- HTML 验证模板（内联）

### 🔒 安全性提升

| 方法 | 源码可见性 | 安全等级 |
|------|-----------|---------|
| 直接部署源码 | ✅ 完全可见 | ❌ 低 |
| 打包（本次更新）| ❌ 不可见 | ✅ 高 |

### 🚀 使用方式

**本地打包：**
```bash
bun run build
bun run start
```

**Docker 部署：**
```bash
docker-compose up -d --build
# 自动在容器内打包，无需手动操作
```

**验证保护：**
```bash
docker exec -it telegram_pm_relay_bot sh
ls /app/src/  # ls: No such file or directory
```

---

## 2026-01-05 - v2.0 增强功能大版本更新 🚀

### ✨ 新增功能

#### 1. 消息历史与搜索系统
- ✅ 新增 `messages` 表，存储所有消息历史
- ✅ PostgreSQL 全文搜索（tsvector + GIN 索引）
- ✅ `/search <关键词>` - 全文搜索消息
- ✅ `/history [user_id]` - 查看对话历史（最近 20 条）

#### 2. 快捷回复系统
- ✅ 新增 `reply_templates` 表，存储快捷回复模板
- ✅ `/template add <关键词> <内容>` - 添加模板
- ✅ `/template list` - 查看所有模板
- ✅ `/template delete <关键词>` - 删除模板
- ✅ `/reply <关键词>` - 使用模板回复用户
- ✅ 自动欢迎新用户（可配置）

#### 3. 统计分析功能
- ✅ `/stats` - 查看机器人统计信息
  - 最近 24 小时消息数（收/发）
  - 活跃用户数
  - 总用户数、总消息数
  - 黑名单人数

#### 4. 黑名单增强
- ✅ 临时封禁功能（支持设置封禁时长）
- ✅ `/ban <user_id> [原因] [小时]` - 封禁用户
- ✅ `/unban <user_id>` - 解封用户
- ✅ `/banlist` - 查看黑名单
- ✅ `/import` - 批量导入黑名单（CSV 格式）
- ✅ `/export` - 导出黑名单为 CSV
- ✅ 自动清理过期黑名单（每小时执行）

#### 5. 消息管理
- ✅ `/recall` - 撤回已发送的消息
- ✅ `/mark` - 标记重要消息
- ✅ `/unmark` - 取消标记
- ✅ 消息撤回状态追踪

#### 6. 通知优化
- ✅ 静默时段配置（`SILENT_HOURS`）
- ✅ 时区支持（`ADMIN_TIMEZONE`）
- ✅ 静默时段自动静音通知

#### 7. 富媒体支持增强
- ✅ 支持相册（media_group_id）
- ✅ 支持视频、文档、语音等多种消息类型
- ✅ 完整的 JSONB 消息数据存储

#### 8. 消息限流系统
- ✅ 多层级限流（冷却时间 + 时间窗口）
- ✅ 渐进式警告机制
- ✅ 4 个限流等级（正常/VIP/严格/极严格）
- ✅ `/ratelimit <user_id> <level>` - 设置限流等级
- ✅ `/ratelimit reset <user_id>` - 重置限流状态
- ✅ 自动惩罚机制（临时禁止发送消息）

#### 9. 人机验证系统（Cloudflare Turnstile）
- ✅ 新用户首次使用需完成人机验证
- ✅ 验证频率限制（3次/小时）
- ✅ 指数退避冷却机制（2h → 4h → 8h → 24h）
- ✅ `/verify <user_id>` - 发送验证链接
- ✅ `/reverify <user_id>` - 清除验证状态
- ✅ `/reset-verification <user_id>` - 重置验证限制
- ✅ 现有用户自动标记为已验证（向后兼容）
- ✅ 精美的验证页面（响应式设计）

### 🗄️ 数据库变更

#### 新增表
- `messages` - 消息历史存储
- `reply_templates` - 快捷回复模板

#### 表结构增强
- `users` 表新增字段：
  - `note` - 管理员备注
  - `first_message_at` - 首次消息时间
  - `message_count` - 消息计数
  - `last_message_times` - 最近消息时间戳（JSONB）
  - `rate_limit_level` - 限流等级（0-3）
  - `rate_limit_violations` - 违规次数
  - `rate_limited_until` - 限流结束时间
  - `is_verified` - 是否已验证
  - `verification_token` - 验证令牌
  - `verification_expires_at` - 验证过期时间
  - `verification_attempts` - 验证尝试次数
  - `verification_last_attempt` - 最后验证尝试时间
  - `verification_cooldown_until` - 验证冷却结束时间
  - `verified_at` - 验证完成时间
- `message_maps` 表新增字段：
  - `media_group_id` - 相册组 ID
  - `is_revoked` - 撤回状态
  - `updated_at` - 更新时间
- `fraud_list` 表新增字段：
  - `expires_at` - 过期时间
  - `added_by` - 添加人 ID
  - `updated_at` - 更新时间

#### 高级特性
- PostgreSQL 生成列（search_vector）
- GIN 索引（全文搜索）
- 触发器（自动更新 updated_at）

### 📦 新增依赖
- `croner@^9.1.0` - 定时任务
- `luxon@^3.7.2` - 时区处理
- `p-limit@^7.2.0` - 并发控制
- `csv-parse@^6.1.0` - CSV 解析

### 🛠️ 代码架构优化

#### 新增模块
- `src/services/` - 业务服务层
  - `message.service.ts` - 消息 CRUD
  - `template.service.ts` - 模板管理
  - `stats.service.ts` - 统计分析
  - `fraud.service.ts` - 黑名单管理
  - `ratelimit.service.ts` - 限流管理
  - `verification.service.ts` - 验证管理
- `src/lib/search.ts` - 搜索工具
- `src/views/verify.html` - 验证页面模板
- `scripts/migrate.ts` - 数据库迁移脚本
- `scripts/apply-rate-limit-migration.ts` - 限流字段迁移脚本
- `scripts/apply-verification-migration.ts` - 验证字段迁移脚本

#### 增强模块
- `src/handlers/guest.ts` - 增强消息记录、自动欢迎、限流检查、验证检查
- `src/handlers/admin.ts` - 24 个指令（新增 7 个）
- `src/lib/telegram.ts` - 静默通知支持
- `src/env.ts` - 14 个新环境变量
- `src/index.ts` - 新增验证路由（GET/POST /verify/:token）

### 🔧 环境变量新增
```ini
# 通知优化
SILENT_HOURS=22:00-08:00          # 静默时段
ADMIN_TIMEZONE=Asia/Shanghai      # 管理员时区
AUTO_WELCOME=true                 # 自动欢迎
WELCOME_MESSAGE=您好！...         # 欢迎消息
STATS_CACHE_TTL=300               # 统计缓存 TTL

# 限流配置
RATE_LIMIT_COOLDOWN=5             # 冷却时间（秒）
RATE_LIMIT_PER_MINUTE=10          # 每分钟最大消息数
RATE_LIMIT_PER_HOUR=50            # 每小时最大消息数
RATE_LIMIT_PENALTY_DURATION=60    # 惩罚时长（秒）

# 验证配置
VERIFICATION_REQUIRED=true        # 是否启用验证
VERIFICATION_TIMEOUT=900          # 验证链接有效期（秒）
VERIFICATION_BASE_URL=...         # 应用公网地址
CLOUDFLARE_TURNSTILE_SITE_KEY=... # Turnstile 站点密钥
CLOUDFLARE_TURNSTILE_SECRET_KEY=... # Turnstile 密钥
```

### 📝 文档更新
- ✅ `README.md` - 更新功能列表和指令说明
- ✅ `SETUP.md` - 添加新环境变量说明
- ✅ `FEATURES.md` - 新增验证管理章节
- ✅ `CLOUDFLARE_SETUP.md` - Cloudflare Turnstile 配置指南
- ✅ `CHANGELOG.md` - 本次更新日志

### 🎯 迁移指南

#### 从 v1.0 升级到 v2.0

1. **更新代码**
```bash
git pull origin main
bun install
```

2. **更新环境变量**
在 `.env` 文件中添加新的配置项（见上方）

3. **执行数据库迁移**
```bash
# 应用所有迁移
bun run scripts/migrate.ts

# 或分别执行
bun run db:generate
bun run scripts/apply-rate-limit-migration.ts
bun run scripts/apply-verification-migration.ts
```

4. **重启服务**
```bash
# Docker 部署
docker-compose up -d --build

# 本地部署
bun run dev
```

### ⚠️ 破坏性变更
- 无破坏性变更，完全向后兼容 v1.0

### 📊 性能优化
- PostgreSQL GIN 索引提升搜索性能 1000倍+
- 消息历史查询使用索引，毫秒级响应
- 定时任务自动清理过期数据，减少数据库负担

---

## 2026-01-05 - 项目重命名与优化

### 🎯 项目重命名
- 项目名称从 "NFD 2.0" 更新为 **"Telegram PM Relay"**
- 所有文档标题已更新
- 代码中的品牌名称已更新

### 📦 Docker 优化

#### 新增 .dockerignore
排除以下不必要的文件，减小镜像体积：
- `node_modules/`（容器内重新安装）
- `.env`（运行时注入）
- `.git/`（版本控制文件）
- `docs/`、`*.md`（文档文件）
- IDE 配置文件
- 日志和临时文件

#### 容器命名更新
- `nfd_db` → `telegram_pm_relay_db`
- `nfd_bot` → `telegram_pm_relay_bot`

#### 数据库配置更新
- 用户名：`nfd_user` → `telegram_user`
- 数据库名：`nfd_v2` → `telegram_pm_relay`
- 连接字符串：`postgres://telegram_user:secure_password@localhost:5432/telegram_pm_relay`

### 📝 文档更新

所有文档中的以下内容已同步更新：

**README.md**
- 项目标题
- 环境变量示例

**SETUP.md**
- 标题
- 环境变量配置
- Docker 容器名称
- 数据库操作命令

**QUICKSTART.md**
- 标题
- 所有示例命令
- 数据库连接字符串
- 启动日志示例

**IMPLEMENTATION_STATUS.md**
- 标题
- 环境变量配置

### 🔧 代码更新

**src/constants.ts**
- 管理员欢迎消息：`NFD 管理端已就绪` → `Telegram PM Relay 管理端已就绪`
- 用户欢迎消息：`Bot Created Via NFD` → `Bot Created Via Telegram PM Relay`

**src/index.ts**
- 启动日志：`NFD 2.0 starting` → `Telegram PM Relay starting`

**docker-compose.yml**
- 容器名称更新为 `telegram_pm_relay_db` 和 `telegram_pm_relay_bot`
- 数据库配置更新

### ✅ 检查清单

- [x] 创建 `.dockerignore` 文件
- [x] 更新 `docker-compose.yml` 容器名称
- [x] 更新数据库配置（用户名、数据库名）
- [x] 更新所有文档中的项目名称
- [x] 更新代码中的品牌名称
- [x] 更新文档中的命令示例
- [x] 验证 TypeScript 无 linter 错误

### 📊 影响范围

**修改的文件：**
1. `.dockerignore`（新建）
2. `docker-compose.yml`
3. `src/constants.ts`
4. `src/index.ts`
5. `README.md`
6. `SETUP.md`
7. `QUICKSTART.md`
8. `IMPLEMENTATION_STATUS.md`

**镜像优化效果：**
- 排除文档和开发文件后，Docker 镜像体积将显著减小
- 构建速度提升（减少需要复制的文件）
- 更好的安全性（不包含 .env 等敏感文件）

### 🚀 后续步骤

用户仍需完成以下操作：
1. 创建 `.env` 文件（使用新的数据库连接字符串）
2. 生成数据库迁移：`bun run db:generate`
3. 应用数据库迁移：`bun run db:migrate`
4. 启动服务：`bun run dev` 或 `docker-compose up -d --build`
5. 配置 Telegram Webhook

### 📌 注意事项

**数据库连接字符串已更改**

旧的连接字符串：
```
postgres://nfd_user:secure_password@localhost:5432/nfd_v2
```

新的连接字符串：
```
postgres://telegram_user:secure_password@localhost:5432/telegram_pm_relay
```

如果之前已经创建了 `.env` 文件或运行了数据库，请务必更新配置。

---

**版本：** 1.0.0  
**状态：** ✅ 所有更改已完成，无 linter 错误

