# 麦芒订阅项目交接材料清单

更新时间：2026-05-07  
适用场景：把当前 `maimang-readbox` 工作区转移到另一个 GPT / Codex 对话继续开发。  
本文件只做状态整理，不引入新功能，不输出任何真实密钥。

---

# 0. 本轮执行记录

## 0.1 `pwd`

```text
E:\自建项目\麦芒订阅\maimang-readbox
```

## 0.2 `git status --short --branch --untracked-files=all`

以下是执行该命令时看到的工作区状态：

```text
## master
 M TASKS.md
 M docs/08_codex_task_board.md
 M src/app/(reader)/collections/page.tsx
 M src/app/(reader)/later/page.tsx
 M src/app/api/collections/route.ts
 M src/components/collections/collections-panel.tsx
 M src/components/external/external-item-card.tsx
 M src/components/external/external-items-panel.tsx
?? src/app/api/collections/[id]/items/[itemId]/route.ts
?? src/app/api/collections/[id]/items/route.ts
?? src/app/api/collections/[id]/route.ts
warning: unable to access 'C:\Users\21218/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\21218/.config/git/ignore': Permission denied
```

说明：
- 这份状态不包含本文件 `docs/PROJECT_HANDOFF_MATERIALS.md`，因为它是在整理完成后新增的。
- `warning: unable to access C:\Users\21218/.config/git/ignore` 仍然存在，属于本机 Git 全局 ignore 访问权限告警，不影响本仓库代码本身。
- 文档写完后的最终工作区状态见第 6 节，以第 6 节为“当前待提交内容”的准确信息。

## 0.3 `pnpm lint`

结果：通过。  
说明：本轮执行时未看到 ESLint 错误。

## 0.4 `corepack pnpm build`

结果：通过。  
说明：Next.js 生产构建成功，包含当前已存在和工作区中的 `collections` / `collection_items` 相关 Route Handlers。

## 0.5 `git log --oneline -n 12`

```text
c52a425 feat: add collection edit and delete flow
312aef6 feat: add private collection creation flow
5a8c26d feat: add private external item detail page
a384c89 feat: add external content compliance messaging
98ce292 feat: add external item delete flow
fd6cf32 feat: add external item detail and inline editing
92e5d70 feat: add minimal external items api and later page
14f57ea feat: add inbox filter views
baac747 feat: add inbox item status actions
7bedb71 feat: implement reader inbox list api and page
0ef9589 feat: add publish fanout rpc for subscriber inbox delivery
ad60365 feat: complete author subscribe and unsubscribe flow
```

## 0.6 明确不要提交 / 不要转移到对话中

以下内容已确认存在或必须按规则排除：

- `.env.local`：存在。不要提交，不要复制到新对话，不要输出真实值。
- `supabase/.temp/`：存在。是本地 Supabase CLI 状态目录，不要提交，不要转移。
- `.codex-*.log`：本轮检查结果为空，但若后续再次出现，也不要提交，不要转移。
- `.codex-*.pid`：本轮检查结果为空，但若后续再次出现，也不要提交，不要转移。
- 任何包含 token、数据库密码、`SUPABASE_SERVICE_ROLE_KEY` 的文件：不要提交，不要转移，不要贴进对话。

---

# 1. 项目基本信息

- 项目名称：`麦芒订阅 / Maimang Readbox`
- 一句话定位：一个反信息流的、安静的深度阅读收件箱与个人资料整理平台。
- 产品核心理念：用户主动订阅作者，文章像收信一样进入 Inbox；用户也可以手动保存外部链接/摘录到 Later，再通过 Collections、Notes、Reflections 做长期整理。
- 当前项目根目录：`E:\自建项目\麦芒订阅\maimang-readbox`
- 当前 Git 分支：`master`
- 当前 Git 状态：脏工作区，但最终复核后只剩 2 个业务 UI 文件未提交，外加本交接文档未跟踪。
- 当前是否存在未提交改动：存在。
- 当前是否存在不应提交的临时文件：存在，至少包括 `.env.local` 和 `supabase/.temp/`。

当前工作区的任务状态需要分层理解：

- Git 已提交到 `master` 的最新专题任务是 `T41`，对应 commit `c52a425 feat: add collection edit and delete flow`。
- 实际上 `c52a425` 的提交内容已经混入了大部分 `T42` 后端与页面 wiring，只是 commit message 仍写成了 `T41`。
- 当前尚未提交的是 `T42` 的最小 external item 卡片 UI 补丁。
- 因此，下一个对话不应直接跳到 `T43`，而应先确认并提交当前 `T42` 工作区改动。

---

# 2. 技术栈

## 2.1 主栈

- 前端：Next.js `16.2.4` + React `19.2.4` + TypeScript `5`
- 样式：Tailwind CSS `4`
- 后端入口：Next.js App Router + Route Handlers
- 数据层：Supabase PostgreSQL
- 认证：Supabase Auth
- 权限控制：PostgreSQL Row Level Security（RLS）
- 包管理：`pnpm`
- Corepack：构建命令使用 `corepack pnpm build`

## 2.2 Supabase 使用情况

- 使用 `@supabase/supabase-js` 和 `@supabase/ssr`
- 浏览器端和服务端各有独立 Supabase client factory
- 当前代码只使用匿名 key + RLS，不使用 `service role key`
- 认证、页面读取、Route Handler 写入都走普通用户会话，不绕过 RLS

## 2.3 Supabase CLI 使用情况

仓库已按 Supabase CLI 方式组织：

- `supabase/migrations/` 存放 migration
- `supabase/.temp/` 是本地 CLI 状态目录
- 常见命令在文档中已有记录：
  - `supabase link --project-ref <project-id>`
  - `supabase db push`
  - `supabase db reset`
  - `npx supabase gen types typescript --project-id <project-id> > src/types/database.ts`

注意：

- `src/types/database.ts` 目前仍是手写占位类型，不是 CLI 生成结果。

## 2.4 本地验证常用命令

- `pnpm lint`
- `corepack pnpm build`
- `pnpm dev`
- `pnpm start`
- 如需做真实登录态 API 烟测，通常是先启动本地服务，再通过 `/api/auth/register`、`/api/auth/login` 获取登录态后逐条验证目标 API

## 2.5 为什么项目使用 App Router / Route Handlers

原因是当前产品形态和技术边界都适合 Next.js 一体化：

- 仓库已经以 `src/app` 为中心组织页面与 API，避免引入额外后端框架
- 页面天然适合 Server Component + cookie 感知的 Supabase SSR client
- Route Handlers 能直接表达 Auth / RLS / 表单提交流程
- 对当前 MVP 而言，App Router 足够覆盖页面、登录态校验、最小 CRUD、SSR 读取

---

# 3. 环境变量清单

只列 `.env.example` 中定义的变量，不读取也不输出 `.env.local` 真实值。

| 变量名 | 用途 | 是否可暴露到浏览器 | 当前代码是否使用 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 可以 | 使用中 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key，前端/SSR 客户端使用 | 可以，但安全依赖 RLS | 使用中 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端高权限 key | 不可以，只能服务端使用 | 已文档化，但当前代码明确不使用 |
| `NEXT_PUBLIC_APP_URL` | 应用基础 URL | 可以 | 用于本地/部署环境配置 |

明确结论：

- `NEXT_PUBLIC_SUPABASE_URL`：可暴露到浏览器。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：可暴露到浏览器，但必须依赖 RLS 保证数据安全。
- `SUPABASE_SERVICE_ROLE_KEY`：只能服务端使用，严禁暴露到浏览器。
- 当前代码是否使用 `service role key`：否。
- `.env.local`：存在，但不应提交、不应转移、不应在对话中展示。

---

# 4. 数据库与 migration 清单

## 4.1 Migrations

### `0001_initial_schema.sql`

作用：

- 创建 11 张核心业务表
- 建立基础索引、约束、唯一键
- 开启并定义 baseline RLS policy
- 预留若干后续 TODO：
  - `T10`：`profiles` 创建机制
  - `T43`：public note 规则
  - `T44/T45`：public reflection 规则
  - `T50-T52`：admin moderation 规则

### `0002_create_profile_on_signup.sql`

作用：

- 为 `auth.users` 创建 `AFTER INSERT` 触发器
- 自动插入 `public.profiles`
- 保证 `profiles.id = auth.users.id`
- 默认角色为 `reader`

### `0003_publish_article_and_fanout.sql`

作用：

- 创建 `publish_article_and_fanout(UUID)` RPC
- 只允许当前登录作者发布自己的 draft article
- 发布成功后按订阅关系 fan-out 到 `inbox_items`
- 通过现有唯一索引保证 fan-out 幂等
- `GRANT EXECUTE` 只给 `authenticated`

## 4.2 11 张核心表

| 表名 | 大致用途 | 关键字段 | RLS 原则 |
| --- | --- | --- | --- |
| `profiles` | 平台用户基础资料 | `id`, `email`, `display_name`, `role` | 仅本人可读写本人资料 |
| `author_profiles` | 作者公开资料卡 | `user_id`, `pen_name`, `bio`, `homepage_url`, `is_active` | active 作者资料可公开读；本人可读写自己的作者资料 |
| `articles` | 作者文章草稿与已发布文章 | `author_id`, `slug`, `status`, `published_at` | published 文章可公开读；作者本人可读写自己的文章 |
| `subscriptions` | 读者订阅作者关系 | `reader_id`, `author_id` | 仅订阅者本人可查看/创建/删除自己的订阅 |
| `external_items` | 用户手动保存的外部内容元数据 | `user_id`, `url`, `title`, `excerpt`, `content_type`, `legal_note` | 仅本人可读写删除自己的 external item |
| `inbox_items` | 订阅文章投递到读者收件箱的关系表 | `user_id`, `source_type`, `article_id`, `status`, `is_starred` | 仅本人可读写自己的 inbox items |
| `collections` | 用户私有专题/书架 | `user_id`, `name`, `description` | 仅本人可读写删除自己的 collections |
| `collection_items` | 专题与 article / external_item 的关联关系 | `collection_id`, `item_type`, `article_id`, `external_item_id` | 仅集合 owner 可读写删除其 collection_items |
| `notes` | 针对 article / external_item 的笔记 | `user_id`, `item_type`, `selected_text`, `content`, `visibility` | 仅本人可读写；public 规则尚未开放 |
| `reflections` | 针对 article / external_item 的读后感 | `user_id`, `item_type`, `content`, `visibility` | 仅本人可读写；public 规则尚未开放 |
| `moderation_reports` | 举报与审核入口 | `reporter_id`, `target_type`, `reason`, `status` | 当前仅 reporter 自己可读；authenticated 可创建；admin 规则未实现 |

## 4.3 多态与约束要点

- `inbox_items`：`source_type = platform_article | external_link`，要求 `article_id` / `external_item_id` 二选一
- `collection_items`：`item_type = article | external_item`，要求 `article_id` / `external_item_id` 二选一
- `notes`、`reflections`：同样是 `article | external_item` 多态结构
- `subscriptions`、`collections`、`collection_items` 都有唯一约束防止重复关系

---

# 5. 已完成任务清单

说明：

- `已提交完成`：已进入 Git 历史，可从 `git log` 看到。
- `本地已完成未提交`：已在当前工作区实现，但未进入 Git 历史。
- `未正式定义`：仓库里没有单独编号，只能按相邻正式任务归档说明。

## 5.1 用户与作者

### `T10` 已提交完成

- 完成内容：邮箱密码注册、登录、退出；注册后自动创建 `profiles`
- 主要文件：
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/logout/route.ts`
  - `supabase/migrations/0002_create_profile_on_signup.sql`
- 真实验证：
  - 后续任务烟测多次实际调用过 `/api/auth/register` 和 `/api/auth/login`
  - 本轮未单独复跑 `/api/auth/logout`
- 明确没有做：
  - 第三方登录
  - magic link
  - 找回密码
- 是否可视为完成：可以

### `T10.5` 未正式定义

- 仓库 `TASKS.md` / `docs/08_codex_task_board.md` 中没有单独 `T10.5`
- 可理解为 `T10` 的真实登录态补充验证，但没有单独 commit / 正式定义
- 结论：不要把它当成独立开发范围，作为 `T10` 的验证补充看待

### `T11` 已提交完成

- 完成内容：`/settings` 页面可读取并更新当前用户 `profile`
- 主要文件：
  - `src/app/(reader)/settings/page.tsx`
  - `src/app/api/me/route.ts`
  - `src/app/api/me/profile/route.ts`
- 真实验证：
  - 历史任务记录为已完成
  - 本轮未重新逐条复跑
- 明确没有做：
  - 改邮箱
  - 改密码
  - 注销账号
- 是否可视为完成：可以

### `T12` 已提交完成

- 完成内容：创建作者身份、编辑作者资料、作者列表 API
- 主要文件：
  - `src/app/(author)/author/dashboard/page.tsx`
  - `src/app/api/authors/route.ts`
  - `src/app/api/authors/[id]/route.ts`
- 真实验证：
  - 历史任务记录为已完成
  - 本轮未重新逐条复跑
- 明确没有做：
  - 作者认证
  - 多 author profile
- 是否可视为完成：可以

### `T13` 已提交完成

- 完成内容：公开作者列表页、作者详情页、最小订阅入口
- 主要文件：
  - `src/app/authors/page.tsx`
  - `src/app/authors/[id]/page.tsx`
  - `src/components/author/author-card.tsx`
- 真实验证：
  - 页面与 API 已在已提交历史中
  - 本轮未重跑整套浏览器链路
- 明确没有做：
  - 推荐作者
  - 排行
  - 复杂 feed
- 是否可视为完成：可以

### `T14` 已提交完成

- 完成内容：作者草稿创建/编辑 API 与写作页面
- 主要文件：
  - `src/app/(author)/author/write/page.tsx`
  - `src/app/(author)/author/articles/page.tsx`
  - `src/app/api/articles/route.ts`
  - `src/app/api/articles/[id]/route.ts`
- 真实验证：
  - 已进入 Git 历史
  - 本轮未重跑完整草稿编辑链路
- 明确没有做：
  - 富文本编辑器
  - 图片上传
  - 自动保存
- 是否可视为完成：可以

### `T15` 已提交完成

- 完成内容：受控发布、public article 页面、已发布不可再按 draft 编辑
- 主要文件：
  - `src/app/api/articles/[id]/publish/route.ts`
  - `src/app/(reader)/articles/[id]/page.tsx`
- 真实验证：
  - 本轮为 `T42` 烟测时实际创建 article、发布 article、再加入 collection，间接覆盖发布链路
- 明确没有做：
  - 定时发布
  - 回滚发布
  - 发布后继续编辑
- 是否可视为完成：可以

## 5.2 订阅与 Inbox

### `T20` 已提交完成

- 完成内容：订阅作者、订阅状态查询、我的订阅列表
- 主要文件：
  - `src/app/api/subscriptions/route.ts`
  - `src/app/api/subscriptions/by-author/[authorId]/route.ts`
  - `src/app/api/me/subscriptions/route.ts`
  - `src/components/author/author-subscribe-button.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮未单独复跑
- 明确没有做：
  - 付费订阅
  - 订阅通知
- 是否可视为完成：可以

### `T20.5` 未正式定义

- 仓库内没有单独编号
- 可视为被 `T20` 吸收的订阅状态补充能力，主要落在 `/api/subscriptions/by-author/[authorId]`
- 是否可视为完成：只能视为 `T20` 的一部分，不单独追踪

### `T21` 已提交完成

- 完成内容：取消订阅
- 主要文件：
  - `src/app/api/subscriptions/by-author/[authorId]/route.ts`
  - `src/components/author/author-subscribe-button.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮未单独复跑
- 明确没有做：
  - 批量退订
- 是否可视为完成：可以

### `T22` 已提交完成

- 完成内容：发布文章时 fan-out 到 subscriber inbox
- 主要文件：
  - `supabase/migrations/0003_publish_article_and_fanout.sql`
  - `src/app/api/articles/[id]/publish/route.ts`
- 真实验证：
  - 发布 article 的真实烟测在本轮被间接覆盖
- 明确没有做：
  - 邮件通知
  - 推送通知
- 是否可视为完成：可以

### `T22.5` 未正式定义

- 仓库内没有单独编号
- 可以视为 `T22` 的 RPC 化与幂等补强，实际落在 commit `0ef9589`
- 是否可视为完成：作为 `T22` 的内部完成细化，不单独追踪

### `T23` 已提交完成

- 完成内容：最小 Inbox 列表 API 与页面
- 主要文件：
  - `src/app/(reader)/inbox/page.tsx`
  - `src/app/api/inbox/route.ts`
  - `src/components/inbox/inbox-list.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮未单独复跑
- 明确没有做：
  - 搜索
  - 批量操作
- 是否可视为完成：可以

### `T24` 已提交完成

- 完成内容：已读/阅读中/归档/星标状态修改
- 主要文件：
  - `src/app/api/inbox/[id]/route.ts`
  - `src/components/inbox/inbox-item-card.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮未单独复跑
- 明确没有做：
  - 复杂批量状态操作
- 是否可视为完成：可以

### `T25` 已提交完成

- 完成内容：Inbox filter tabs 与 `filter` 查询参数视图
- 主要文件：
  - `src/app/(reader)/inbox/page.tsx`
  - `src/components/inbox/inbox-filter-tabs.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮未单独复跑
- 明确没有做：
  - 搜索
  - 自定义排序
- 是否可视为完成：可以

## 5.3 External content / Later

### `T30` 已提交完成

- 完成内容：最小 external item 保存 API 与 Later 页面
- 主要文件：
  - `src/app/api/external-items/route.ts`
  - `src/app/(reader)/later/page.tsx`
  - `src/components/external/external-items-panel.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮仍可看到该页面与 API 生效
- 明确没有做：
  - 自动抓取网页
  - 自动解析元数据
  - 批量导入
- 是否可视为完成：可以

### `T30.5` 仓库未要求，未单独追踪

- 当前没有正式 `T30.5`
- 不建议在新对话中自行发明此编号

### `T31` 已提交完成

- 完成内容：external item 详情、编辑能力、元数据手工维护
- 主要文件：
  - `src/app/api/external-items/[id]/route.ts`
  - `src/components/external/external-item-card.tsx`
  - `src/components/external/external-items-panel.tsx`
- 真实验证：
  - 历史任务完成
  - 本轮读取代码时确认编辑与删除 UI 仍存在
- 明确没有做：
  - OCR
  - AI 摘要
  - 自动 extraction
- 是否可视为完成：可以

### `T32` 已提交完成

- 完成内容：Later 列表页与最小交互
- 主要文件：
  - `src/app/(reader)/later/page.tsx`
  - `src/components/external/external-items-panel.tsx`
- 真实验证：
  - 页面仍在构建产物中
- 明确没有做：
  - 复杂筛选
  - 公共分享
- 是否可视为完成：可以

### `T33` 已提交完成

- 完成内容：external content 合规提示文案与页面呈现
- 主要文件：
  - `docs/06_external_content_policy.md`
  - `src/components/external/external-items-panel.tsx`
  - `src/app/(reader)/external-items/[id]/page.tsx`
- 真实验证：
  - 页面静态文案与 API 限制已存在
- 明确没有做：
  - 自动合规审计
- 是否可视为完成：可以

### `T34` 已提交完成

- 完成内容：私有 external item 详情页
- 主要文件：
  - `src/app/(reader)/external-items/[id]/page.tsx`
  - `src/lib/constants/routes.ts`
- 真实验证：
  - 已提交历史存在
- 明确没有做：
  - 公开 external item 页面
  - 第三方全文展示
- 是否可视为完成：可以

### `T34.5` 未正式定义，但有相邻已提交补丁

- 仓库内没有正式 `T34.5`
- 可参考相邻 commit `98ce292 feat: add external item delete flow`
- 这说明 external item 删除功能已存在，但不是独立正式任务号
- 是否可视为完成：仅作为 external-items 模块附加能力，不单独追踪

## 5.4 Collections

### `T40` 已提交完成

- 完成内容：创建专题、列出自己的专题、`/collections` 最小页面
- 主要文件：
  - `src/app/api/collections/route.ts`
  - `src/app/(reader)/collections/page.tsx`
  - `src/components/collections/collections-panel.tsx`
- 真实验证：
  - 已提交历史存在，`312aef6 feat: add private collection creation flow`
- 明确没有做：
  - 编辑
  - 删除
  - collection_items
- 是否可视为完成：可以

### `T41` 已提交完成

- 完成内容：编辑专题、删除专题、最小编辑/删除 UI
- 主要文件：
  - `src/app/api/collections/[id]/route.ts`
  - `src/components/collections/collections-panel.tsx`
- 真实验证：
  - 已提交历史存在，`c52a425 feat: add collection edit and delete flow`
- 明确没有做：
  - collection_items
  - notes/reflections
  - 搜索/公开分享/协作专题
- 是否可视为完成：可以

### `T41.5` 未正式定义，但用户上下文明确提到已完成真实登录态验证

- 该编号未出现在仓库正式任务板中
- 但用户明确说明：`T41/T41.5 已完成 collection 编辑、删除，并通过真实登录态验证`
- 建议在新对话中把它视为 `T41` 的验证补充，而不是新的功能范围
- 是否可视为完成：可以，前提是只把它当成验证子步骤

### `T42` 部分已提交，当前仍有未提交补丁

- 完成内容：
  - `POST /api/collections/:id/items`
  - `DELETE /api/collections/:id/items/:itemId`
  - `/later` external item 卡片增加 `Add to collection`
- 主要文件：
  - 已进入 `c52a425` 的部分：
    - `src/app/api/collections/[id]/items/route.ts`
    - `src/app/api/collections/[id]/items/[itemId]/route.ts`
    - `src/app/(reader)/later/page.tsx`
    - `src/app/api/collections/[id]/route.ts`
    - `src/app/api/collections/route.ts`
    - `TASKS.md`
    - `docs/08_codex_task_board.md`
  - 当前仍在工作区未提交的部分：
    - `src/components/external/external-item-card.tsx`
    - `src/components/external/external-items-panel.tsx`
- 真实验证：
  - 上一个开发回合已做真实烟测：
    - 未登录 POST/DELETE => `401`
    - 自己 `external_item` 加入自己 `collection` => 成功
    - 别人的 `external_item` => `404`
    - 别人的 `collection` => `404`
    - draft article => `404`
    - published article => 可加入
    - 重复加入 => `409`
    - 删除 `collection_item` => 成功
    - 删除关系后原始 `external_item` 仍存在
- 明确没有做：
  - notes/reflections
  - 标签/搜索/公开分享/协作专题/推荐
  - article 加入专题 UI
  - `GET /api/collections/:id/items`
- 是否可视为完成：功能设计上已基本到位，但当前工作区仍有 UI 补丁未提交

---

# 6. 当前待提交内容

当前工作区不干净，需要整理提交。

这是文档写完后的最终复核状态：

```text
## master
 M src/components/external/external-item-card.tsx
 M src/components/external/external-items-panel.tsx
?? docs/PROJECT_HANDOFF_MATERIALS.md
warning: unable to access 'C:\Users\21218/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\21218/.config/git/ignore': Permission denied
```

## 6.1 已修改文件

- `src/components/external/external-item-card.tsx`
- `src/components/external/external-items-panel.tsx`

## 6.2 未跟踪文件

- 本文件：`docs/PROJECT_HANDOFF_MATERIALS.md`

## 6.3 哪些属于业务代码

- `src/components/external/external-item-card.tsx`
- `src/components/external/external-items-panel.tsx`

## 6.4 哪些属于文档或任务状态

- `TASKS.md`
- `docs/08_codex_task_board.md`
- `docs/PROJECT_HANDOFF_MATERIALS.md`

## 6.5 哪些属于临时日志或不应提交

- `.env.local`
- `supabase/.temp/`
- 任意未来出现的 `.codex-*.log`
- 任意未来出现的 `.codex-*.pid`
- 任意真实凭据文件

## 6.6 推荐 `git add` 命令

PowerShell 下优先用目录级 add，避免括号和中括号路径转义问题：

```bash
git add src/components/external docs
```

## 6.7 推荐 commit message

如果本次只准备提交当前剩余的 `T42` UI 补丁，建议：

```text
feat: add later page collection picker UI
```

如果你想把交接文档与 UI 补丁分开提交，文档单独一笔可用：

```text
docs: add project handoff materials
```

---

# 7. 当前下一步任务

结论分两层：

- Git 历史层面：`T41` 已提交，所以正式下一任务是 `T42`
- 工作区层面：`T42` 的后端已随 `c52a425` 混入提交，但外部卡片 UI 仍未提交，因此下一个 GPT 不应直接开始 `T43`

建议顺序：

1. 先检查并提交当前 `T42` UI 工作区改动
2. 提交完成后，再进入 `T43`

## 7.1 `T42` 的建议边界

`T42` 只做：

- `collection_items` 的加入 / 移除
- 最小 external item 加入专题入口

明确不做：

- `notes / reflections`
- 标签
- 搜索
- 公开分享
- 复杂专题详情页
- schema 变更
- RLS 变更
- `service role key`

---

# 8. API 清单

说明：

- “已真实验证”分三类：
  - `本轮实测`
  - `历史任务已验证，本轮未复核`
  - `未确认`

## 8.1 auth

### `POST /api/auth/register`

- 用途：邮箱密码注册
- 登录要求：否
- 权限边界：只允许注册，不允许客户端指定 profile 主键或角色
- 真实验证：本轮实测（被后续 T42 烟测链路复用）

### `POST /api/auth/login`

- 用途：邮箱密码登录
- 登录要求：否
- 权限边界：只返回当前登录用户和其 profile
- 真实验证：本轮实测

### `POST /api/auth/logout`

- 用途：退出登录
- 登录要求：是
- 权限边界：只退出当前会话
- 真实验证：历史任务已验证，本轮未复核

## 8.2 me / profile

### `GET /api/me`

- 用途：获取当前登录用户 + profile 摘要
- 登录要求：是
- 权限边界：只返回当前用户自己的 profile
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/me/profile`

- 用途：获取当前用户 profile
- 登录要求：是
- 权限边界：只读当前用户自己
- 真实验证：历史任务已验证，本轮未复核

### `PATCH /api/me/profile`

- 用途：更新当前用户 `display_name` / `bio` / `avatar_url`
- 登录要求：是
- 权限边界：只更新当前用户自己；禁止更新 `id/email/role/created_at`
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/me/subscriptions`

- 用途：列出当前用户已订阅作者
- 登录要求：是
- 权限边界：只返回当前 reader 自己的订阅关系
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/me/articles`

- 用途：列出当前作者自己的文章
- 登录要求：是
- 权限边界：只返回当前作者自己的 `draft/published/archived`
- 真实验证：历史任务已验证，本轮未复核

## 8.3 authors

### `GET /api/authors`

- 用途：公开作者列表
- 登录要求：否
- 权限边界：只返回 `is_active = true` 的公开字段
- 真实验证：历史任务已验证，本轮未复核

### `POST /api/authors`

- 用途：创建当前用户的 author profile
- 登录要求：是
- 权限边界：一人一 author profile；拒绝客户端传 `user_id/id/is_active`
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/authors/:id`

- 用途：读取作者详情
- 登录要求：否
- 权限边界：只返回 active 作者公开字段
- 真实验证：历史任务已验证，本轮未复核

### `PATCH /api/authors/:id`

- 用途：更新自己的 author profile
- 登录要求：是
- 权限边界：仅 owner 可改；他人返回 `403`
- 真实验证：历史任务已验证，本轮未复核

## 8.4 articles

### `POST /api/articles`

- 用途：创建 article draft
- 登录要求：是
- 权限边界：必须先有 author profile；禁止客户端写 `author_id/status/published_at`
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/articles/:id`

- 用途：读取文章详情
- 登录要求：否（published 公共可读；作者本人可读自己的）
- 权限边界：RLS + route 共同限制
- 真实验证：历史任务已验证，本轮未复核

### `PATCH /api/articles/:id`

- 用途：更新 draft article
- 登录要求：是
- 权限边界：仅作者本人可改，且只允许 draft
- 真实验证：历史任务已验证，本轮未复核

### `POST /api/articles/:id/publish`

- 用途：发布 draft article，并 fan-out 到订阅者 inbox
- 登录要求：是
- 权限边界：仅当前作者可发布自己的 draft；重复发布冲突
- 真实验证：本轮实测了发布链路的关键部分

## 8.5 subscriptions

### `POST /api/subscriptions`

- 用途：订阅作者
- 登录要求：是
- 权限边界：只允许当前 reader 给自己创建订阅；作者必须存在且 active
- 真实验证：历史任务已验证，本轮未复核

### `DELETE /api/subscriptions/by-author/:authorId`

- 用途：按作者取消订阅
- 登录要求：是
- 权限边界：只删除当前 reader 自己的订阅
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/subscriptions/by-author/:authorId`

- 用途：查询当前用户对某作者的订阅状态
- 登录要求：是
- 权限边界：只返回当前用户自己的订阅状态
- 真实验证：历史任务已验证，本轮未复核

## 8.6 inbox

### `GET /api/inbox`

- 用途：读取当前用户 Inbox 列表，支持 `filter`
- 登录要求：是
- 权限边界：只返回当前用户自己的 `inbox_items`
- 真实验证：历史任务已验证，本轮未复核

### `PATCH /api/inbox/:id`

- 用途：更新 `status` / `isStarred`
- 登录要求：是
- 权限边界：只允许更新当前用户自己的 inbox item；禁止改 source/user 侧字段
- 真实验证：历史任务已验证，本轮未复核

## 8.7 external-items

### `GET /api/external-items`

- 用途：列出当前用户自己的 external items
- 登录要求：是
- 权限边界：只看自己；不暴露他人 external items
- 真实验证：历史任务已验证，本轮未复核

### `POST /api/external-items`

- 用途：手动保存 external item
- 登录要求：是
- 权限边界：拒绝 `user_id/id/created_at` 等控制字段；不支持自动 extraction
- 真实验证：历史任务已验证，本轮未复核

### `GET /api/external-items/:id`

- 用途：查看某个 external item 详情
- 登录要求：是
- 权限边界：只看自己的；他人或不存在返回 `404`
- 真实验证：本轮间接实测（删除 collection relation 后再次读取原始 item）

### `PATCH /api/external-items/:id`

- 用途：编辑 external item 元数据
- 登录要求：是
- 权限边界：只改自己的；禁止改 `original_content/extracted_content`
- 真实验证：历史任务已验证，本轮未复核

### `DELETE /api/external-items/:id`

- 用途：删除 external item
- 登录要求：是
- 权限边界：只删自己的 external item
- 真实验证：历史任务已验证，本轮未复核

## 8.8 collections

### `GET /api/collections`

- 用途：列出当前用户自己的 collections
- 登录要求：是
- 权限边界：只看自己
- 真实验证：历史任务已验证，本轮未复核

### `POST /api/collections`

- 用途：创建 collection
- 登录要求：是
- 权限边界：只为当前用户创建；拒绝客户端写 `user_id/id/created_at`
- 真实验证：历史任务已验证，本轮未复核

### `PATCH /api/collections/:id`

- 用途：编辑 collection 本体
- 登录要求：是
- 权限边界：只改自己的；他人 `404`
- 真实验证：历史任务已验证，本轮未复核

### `DELETE /api/collections/:id`

- 用途：删除 collection 本体
- 登录要求：是
- 权限边界：只删自己的；他人 `404`
- 真实验证：历史任务已验证，本轮未复核

### `POST /api/collections/:id/items`

- 用途：向自己的 collection 加入 `article` 或 `external_item`
- 登录要求：是
- 权限边界：
  - collection 必须属于当前用户
  - `external_item` 必须属于当前用户
  - `article` 必须是 `published`
  - 重复加入返回 `409`
- 真实验证：本轮实测

### `DELETE /api/collections/:id/items/:itemId`

- 用途：从自己的 collection 移除一个 collection item 关系
- 登录要求：是
- 权限边界：
  - collection 必须属于当前用户
  - 只删 `collection_items` 关系，不删原始 article/external_item
- 真实验证：本轮实测

---

# 9. 页面与路由清单

## `/`

- 当前能做什么：项目首页、产品定位说明、导航入口
- 依赖：静态内容 + `ROUTES`
- 备注：强调“反信息流、安静阅读、长期整理”

## `/login`

- 当前能做什么：邮箱密码登录，成功后跳转 `/inbox`
- 依赖：`POST /api/auth/login`
- 数据表：`profiles` 间接读取

## `/register`

- 当前能做什么：邮箱密码注册
- 依赖：`POST /api/auth/register`
- 数据表：`auth.users` + 触发器写入 `profiles`

## `/inbox`

- 当前能做什么：查看订阅投递的文章列表，按 `active/unread/reading/starred/archived/all` 筛选
- 依赖：
  - `GET /api/inbox`
  - `PATCH /api/inbox/:id`
- 数据表：`inbox_items`, `articles`, `author_profiles`

## `/later`

- 当前能做什么：
  - 新增 external item
  - 编辑 external item
  - 删除 external item
  - 把 external item 加入 collection（最小入口）
- 依赖：
  - `GET/POST /api/external-items`
  - `GET /api/collections`
  - `POST /api/collections/:id/items`
- 数据表：`external_items`, `collections`, `collection_items`

## `/external-items/[id]`

- 当前能做什么：查看自己 external item 的详情
- 依赖：服务端直读 Supabase / RLS
- 数据表：`external_items`
- 备注：不显示第三方全文

## `/collections`

- 当前能做什么：
  - 创建 collection
  - 编辑 collection
  - 删除 collection
  - 仅文案提示 external item 已可从 Later 加入
- 依赖：
  - `GET/POST /api/collections`
  - `PATCH/DELETE /api/collections/:id`
- 数据表：`collections`
- 备注：还没有完整 collection detail / item list 页面

## `/authors`

- 当前能做什么：查看 public author directory
- 依赖：服务端直读 active `author_profiles`
- 数据表：`author_profiles`

## `/authors/[id]`

- 当前能做什么：查看作者公开资料、查看当前用户订阅状态、订阅/取消订阅作者
- 依赖：
  - `GET /api/authors/:id`
  - `POST /api/subscriptions`
  - `DELETE /api/subscriptions/by-author/:authorId`
  - `GET /api/subscriptions/by-author/:authorId`
- 数据表：`author_profiles`, `subscriptions`

## `/author/dashboard`

- 当前能做什么：创建或编辑自己的 author profile
- 依赖：
  - `POST /api/authors`
  - `PATCH /api/authors/:id`
- 数据表：`author_profiles`

## `/author/write`

- 当前能做什么：新建 draft 或编辑 draft
- 依赖：
  - `POST /api/articles`
  - `PATCH /api/articles/:id`
- 数据表：`articles`, `author_profiles`

## `/author/articles`

- 当前能做什么：列出自己的 draft/published/archived，触发发布入口
- 依赖：
  - `GET /api/me/articles`
  - `POST /api/articles/:id/publish`
- 数据表：`articles`, `author_profiles`

## `/articles/[id]`

- 当前能做什么：查看文章详情页
- 依赖：服务端直读 `articles` + `author_profiles`
- 数据表：`articles`, `author_profiles`
- 备注：按钮上明确写着订阅能力在 `T20`

## `/settings`

- 当前能做什么：查看和编辑当前用户基础 profile
- 依赖：
  - `GET /api/me/profile`
  - `PATCH /api/me/profile`
- 数据表：`profiles`

---

# 10. 关键安全与合规边界

以下边界必须继续保持：

- 不使用 `service role key`
- 不绕过 RLS
- 不提交 `.env.local`
- 不公开 `profiles.email`
- 不公开 `author_profiles.user_id`
- `external_items` 不做自动抓取
- 不做 OCR / AI 摘要
- 不保存或公开第三方全文
- Inbox 只能读写当前用户自己的 `inbox_items`
- Collections 只能读写当前用户自己的 `collections`
- `collection_items` 只能挂到当前用户自己的 `collections`
- 外部内容必须是用户主动保存，不做后台批量抓取
- 公开分享只能分享元数据与用户自己的笔记，不分享第三方全文

---

# 11. 已知遗留问题与注意事项

## 11.1 `.codex-t345-verify.*` 日志

- 本轮检查结果：未发现

## 11.2 `supabase/.temp`

- 存在
- `.gitignore` 已忽略
- 不要提交，不要转移到新对话

## 11.3 Git 全局 ignore 权限 warning

- 仍然存在：
  - `warning: unable to access 'C:\Users\21218/.config/git/ignore': Permission denied`
- 这是本机环境问题，不是仓库代码问题

## 11.4 是否还有未完成真实验证的任务

- `T42`：后端与多数页面 wiring 已在 `c52a425` 中出现，剩余 UI 补丁尚未提交
- 许多更早任务在历史上应已验证，但本轮没有逐条重跑浏览器链路
- 因此，新对话若要继续开发，至少应先确认当前工作区和核心 lint/build 状态

## 11.5 是否有 TODO 留在代码或文档中

有，主要分两类：

- migration TODO：
  - `T10` profile bootstrap 选择
  - `T43` note public read rules
  - `T44/T45` reflection public rules
  - `T50-T52` admin moderation rules
- `src/features/*/README.md` 里大量模块占位 TODO 仍未补齐

## 11.6 是否有 schema 与 type 手写不同步风险

- 有
- 原因：`src/types/database.ts` 明确写明它是 hand-written placeholder

## 11.7 `database.ts` 是否仍是手写 Supabase 类型

- 是
- 尚未切换到 `supabase gen types`

## 11.8 其它注意事项

- `c52a425` 的 commit message 只写了 `collection edit and delete flow`，但实际 `--stat` 显示其中已经包含 `T42` 的部分文件
- 因此，新对话必须同时看 `git log --stat` 和当前 `git status`，不能只看 commit message

---

# 12. 给下一个 GPT 的简短上下文

下面这段可以直接复制到新的 GPT 对话开头：

```text
这是“麦芒订阅 / Maimang Readbox”项目，一个反信息流的安静阅读平台：用户订阅作者，文章进入 Inbox；用户也可手动保存 external items 到 Later，再用 Collections/Notes/Reflections 做长期整理。技术栈是 Next.js App Router + React + TypeScript + Tailwind + Supabase Auth/Postgres/RLS + pnpm。

已提交任务至少到 T41，而且最新 commit `c52a425` 的实际内容已经混入了大部分 T42 后端与页面 wiring：T10-T15、T20-T25、T30-T34、T40-T41 已进入 Git 历史，T42 的 Route Handlers 与 `/later` 服务端数据准备也已经在仓库里。当前工作区只剩 external item 卡片上的 Add to collection UI 补丁尚未提交。lint/build 当前通过。

当前待提交事项：工作区只剩 `src/components/external/external-item-card.tsx`、`src/components/external/external-items-panel.tsx` 两个 UI 文件，以及 `docs/PROJECT_HANDOFF_MATERIALS.md`。不要提交 .env.local、supabase/.temp、任何 .codex 日志，也不要输出真实密钥。

下一步不要直接做 T43。先确认并提交当前 T42 剩余 UI 补丁。开发纪律：不改 schema，不改 RLS，不用 service role key，不越界做 notes/reflections/搜索/公开分享/推荐等超出任务范围的功能。
```

---

# 13. 给下一个 Codex 的启动 Prompt

下面这段可以直接复制给下一个 Codex：

```text
请先阅读 docs/PROJECT_HANDOFF_MATERIALS.md，然后按以下顺序工作：

1. 先检查当前 git status。
2. 再检查 pnpm lint 和 corepack pnpm build 的当前状态。
3. 不要直接实现新功能，先确认仓库到底停在什么状态。
4. 如果发现 T41 还未提交，先明确提示必须先提交 T41。
5. 如果 T41 已提交，则确认当前工作区是否已经包含未提交的 T42；如果有，先整理并验证 T42，而不是直接开始 T43。
6. 不要越界实现后续任务。
7. 不要修改 schema、RLS、service role key 使用方式。
8. 不要提交 .env.local、supabase/.temp、.codex 日志或任何真实密钥。

在没有把当前状态说明清楚之前，不要开始写新功能代码。
```

---

# 是否可以进入下一对话继续开发

可以，但有前提。

推荐判断：

- `可以进入下一对话`：是
- `是否适合直接开始新功能`：否

原因：

- 交接材料已经足够完整，下一对话可以继续接手。
- 但当前工作区仍有未提交的 `T42` UI 改动。
- 所以下一个 GPT / Codex 最合理的动作不是直接开发 `T43`，而是先确认、验证并提交当前 `T42` 剩余 UI 补丁。
