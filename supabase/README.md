# Supabase Migrations

## 当前迁移

- `0001_initial_schema.sql`
  - 11 张核心业务表
  - 保守的基础 RLS 策略
  - 不包含认证流程
- `0002_create_profile_on_signup.sql`
  - 在 `auth.users` 新增用户后自动创建 `public.profiles`
  - `profiles.id = auth.users.id`
  - 默认角色为 `reader`
  - 不创建作者资料、不创建 Inbox、不创建任何业务数据

## 如何应用迁移

1. 创建 Supabase 项目
2. 安装 Supabase CLI：`npm install -g supabase`
3. 登录：`supabase login`
4. 关联项目：`supabase link --project-ref <project-id>`
5. 应用迁移：`supabase db push`

如果你更偏向本地数据库验证，也可以使用：

```bash
supabase db reset
```

## 如何生成数据库类型

当前 `src/types/database.ts` 是手写占位类型。后续可以用 Supabase CLI 覆盖成真实生成类型：

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

## 注意事项

- 迁移按顺序编号，不要重排已经存在的迁移。
- 新的数据库变更应创建新的迁移文件，不要回改已发布迁移。
- `0002` 触发器只负责创建基础 `profiles` 记录，不负责任何后续业务初始化。
- 当前认证实现不使用 `service role key`，也不绕过 RLS。
