# 模块地图

**文档用途**: 定义项目模块划分、职责边界和依赖关系  
**当前版本**: v0.1  
**最后更新**: 2026-04-29

---

## 一、模块总览表

| 模块 | 核心职责 | MVP 优先级 | Codex 任务 |
|------|---------|-----------|-----------|
| auth | 用户注册登录认证 | 高 | T10 |
| profiles | 用户基础信息管理 | 高 | T11 |
| authors | 作者身份和主页 | 高 | T12-T13 |
| articles | 文章创建发布管理 | 高 | T14-T15 |
| subscriptions | 订阅关系管理 | 高 | T20-T21 |
| inbox | 收件箱投递和状态 | 高 | T22-T25 |
| external-items | 外部内容保存 | 中 | T30-T34 |
| collections | 专题分类 | 中 | T40-T42 |
| notes | 阅读笔记 | 中 | T43 |
| reflections | 读后感 | 中 | T44-T45 |
| admin | 管理后台 | 低 | T50-T54 |
| layout | 布局和导航 | 高 | T04 |
| reader-ui | 阅读器界面 | 高 | T23, T32 |

---

## 二、模块详细说明

### 2.1 auth 模块

**核心职责**:
- 用户注册
- 用户登录
- 用户登出
- Session 管理

**主要页面**:
- `/login`
- `/register`

**主要接口**:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

**主要数据表**:
- `profiles` (通过 Supabase Auth 触发器创建)

**依赖模块**:
- 无（基础模块）

**不负责什么**:
- ❌ 不负责用户 profile 详细信息编辑
- ❌ 不负责作者身份管理
- ❌ 不负责权限控制（由 RLS 负责）

**MVP 优先级**: 高

**Codex 后续任务**: T10

---

### 2.2 profiles 模块

**核心职责**:
- 用户基础信息管理
- 用户 profile 查询和更新
- 用户角色管理

**主要页面**:
- `/settings`

**主要接口**:
- `GET /api/me/profile`
- `PATCH /api/me/profile`

**主要数据表**:
- `profiles`

**依赖模块**:
- auth（需要认证）

**不负责什么**:
- ❌ 不负责作者专属信息（由 authors 模块负责）
- ❌ 不负责用户内容（文章、笔记等）

**MVP 优先级**: 高

**Codex 后续任务**: T11

---

### 2.3 authors 模块

**核心职责**:
- 作者身份创建和管理
- 作者主页展示
- 作者信息查询

**主要页面**:
- `/author/dashboard`
- `/authors/[id]` (作者主页)

**主要接口**:
- `GET /api/authors`
- `GET /api/authors/:id`
- `POST /api/authors`
- `PATCH /api/authors/:id`

**主要数据表**:
- `author_profiles`

**依赖模块**:
- profiles（一个用户可以成为作者）

**不负责什么**:
- ❌ 不负责文章内容管理（由 articles 模块负责）
- ❌ 不负责订阅关系（由 subscriptions 模块负责）

**MVP 优先级**: 高

**Codex 后续任务**: T12-T13

---

### 2.4 articles 模块

**核心职责**:
- 文章创建和编辑
- 文章发布和状态管理
- 文章查询和展示

**主要页面**:
- `/author/write`
- `/author/articles`
- `/articles/[id]`

**主要接口**:
- `GET /api/articles/:id`
- `POST /api/articles`
- `PATCH /api/articles/:id`
- `POST /api/articles/:id/publish`
- `GET /api/me/articles`

**主要数据表**:
- `articles`

**依赖模块**:
- authors（文章属于作者）
- inbox（发布时触发投递）

**不负责什么**:
- ❌ 不负责订阅关系
- ❌ 不负责收件箱投递逻辑（由 inbox 模块负责）
- ❌ 不负责笔记和读后感（由 notes/reflections 模块负责）

**MVP 优先级**: 高

**Codex 后续任务**: T14-T15

---

### 2.5 subscriptions 模块

**核心职责**:
- 订阅作者
- 取消订阅
- 订阅关系查询

**主要页面**:
- 作者主页的订阅按钮
- `/settings` 中的订阅管理

**主要接口**:
- `POST /api/subscriptions`
- `DELETE /api/subscriptions/:id`
- `GET /api/me/subscriptions`

**主要数据表**:
- `subscriptions`

**依赖模块**:
- profiles（订阅者）
- authors（被订阅的作者）

**不负责什么**:
- ❌ 不负责文章投递（由 inbox 模块负责）
- ❌ 不负责付费订阅（MVP 不做）

**MVP 优先级**: 高

**Codex 后续任务**: T20-T21

---

### 2.6 inbox 模块

**核心职责**:
- 文章发布后生成 inbox_items
- 收件箱列表查询
- 阅读状态管理（未读/已读/星标/归档）

**主要页面**:
- `/inbox`

**主要接口**:
- `GET /api/inbox`
- `PATCH /api/inbox/:id/status`
- `PATCH /api/inbox/:id/star`
- `POST /api/inbox/:id/archive`

**主要数据表**:
- `inbox_items`

**依赖模块**:
- articles（文章发布触发）
- subscriptions（根据订阅关系投递）

**不负责什么**:
- ❌ 不负责文章内容本身
- ❌ 不负责订阅关系管理
- ❌ 不负责外部内容（由 external-items 模块负责）

**MVP 优先级**: 高

**Codex 后续任务**: T22-T25

---

### 2.7 external-items 模块

**核心职责**:
- 保存外部链接
- 外部内容元数据管理
- 待读列表查询

**主要页面**:
- `/later`
- 保存外部内容的表单

**主要接口**:
- `POST /api/external-items`
- `GET /api/external-items`
- `GET /api/external-items/:id`
- `PATCH /api/external-items/:id`

**主要数据表**:
- `external_items`

**依赖模块**:
- profiles（外部内容属于用户）

**不负责什么**:
- ❌ 不负责自动抓取内容（MVP 不做）
- ❌ 不负责 OCR 和 PDF 解析（MVP 不做）
- ❌ 不负责绕过第三方限制
- ❌ 不公开展示第三方全文

**MVP 优先级**: 中

**Codex 后续任务**: T30-T34

---

### 2.8 collections 模块

**核心职责**:
- 专题创建和管理
- 内容加入专题
- 专题查询

**主要页面**:
- `/collections`
- `/collections/[id]`

**主要接口**:
- `POST /api/collections`
- `GET /api/collections`
- `PATCH /api/collections/:id`
- `DELETE /api/collections/:id`
- `POST /api/collections/:id/items`
- `DELETE /api/collections/:id/items/:itemId`

**主要数据表**:
- `collections`
- `collection_items`

**依赖模块**:
- articles（可以加入专题）
- external-items（可以加入专题）

**不负责什么**:
- ❌ 不负责内容本身的管理
- ❌ 不负责公开专题（MVP 只做私密专题）

**MVP 优先级**: 中

**Codex 后续任务**: T40-T42

---

### 2.9 notes 模块

**核心职责**:
- 阅读笔记创建和管理
- 选中文本添加笔记
- 笔记查询

**主要页面**:
- 文章阅读器中的笔记功能

**主要接口**:
- `POST /api/notes`
- `GET /api/items/:id/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

**主要数据表**:
- `notes`

**依赖模块**:
- articles（可以对文章做笔记）
- external-items（可以对外部内容做笔记）

**不负责什么**:
- ❌ 不负责读后感（由 reflections 模块负责）
- ❌ 不负责公开笔记分享（MVP 只做私密笔记）

**MVP 优先级**: 中

**Codex 后续任务**: T43

---

### 2.10 reflections 模块

**核心职责**:
- 读后感创建和管理
- 读后感查询
- 公开/私密权限管理

**主要页面**:
- 文章阅读器中的读后感功能

**主要接口**:
- `POST /api/reflections`
- `GET /api/items/:id/reflections`
- `PATCH /api/reflections/:id`
- `DELETE /api/reflections/:id`

**主要数据表**:
- `reflections`

**依赖模块**:
- articles（可以对文章写读后感）
- external-items（可以对外部内容写读后感）

**不负责什么**:
- ❌ 不负责笔记（由 notes 模块负责）
- ❌ 不负责评论功能（MVP 不做）

**MVP 优先级**: 中

**Codex 后续任务**: T44-T45

---

### 2.11 admin 模块

**核心职责**:
- 用户管理
- 内容审核
- 举报处理

**主要页面**:
- `/admin`
- `/admin/users`
- `/admin/articles`
- `/admin/reports`

**主要接口**:
- `GET /api/admin/users`
- `GET /api/admin/articles`
- `PATCH /api/admin/articles/:id/moderation`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`

**主要数据表**:
- `profiles`
- `articles`
- `moderation_reports`

**依赖模块**:
- 所有模块（管理所有内容）

**不负责什么**:
- ❌ 不负责自动审核（MVP 人工审核）
- ❌ 不负责复杂权限管理（MVP 只有 admin 角色）

**MVP 优先级**: 低

**Codex 后续任务**: T50-T54

---

### 2.12 layout 模块

**核心职责**:
- 应用整体布局
- 导航栏
- 侧边栏
- 响应式布局

**主要页面**:
- 所有页面的布局容器

**主要接口**:
- 无（纯 UI 模块）

**主要数据表**:
- 无

**依赖模块**:
- auth（显示登录状态）

**不负责什么**:
- ❌ 不负责业务逻辑
- ❌ 不负责数据获取

**MVP 优先级**: 高

**Codex 后续任务**: T04

---

### 2.13 reader-ui 模块

**核心职责**:
- 阅读器界面
- 文章渲染
- 阅读体验优化

**主要页面**:
- `/articles/[id]`
- `/external-items/[id]`

**主要接口**:
- 无（纯 UI 模块）

**主要数据表**:
- 无

**依赖模块**:
- articles（渲染文章）
- external-items（渲染外部内容）
- notes（显示笔记）
- reflections（显示读后感）

**不负责什么**:
- ❌ 不负责内容管理
- ❌ 不负责笔记和读后感的创建（只负责显示）

**MVP 优先级**: 高

**Codex 后续任务**: T23, T32

---

### 2.14 future-content-processor 模块

**核心职责**（未来预留）:
- OCR 图片文字识别
- PDF 文本提取
- HTML 正文解析
- 自动分类
- 摘要生成

**主要页面**:
- 无（后台服务）

**主要接口**（未来）:
- `POST /api/content-processor/ocr`
- `POST /api/content-processor/pdf`
- `POST /api/content-processor/extract`
- `POST /api/content-processor/classify`
- `POST /api/content-processor/summarize`

**主要数据表**:
- 无（使用主应用数据表）

**依赖模块**:
- external-items（处理外部内容）

**不负责什么**:
- ❌ 不负责用户管理
- ❌ 不负责权限控制
- ❌ 不负责核心业务逻辑

**MVP 优先级**: 不实现（未来预留）

**Codex 后续任务**: 无（MVP 不做）

---

## 三、模块依赖关系图

```
auth (基础)
  ↓
profiles
  ↓
authors ← subscriptions → inbox
  ↓           ↓
articles ──────┘
  ↓
notes, reflections, collections
  ↓
external-items
  ↓
admin (管理所有)

layout, reader-ui (UI 层，依赖多个模块)
```

---

## 四、模块边界原则

### 4.1 单一职责
每个模块只负责一个核心领域，不跨界处理其他模块的业务逻辑。

### 4.2 明确依赖
模块之间的依赖关系必须明确，避免循环依赖。

### 4.3 接口清晰
模块之间通过 API 接口通信，不直接访问其他模块的数据表。

### 4.4 可独立测试
每个模块应该可以独立测试，不依赖其他模块的实现细节。

---

**文档状态**: ✅ 完成  
**下一步**: 查看 `docs/04_api_contract.md` 了解接口设计