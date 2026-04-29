# Supabase Migrations

## 使用说明

本目录包含数据库迁移文件。

### 初始 Schema

`0001_initial_schema.sql` 包含:
- 11 个核心数据表
- RLS 策略
- 索引
- 触发器

### 如何应用迁移

1. 创建 Supabase 项目
2. 安装 Supabase CLI: `npm install -g supabase`
3. 登录: `supabase login`
4. 链接项目: `supabase link --project-ref <project-id>`
5. 应用迁移: `supabase db push`

### 如何生成类型

```bash
npx supabase gen types typescript --project-id <project-id> > ../src/types/database.ts
```

## 注意事项

- 迁移文件按顺序编号 (0001, 0002, ...)
- 不要修改已应用的迁移文件
- 新的数据库变更应创建新的迁移文件