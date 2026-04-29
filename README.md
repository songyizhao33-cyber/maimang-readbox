# 麦芒订阅 / Maimang Readbox

> 反信息流的深度阅读收件箱

## 项目定位

麦芒订阅是一个"小而美"的深度阅读平台,核心是"邮箱式阅读列表":

- **读者功能**: 订阅作者 → 作品投递到收件箱 + 保存外部内容到待读列表
- **作者功能**: 轻量写作 → 发布 → 自动投递给订阅者
- **产品精神**: 反信息流、反流量逻辑、深度阅读、长期资料整理

## 技术栈

- **前端**: Next.js 16+ (App Router) + React + TypeScript + Tailwind CSS
- **后端**: Next.js Route Handlers + Server Actions
- **数据库**: Supabase PostgreSQL + Row Level Security
- **认证**: Supabase Auth
- **包管理**: pnpm

## 项目结构

```
maimang-readbox/
  docs/              # 项目文档
  src/
    app/             # Next.js App Router 页面和 API
    components/      # React 组件
    features/        # 功能模块 (按业务领域划分)
    lib/             # 工具函数和客户端
    types/           # TypeScript 类型定义
  supabase/
    migrations/      # 数据库迁移文件
  tests/             # 测试文件
```

## 本地运行

### 前置要求

- Node.js 24+
- pnpm 10+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 其他命令

```bash
pnpm lint      # 代码检查
pnpm build     # 构建生产版本
```

## 当前完成状态

✅ 项目框架已建立
✅ 目录结构已创建
✅ 页面占位已完成
✅ API health check 已实现
✅ 数据库 schema 初稿已完成
✅ TypeScript 类型定义已完成
✅ 项目文档已创建

⏳ 业务逻辑尚未实现 (见后续任务)

## 当前不包含的功能

- ❌ 用户注册登录 (待实现)
- ❌ 文章创建和发布 (待实现)
- ❌ 订阅和收件箱 (待实现)
- ❌ 外部内容保存 (待实现)
- ❌ 笔记和专题 (待实现)
- ❌ 支付和订阅付费 (MVP 不做)
- ❌ 推荐算法和热榜 (MVP 不做)
- ❌ 评论和私信 (MVP 不做)

## 后续任务入口

查看 `docs/08_codex_task_board.md` 了解详细任务清单。

查看 `TASKS.md` 了解当前进度和下一步任务。

## 如何使用 Claude Code

本项目已配置 `CLAUDE.md`,包含 Karpathy 启发的编码原则。

使用 Claude Code 时,它会自动遵循这些原则:
1. Think Before Coding - 编码前思考
2. Simplicity First - 简洁优先
3. Surgical Changes - 精准修改
4. Goal-Driven Execution - 目标驱动执行

## 如何使用 Cursor

本项目已配置 `.cursor/rules/project-rules.mdc`,Cursor 会自动应用这些规则。

## 如何阅读文档

1. **项目宪章**: `docs/00_project_charter.md` - 了解项目定位和目标
2. **架构总览**: `docs/02_architecture_overview.md` - 了解技术架构
3. **模块地图**: `docs/03_module_map.md` - 了解模块划分
4. **API 契约**: `docs/04_api_contract.md` - 了解接口设计
5. **数据库设计**: `docs/05_database_schema.md` - 了解数据表结构
6. **任务板**: `docs/08_codex_task_board.md` - 了解后续任务

## 如何进行阶段检查

查看 `docs/09_progress_checkpoints.md` 了解各阶段检查标准。

## License

MIT
