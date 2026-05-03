# 任务清单 / Task List

**当前阶段**: Phase 0 - 项目框架建设  
**最后更新**: 2026-04-29

---

## 当前状态

### ✅ 已完成

- [x] 创建项目子目录 maimang-readbox/
- [x] 初始化 Next.js + TypeScript + Tailwind 项目
- [x] 创建目录结构
- [x] 创建 CLAUDE.md 和 Cursor 规则
- [x] 创建数据库 schema (11 个表)
- [x] 创建 TypeScript 类型定义
- [x] 创建 API health check
- [x] 创建页面占位 (15 个页面)
- [x] 创建模块 README
- [x] 创建项目文档框架

### 🚧 进行中

- [ ] 完成所有项目文档 (部分完成)
- [ ] 运行 lint 和 build 验证

### 📋 待做

#### Phase 1: 用户与作者 (优先级: 高)
- [ ] T10: 实现用户注册登录
- [ ] T11: 实现用户 profile 管理
- [ ] T12: 实现作者 profile 创建
- [ ] T13: 实现作者主页
- [ ] T14: 实现作者写作草稿
- [ ] T15: 实现作者发布文章

#### Phase 2: 订阅与收件箱 (优先级: 高)
- [ ] T20: 实现订阅作者功能
- [ ] T21: 实现取消订阅功能
- [ ] T22: 实现发布文章后生成 inbox_items
- [ ] T23: 实现 Inbox 列表页
- [ ] T24: 实现已读、星标、归档状态管理
- [ ] T25: 实现 Inbox 筛选功能

#### Phase 3: 外部保存与待读 (优先级: 中)
- [ ] T30: 实现保存外部链接
- [ ] T31: 实现手动编辑标题、来源、摘要
- [ ] T32: 实现 Later 列表页
- [ ] T33: 实现外部内容合规提示
- [x] T34: 实现外部内容详情页

#### Phase 4: 专题和笔记 (优先级: 中)
- [ ] T40: 实现创建专题
- [ ] T41: 实现编辑专题
- [ ] T42: 实现加入专题
- [ ] T43: 实现文章笔记
- [ ] T44: 实现读后感
- [ ] T45: 实现私密/公开权限

#### Phase 5: 管理与安全 (优先级: 低)
- [ ] T50: 实现管理后台
- [ ] T51: 实现内容下架
- [ ] T52: 实现举报功能
- [ ] T53: RLS 权限测试
- [ ] T54: 基础审计日志预留

### ⛔ 阻塞项

- 无

---

## 下一个推荐任务

**T10: 实现用户注册登录**

**任务描述**:
- 使用 Supabase Auth 实现邮箱密码注册
- 实现登录功能
- 实现登出功能
- 注册后自动创建 profiles 记录

**验收标准**:
- [ ] 用户可以通过邮箱密码注册
- [ ] 注册后自动创建 profiles 记录
- [ ] 用户可以登录并获得 JWT token
- [ ] 用户可以登出
- [ ] 登录状态持久化

**前置条件**:
- 安装 @supabase/supabase-js 和 @supabase/ssr
- 配置 Supabase 项目
- 配置环境变量

**涉及文件**:
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/api/auth/register/route.ts
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts

---

## 任务优先级说明

- **高**: MVP 核心功能,必须实现
- **中**: MVP 重要功能,建议实现
- **低**: MVP 可选功能,后续实现

---

## 如何使用本文档

1. 查看"下一个推荐任务"了解当前应该做什么
2. 完成任务后,将其从"待做"移到"已完成"
3. 如果遇到阻塞,记录到"阻塞项"
4. 定期更新"最后更新"时间

---

详细任务说明请查看 `docs/08_codex_task_board.md`
