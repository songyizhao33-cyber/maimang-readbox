# Codex 任务板

**文档用途**: 定义后续开发任务的详细清单和执行顺序  
**当前版本**: v0.1  
**最后更新**: 2026-04-29

---

## Phase 0: 项目基础（已完成）

### T00: 创建项目文档和规则 ✅
**状态**: 已完成  
**优先级**: 高  
**依赖**: 无

**任务描述**:
- 创建所有项目文档
- 创建 CLAUDE.md
- 创建 Cursor 规则
- 创建任务板

**验收标准**:
- [x] 所有文档已创建
- [x] CLAUDE.md 包含 Karpathy 原则
- [x] Cursor 规则已配置

---

### T01: 初始化 Next.js 项目 ✅
**状态**: 已完成  
**优先级**: 高  
**依赖**: 无

**任务描述**:
- 初始化 Next.js + TypeScript + Tailwind
- 配置 ESLint 和 Prettier
- 创建基础目录结构

**验收标准**:
- [x] Next.js 项目可运行
- [x] TypeScript 配置正确
- [x] Tailwind CSS 可用

---

### T02: 配置 Supabase 客户端 ⏳
**状态**: 待完成  
**优先级**: 高  
**依赖**: T01

**任务描述**:
- 安装 @supabase/supabase-js 和 @supabase/ssr
- 创建 Supabase 客户端配置
- 配置环境变量

**涉及文件**:
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- .env.example

**验收标准**:
- [ ] Supabase 客户端可用
- [ ] 环境变量配置正确
- [ ] TypeScript 类型正确

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T03: 创建数据库 migration ⏳
**状态**: 待完成  
**优先级**: 高  
**依赖**: T02

**任务描述**:
- 创建 0001_initial_schema.sql
- 定义 11 个核心表
- 配置 RLS 策略
- 创建必要索引

**涉及文件**:
- supabase/migrations/0001_initial_schema.sql

**验收标准**:
- [ ] SQL 文件语法正确
- [ ] 所有表已定义
- [ ] RLS 策略已配置
- [ ] 索引已创建

**验证命令**:
```bash
supabase db reset
supabase db push
```

---

### T04: 创建基础布局和导航 ⏳
**状态**: 待完成  
**优先级**: 高  
**依赖**: T01

**任务描述**:
- 创建应用布局组件
- 创建导航栏
- 创建侧边栏
- 实现响应式布局

**涉及文件**:
- src/components/layout/app-shell.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/topbar.tsx

**验收标准**:
- [ ] 布局组件可用
- [ ] 导航栏显示正确
- [ ] 移动端适配

**验证命令**:
```bash
pnpm dev
# 手动测试布局
```

---

### T05: 创建 API health check ✅
**状态**: 已完成  
**优先级**: 高  
**依赖**: T01

**任务描述**:
- 创建 /api/health 接口
- 返回服务状态

**验收标准**:
- [x] 接口可访问
- [x] 返回正确格式

---

### T06: 创建领域类型 ⏳
**状态**: 待完成  
**优先级**: 高  
**依赖**: T03

**任务描述**:
- 创建 domain.ts（领域类型）
- 创建 api.ts（API 类型）
- 创建 database.ts（数据库类型占位）

**涉及文件**:
- src/types/domain.ts
- src/types/api.ts
- src/types/database.ts

**验收标准**:
- [ ] 类型定义完整
- [ ] 与数据库 schema 一致
- [ ] TypeScript 无错误

**验证命令**:
```bash
pnpm tsc --noEmit
```

---

## Phase 1: 用户与作者（高优先级）

### T10: 实现用户注册登录
**状态**: 待完成  
**优先级**: 高  
**依赖**: T02, T03

**任务描述**:
- 使用 Supabase Auth 实现邮箱密码注册
- 实现登录功能
- 实现登出功能
- 注册后自动创建 profiles 记录

**涉及文件**:
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/api/auth/register/route.ts
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts

**验收标准**:
- [ ] 用户可以通过邮箱密码注册
- [ ] 注册后自动创建 profiles 记录
- [ ] 用户可以登录并获得 JWT token
- [ ] 用户可以登出
- [ ] 登录状态持久化

**不做什么**:
- ❌ 不实现第三方登录
- ❌ 不实现手机号登录
- ❌ 不实现邮箱验证（MVP）
- ❌ 不实现密码重置（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
# 手动测试注册登录流程
```

---

### T11: 实现用户 profile 管理
**状态**: 待完成  
**优先级**: 高  
**依赖**: T10

**任务描述**:
- 实现查看用户 profile
- 实现编辑用户 profile
- 实现头像上传（可选）

**涉及文件**:
- src/app/settings/page.tsx
- src/app/api/me/profile/route.ts

**验收标准**:
- [ ] 用户可以查看自己的 profile
- [ ] 用户可以编辑 displayName 和 bio
- [ ] 修改后立即生效

**不做什么**:
- ❌ 不实现修改邮箱（MVP）
- ❌ 不实现修改密码（MVP）
- ❌ 不实现账号注销（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T12: 实现作者 profile 创建
**状态**: 待完成  
**优先级**: 高  
**依赖**: T11

**任务描述**:
- 实现创建作者身份
- 实现编辑作者信息
- 实现作者列表查询

**涉及文件**:
- src/app/author/dashboard/page.tsx
- src/app/api/authors/route.ts
- src/app/api/authors/[id]/route.ts

**验收标准**:
- [ ] 用户可以创建作者身份
- [ ] 用户只能创建一个作者身份
- [ ] 作者可以编辑笔名、简介、头像
- [ ] 可以查询作者列表

**不做什么**:
- ❌ 不实现作者认证（MVP）
- ❌ 不实现作者等级（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T13: 实现作者主页
**状态**: 待完成  
**优先级**: 高  
**依赖**: T12

**任务描述**:
- 实现作者主页展示
- 显示作者信息
- 显示作者文章列表
- 显示订阅按钮

**涉及文件**:
- src/app/authors/[id]/page.tsx
- src/components/author/author-card.tsx

**验收标准**:
- [ ] 可以访问作者主页
- [ ] 显示作者基本信息
- [ ] 显示作者已发布文章
- [ ] 显示订阅者数量

**不做什么**:
- ❌ 不实现作者关注（MVP）
- ❌ 不实现作者排行（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T14: 实现作者写作草稿
**状态**: 待完成  
**优先级**: 高  
**依赖**: T12

**任务描述**:
- 实现文章创建
- 实现文章编辑
- 实现草稿保存
- 实现文章列表

**涉及文件**:
- src/app/author/write/page.tsx
- src/app/author/articles/page.tsx
- src/app/api/articles/route.ts
- src/app/api/articles/[id]/route.ts

**验收标准**:
- [ ] 作者可以创建文章
- [ ] 作者可以编辑文章
- [ ] 作者可以保存草稿
- [ ] 作者可以查看自己的文章列表
- [ ] 草稿不对外可见

**不做什么**:
- ❌ 不实现富文本编辑器（MVP 使用 textarea）
- ❌ 不实现 Markdown 编辑器（可选）
- ❌ 不实现图片上传（MVP）
- ❌ 不实现自动保存（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T15: 实现作者发布文章
**状态**: 待完成  
**优先级**: 高  
**依赖**: T14

**任务描述**:
- 实现文章发布功能
- 发布后状态变为 published
- 发布后不可再编辑（MVP）

**涉及文件**:
- src/app/api/articles/[id]/publish/route.ts

**验收标准**:
- [ ] 作者可以发布草稿
- [ ] 发布后状态变为 published
- [ ] 发布后文章对外可见
- [ ] 发布时间记录正确

**不做什么**:
- ❌ 不实现定时发布（MVP）
- ❌ 不实现发布后编辑（MVP）
- ❌ 不实现文章撤回（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

## Phase 2: 订阅与收件箱（高优先级）

### T20: 实现订阅作者功能
**状态**: 待完成  
**优先级**: 高  
**依赖**: T13

**任务描述**:
- 实现订阅作者
- 实现查询订阅列表
- 实现订阅状态查询

**涉及文件**:
- src/app/api/subscriptions/route.ts
- src/app/api/me/subscriptions/route.ts

**验收标准**:
- [ ] 用户可以订阅作者
- [ ] 不能重复订阅同一作者
- [ ] 可以查询自己的订阅列表
- [ ] 可以查询是否已订阅某作者

**不做什么**:
- ❌ 不实现付费订阅（MVP）
- ❌ 不实现订阅通知（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T21: 实现取消订阅功能
**状态**: 待完成  
**优先级**: 高  
**依赖**: T20

**任务描述**:
- 实现取消订阅
- 取消后不再接收新文章

**涉及文件**:
- src/app/api/subscriptions/[id]/route.ts

**验收标准**:
- [ ] 用户可以取消订阅
- [ ] 取消后不再接收新文章
- [ ] 已接收的文章仍保留在收件箱

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T22: 实现发布文章后生成 inbox_items
**状态**: 待完成  
**优先级**: 高  
**依赖**: T15, T20

**任务描述**:
- 文章发布时，为所有订阅者创建 inbox_items
- 使用数据库触发器或 API 逻辑实现

**涉及文件**:
- src/app/api/articles/[id]/publish/route.ts
- 或 supabase/migrations/0002_inbox_trigger.sql

**验收标准**:
- [ ] 文章发布后，所有订阅者收件箱中出现该文章
- [ ] inbox_items 状态为 unread
- [ ] received_at 时间正确

**不做什么**:
- ❌ 不实现邮件通知（MVP）
- ❌ 不实现推送通知（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
# 手动测试发布流程
```

---

### T23: 实现 Inbox 列表页
**状态**: 待完成  
**优先级**: 高  
**依赖**: T22

**任务描述**:
- 实现收件箱列表查询
- 实现分页
- 实现筛选（未读/已读/星标/归档）

**涉及文件**:
- src/app/inbox/page.tsx
- src/app/api/inbox/route.ts
- src/components/inbox/inbox-item-card.tsx

**验收标准**:
- [ ] 可以查看收件箱列表
- [ ] 按接收时间倒序排列
- [ ] 可以筛选未读/已读/星标/归档
- [ ] 分页正常工作

**不做什么**:
- ❌ 不实现搜索（MVP）
- ❌ 不实现批量操作（MVP）

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T24: 实现已读、星标、归档状态管理
**状态**: 待完成  
**优先级**: 高  
**依赖**: T23

**任务描述**:
- 实现标记已读/未读
- 实现星标/取消星标
- 实现归档

**涉及文件**:
- src/app/api/inbox/[id]/status/route.ts
- src/app/api/inbox/[id]/star/route.ts
- src/app/api/inbox/[id]/archive/route.ts

**验收标准**:
- [ ] 可以标记已读/未读
- [ ] 可以星标/取消星标
- [ ] 可以归档
- [ ] 状态变更立即生效

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

### T25: 实现 Inbox 筛选功能
**状态**: 待完成  
**优先级**: 高  
**依赖**: T24

**任务描述**:
- 实现按状态筛选
- 实现按星标筛选
- 实现筛选 UI

**涉及文件**:
- src/app/inbox/page.tsx

**验收标准**:
- [ ] 可以筛选未读
- [ ] 可以筛选已读
- [ ] 可以筛选星标
- [ ] 可以筛选归档
- [ ] 筛选条件可组合

**验证命令**:
```bash
pnpm lint
pnpm build
```

---

## Phase 3: 外部保存与待读（中优先级）

### T30-T34: 外部内容功能
详见 docs/06_external_content_policy.md

### T34: 实现外部内容详情页
**状态**: 已完成
**优先级**: 中
**依赖**: T30, T31, T32, T33

**任务描述**:
- 实现登录用户私密查看自己保存的 external item 详情页
- 支持从 `/later` 列表卡片进入 `/external-items/[id]`
- 详情页展示手动保存的元数据与合规提示，不展示第三方全文

**涉及文件**:
- src/app/(reader)/external-items/[id]/page.tsx
- src/components/external/external-item-card.tsx
- src/lib/constants/routes.ts

**验收标准**:
- [x] 登录用户可以从 `/later` 进入自己的 `/external-items/[id]`
- [x] 详情页显示 `title`、`sourcePlatform`、`authorName`、`sourceUrl`、`excerpt`、`contentType`、`legalNote`、`createdAt`、`updatedAt`
- [x] 详情页提供“返回 Later”入口
- [x] 详情页提供原文链接入口
- [x] 未登录访问详情页显示登录引导
- [x] 非本人 item 或不存在 item 返回 404 或等价 notFound 状态
- [x] 不展示 `original_content` / `extracted_content`
- [x] 不做自动抓取、OCR、AI 摘要、公开分享
- [x] 不修改 schema / RLS
- [x] `pnpm lint` 通过
- [x] `corepack pnpm build` 通过

**不做什么**:
- ❌ 不做详情页编辑器增强
- ❌ 不做自动抓取、URL metadata fetch、OpenGraph 抓取
- ❌ 不做 OCR、AI 摘要、批量导入
- ❌ 不做公开分享页、评论、推荐、热榜
- ❌ 不展示第三方全文
- ❌ 不修改数据库 schema、RLS policy、service role key 使用方式

**验证命令**:
```bash
pnpm lint
corepack pnpm build
```

---

## Phase 4: 专题和笔记（中优先级）

### T40-T45: 专题和笔记功能
详见 docs/03_module_map.md

### T40: 实现创建专题
**状态**: 已完成
**优先级**: 中
**依赖**: T10

**任务描述**:
- 实现登录用户创建自己的 collection
- 实现 `GET /api/collections` 返回当前用户自己的 collection 列表
- 在 `/collections` 页面提供最小创建表单和当前用户专题列表
- T40 只做 collection 本体，不做 `collection_items`，不把文章或 external item 加入专题

**涉及文件**:
- src/app/api/collections/route.ts
- src/app/(reader)/collections/page.tsx
- src/components/collections/collections-panel.tsx

**验收标准**:
- [x] T40 正式定义已补充到任务板
- [x] 未登录 `POST /api/collections` 返回 401
- [x] 未登录 `GET /api/collections` 返回 401
- [x] 登录用户可以创建 collection
- [x] 前端传 `user_id`、`id`、`created_at`、`updated_at` 会被拒绝
- [x] 登录用户只能看到自己的 collections
- [x] 同一用户重复 `name` 有明确错误处理
- [x] `/collections` 页面能创建并展示当前用户专题
- [x] 不实现编辑、删除、添加内容到专题
- [x] 不修改 schema / RLS
- [x] `pnpm lint` 通过
- [x] `corepack pnpm build` 通过

**不做什么**:
- ❌ 不做 `PATCH /api/collections/:id`
- ❌ 不做 `DELETE /api/collections/:id`
- ❌ 不做 `POST /api/collections/:id/items`
- ❌ 不做 `DELETE /api/collections/:id/items/:itemId`
- ❌ 不做 articles / external_items 加入专题
- ❌ 不做 notes / reflections / 标签 / 搜索 / 公开分享 / 协作专题
- ❌ 不修改数据库 schema、RLS policy
- ❌ 不使用 service role key

**验证命令**:
```bash
pnpm lint
corepack pnpm build
```

---

### T41: 实现编辑和删除专题
**状态**: 已完成
**优先级**: 中
**依赖**: T40

**任务描述**:
- 实现 `PATCH /api/collections/:id`，仅允许登录用户编辑自己的 collection 本体
- 实现 `DELETE /api/collections/:id`，仅允许登录用户删除自己的 collection 本体
- 在 `/collections` 页面提供最小编辑/删除交互
- T41 只做 collection 本体，不做 `collection_items`，不把 articles 或 external_items 加入专题

**涉及文件**:
- src/app/api/collections/[id]/route.ts
- src/components/collections/collections-panel.tsx
- TASKS.md
- docs/08_codex_task_board.md

**验收标准**:
- [x] 未登录 `PATCH /api/collections/:id` 返回 401
- [x] 未登录 `DELETE /api/collections/:id` 返回 401
- [x] 登录用户可以编辑自己的 collection
- [x] 登录用户可以删除自己的 collection
- [x] 编辑后 `GET /api/collections` 返回更新结果
- [x] 删除后 `GET /api/collections` 不再返回该 collection
- [x] 其他用户不能编辑或删除该 collection，返回 404
- [x] 不存在 collection 返回 404
- [x] 非法字段 `id` / `user_id` / `created_at` / `updated_at` 被拒绝
- [x] 同一用户下重复 `name` 返回 409
- [x] `/collections` 页面提供编辑入口
- [x] `/collections` 页面提供删除入口
- [x] 删除前有轻量确认
- [x] 编辑/删除成功后列表即时更新
- [x] 没有实现 `collection_items`
- [x] 没有修改 schema / RLS
- [x] `pnpm lint` 通过
- [x] `corepack pnpm build` 通过

**不做什么**:
- 不做 `POST /api/collections/:id/items`
- 不做 `DELETE /api/collections/:id/items/:itemId`
- 不做 articles / external_items 加入专题
- 不做 notes / reflections / 标签 / 搜索 / 公开分享 / 协作专题 / 推荐
- 不修改数据库 schema、migration、RLS policy
- 不使用 service role key

**验证命令**:
```bash
pnpm lint
corepack pnpm build
```

---

### T42: 实现加入专题
**状态**: 已完成
**优先级**: 中
**依赖**: T41

**任务描述**:
- 实现 `POST /api/collections/:id/items`，允许登录用户把内容加入自己的 collection
- 实现 `DELETE /api/collections/:id/items/:itemId`，允许登录用户从自己的 collection 移除内容
- 优先提供最小 UI 验证路径：在 `/later` 的 external item 卡片上加入 “Add to collection” 入口
- T42 仅验证 external_item 的前端加入路径；article 仅做 API 支持，不做额外 UI

**涉及文件**:
- src/app/api/collections/[id]/items/route.ts
- src/app/api/collections/[id]/items/[itemId]/route.ts
- src/app/(reader)/later/page.tsx
- src/components/external/external-items-panel.tsx
- src/components/external/external-item-card.tsx
- src/app/(reader)/collections/page.tsx
- TASKS.md
- docs/08_codex_task_board.md

**验收标准**:
- [x] 未登录 `POST /api/collections/:id/items` 返回 401
- [x] 登录用户可以把自己的 external_item 加入自己的 collection
- [x] 登录用户不能把别人的 external_item 加入自己的 collection
- [x] 登录用户不能向别人的 collection 添加 item
- [x] 登录用户可以把 published article 加入自己的 collection
- [x] draft article 不能加入 collection
- [x] 重复加入返回 409
- [x] 登录用户可以从自己的 collection 移除 item
- [x] 不能从别人的 collection 移除 item
- [x] DELETE 只删除 `collection_items`，不删除 `articles` / `external_items`
- [x] `/later` 提供最小 external item 加入专题入口
- [x] 没有实现 notes / reflections / 标签 / 搜索 / 公开分享 / 协作专题 / 推荐
- [x] 没有修改 schema / migration / RLS
- [x] 没有使用 service role key
- [x] `pnpm lint` 通过
- [x] `corepack pnpm build` 通过

**不做什么**:
- 不做 notes / reflections
- 不做标签系统
- 不做搜索
- 不做公开分享
- 不做协作专题
- 不做推荐
- 不做专题公开页
- 不做批量加入
- 不做自动分类
- 不做 `GET /api/collections/:id/items`
- 不做 article 加入专题 UI
- 不修改数据库 schema、migration、RLS policy
- 不使用 service role key

**验证命令**:
```bash
pnpm lint
corepack pnpm build
```

---

## Phase 5: 管理与安全（低优先级）

### T50-T54: 管理后台功能
详见 docs/03_module_map.md

---

**文档状态**: ✅ 完成  
**下一步**: 查看 `docs/09_progress_checkpoints.md` 了解进度检查机制
