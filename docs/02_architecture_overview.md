# 架构总览 / Architecture Overview

**文档版本**: v0.1  
**最后更新**: 2026-04-29  
**文档用途**: 说明技术架构、技术选型和部署方案

---

## 总体架构

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│           Next.js App (Frontend + Backend)          │
│  ┌─────────────────────────────────────────────┐   │
│  │  Frontend: React + TypeScript + Tailwind    │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Backend: Route Handlers + Server Actions   │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  Supabase Services                   │
│  ┌──────────────┬──────────────┬─────────────────┐ │
│  │ PostgreSQL   │ Auth         │ Storage (预留)  │ │
│  │ + RLS        │              │                 │ │
│  └──────────────┴──────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────┘

未来扩展 (MVP 不实现):
┌─────────────────────────────────────────────────────┐
│      Python FastAPI Content Processor Service       │
│  (OCR, PDF parsing, text extraction, summarization) │
└─────────────────────────────────────────────────────┘
```

## 前端结构

### 技术栈
- **框架**: Next.js 16+ (App Router)
- **语言**: TypeScript (strict mode)
- **样式**: Tailwind CSS 4+
- **组件库**: shadcn/ui (按需引入)
- **状态管理**: React hooks + Server Components (不引入 Redux/MobX/Zustand)

### 目录结构
```
src/
  app/              # Next.js App Router 页面
    (auth)/         # 认证相关页面
    (reader)/       # 读者功能页面
    (author)/       # 作者功能页面
    (admin)/        # 管理后台页面
    api/            # API 路由
  components/       # React 组件
  features/         # 功能模块 (按业务领域划分)
  lib/              # 工具函数和客户端
  types/            # TypeScript 类型定义
```

## 轻量后端结构

### 技术选择
- **API 层**: Next.js Route Handlers (`app/api/*/route.ts`)
- **数据操作**: Supabase Client (server-side)
- **认证**: Supabase Auth
- **权限**: PostgreSQL Row Level Security (RLS)

### 为什么不单独做后端服务?

MVP 阶段选择 Next.js 全栈方案的原因:
1. **简化部署**: 单一应用,部署到 Vercel 即可
2. **开发效率**: 前后端共享类型,减少接口对接成本
3. **足够性能**: MVP 阶段流量不大,Next.js Route Handlers 足够
4. **降低复杂度**: 不需要维护独立后端服务和 API 网关

何时考虑拆分后端?
- 当 API 请求量超过 Next.js 处理能力
- 当需要复杂后台任务 (如批量处理、定时任务)
- 当需要 WebSocket 长连接
- 当需要独立扩展后端服务

## Supabase 使用方式

### 核心服务
1. **PostgreSQL**: 主数据库,存储所有业务数据
2. **Auth**: 用户认证,支持邮箱密码、OAuth (预留)
3. **RLS**: 行级安全策略,确保数据权限隔离
4. **Storage**: 文件存储 (预留,MVP 可能不用)

### 客户端配置
- **Browser Client**: `src/lib/supabase/client.ts` (用于客户端组件)
- **Server Client**: `src/lib/supabase/server.ts` (用于 Server Components 和 API)

### RLS 策略原则
- 用户只能读写自己的数据
- 作者可以管理自己的文章
- 订阅关系双向可见
- 公开发布的文章所有人可读
- 管理员有特殊权限

## 认证与权限策略

### 用户角色
- **reader**: 普通读者 (默认)
- **author**: 作者 (需要创建 author_profile)
- **admin**: 管理员 (手动授予)

### 认证流程
1. 用户注册 → Supabase Auth 创建用户
2. 触发器自动创建 profiles 记录
3. 用户登录 → 获取 JWT token
4. 前端存储 token,后续请求携带
5. RLS 策略根据 token 中的 user_id 控制数据访问

## 未来 Python 内容处理服务预留

### 为什么预留?
MVP 阶段不需要复杂内容处理,但未来可能需要:
- OCR (图片文字识别)
- PDF 文本提取
- HTML 正文解析
- 自动分类和标签
- 摘要生成

### 服务职责边界
**Python 服务负责**:
- 内容加工 (OCR, 解析, 提取, 分类, 摘要)
- 异步任务队列
- 批量处理

**主应用负责**:
- 用户管理
- 认证授权
- 订阅关系
- 收件箱逻辑
- 笔记和专题
- 前端渲染

### 技术栈 (未来)
- Python 3.11+
- FastAPI
- Celery (任务队列)
- Redis (队列存储)
- Tesseract / PaddleOCR
- BeautifulSoup / Readability

## 部署建议

### MVP 阶段
- **前端 + 后端**: Vercel (自动部署,支持 Next.js)
- **数据库**: Supabase (托管 PostgreSQL)
- **域名**: 自定义域名绑定到 Vercel

### 未来扩展
- **主应用**: Vercel 或 自建服务器
- **Python 服务**: Docker + 云服务器
- **数据库**: Supabase 或 自建 PostgreSQL
- **文件存储**: Supabase Storage 或 OSS

## 架构风险

1. **Supabase 依赖**: 如果 Supabase 服务不稳定,整个应用受影响
   - 缓解: 选择 Supabase 付费计划,或准备迁移到自建 PostgreSQL

2. **Next.js Route Handlers 性能**: 高并发下可能成为瓶颈
   - 缓解: 监控性能,必要时拆分独立后端

3. **RLS 策略复杂度**: 复杂权限逻辑可能导致 RLS 难以维护
   - 缓解: 保持 RLS 策略简单,复杂逻辑放在应用层

4. **前后端耦合**: Next.js 全栈方案导致前后端难以独立扩展
   - 缓解: 保持模块边界清晰,必要时可拆分