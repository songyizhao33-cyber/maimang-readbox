# 数据库设计文档

**文档用途**: 定义数据库表结构、字段说明和关系设计  
**当前版本**: v0.1  
**最后更新**: 2026-04-29

---

## 一、数据库技术栈

- **数据库**: PostgreSQL 14+
- **认证**: Supabase Auth
- **权限**: Row Level Security (RLS)
- **主键**: UUID
- **时间戳**: timestamptz

---

## 二、核心表设计

### 2.1 profiles（用户基础信息）

**用途**: 存储用户基础信息

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 用户 ID（与 auth.users.id 一致）|
| email | text | NOT NULL, UNIQUE | 邮箱 |
| display_name | text | NOT NULL | 显示名称 |
| avatar_url | text | NULL | 头像 URL |
| bio | text | NULL | 个人简介 |
| role | text | NOT NULL, DEFAULT 'reader' | 角色：reader/author/admin |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE (email)
- INDEX (role)

**RLS 策略**:
- 用户可以查看自己的 profile
- 用户可以更新自己的 profile
- Admin 可以查看所有 profile

**MVP 必需**: ✅ 是

---

### 2.2 author_profiles（作者信息）

**用途**: 存储作者专属信息

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 作者 ID |
| user_id | uuid | NOT NULL, UNIQUE, FK | 关联用户 ID |
| pen_name | text | NOT NULL | 笔名 |
| bio | text | NULL | 作者简介 |
| avatar_url | text | NULL | 作者头像 |
| homepage_url | text | NULL | 个人主页链接 |
| is_active | boolean | NOT NULL, DEFAULT true | 是否激活 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE (user_id)
- INDEX (is_active)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE

**RLS 策略**:
- 所有人可以查看激活的作者
- 作者可以更新自己的信息
- Admin 可以管理所有作者

**MVP 必需**: ✅ 是

---

### 2.3 articles（文章）

**用途**: 存储文章内容

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 文章 ID |
| author_id | uuid | NOT NULL, FK | 作者 ID |
| title | text | NOT NULL | 标题 |
| subtitle | text | NULL | 副标题 |
| slug | text | NOT NULL, UNIQUE | URL 友好标识 |
| excerpt | text | NULL | 摘要 |
| content | text | NOT NULL | 正文内容 |
| cover_url | text | NULL | 封面图 URL |
| status | text | NOT NULL, DEFAULT 'draft' | 状态：draft/published/archived/removed |
| published_at | timestamptz | NULL | 发布时间 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE (slug)
- INDEX (author_id)
- INDEX (status)
- INDEX (published_at DESC)

**外键**:
- author_id REFERENCES author_profiles(id) ON DELETE CASCADE

**RLS 策略**:
- 所有人可以查看已发布文章
- 作者可以查看自己的所有文章
- 作者可以创建和更新自己的文章
- Admin 可以管理所有文章

**MVP 必需**: ✅ 是

---

### 2.4 subscriptions（订阅关系）

**用途**: 存储读者订阅作者的关系

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 订阅 ID |
| reader_id | uuid | NOT NULL, FK | 读者 ID |
| author_id | uuid | NOT NULL, FK | 作者 ID |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 订阅时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE (reader_id, author_id)
- INDEX (reader_id)
- INDEX (author_id)

**外键**:
- reader_id REFERENCES profiles(id) ON DELETE CASCADE
- author_id REFERENCES author_profiles(id) ON DELETE CASCADE

**RLS 策略**:
- 用户可以查看自己的订阅
- 用户可以创建和删除自己的订阅
- 作者可以查看订阅自己的用户数量

**MVP 必需**: ✅ 是

---

### 2.5 inbox_items（收件箱）

**用途**: 存储用户收件箱中的文章

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 收件箱项 ID |
| user_id | uuid | NOT NULL, FK | 用户 ID |
| source_type | text | NOT NULL | 来源类型：platform_article/external_link |
| article_id | uuid | NULL, FK | 平台文章 ID |
| external_item_id | uuid | NULL, FK | 外部内容 ID |
| status | text | NOT NULL, DEFAULT 'unread' | 状态：unread/reading/read/archived |
| is_starred | boolean | NOT NULL, DEFAULT false | 是否星标 |
| received_at | timestamptz | NOT NULL, DEFAULT now() | 接收时间 |
| read_at | timestamptz | NULL | 阅读时间 |
| archived_at | timestamptz | NULL | 归档时间 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id, status)
- INDEX (user_id, is_starred)
- INDEX (received_at DESC)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE
- article_id REFERENCES articles(id) ON DELETE CASCADE
- external_item_id REFERENCES external_items(id) ON DELETE CASCADE

**约束**:
- CHECK ((article_id IS NOT NULL AND external_item_id IS NULL) OR (article_id IS NULL AND external_item_id IS NOT NULL))

**RLS 策略**:
- 用户只能查看和管理自己的收件箱

**MVP 必需**: ✅ 是

---

### 2.6 external_items（外部内容）

**用途**: 存储用户保存的外部链接和内容

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 外部内容 ID |
| user_id | uuid | NOT NULL, FK | 用户 ID |
| url | text | NULL | 原始 URL |
| title | text | NOT NULL | 标题 |
| source_platform | text | NULL | 来源平台 |
| source_author | text | NULL | 来源作者 |
| excerpt | text | NULL | 摘要 |
| content_type | text | NOT NULL | 内容类型：link/text/image/pdf |
| original_content | text | NULL | 原始内容（用户粘贴的文本）|
| extracted_content | text | NULL | 提取的内容（未来 OCR/解析）|
| legal_note | text | NOT NULL | 合规提示 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (content_type)
- INDEX (created_at DESC)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE

**RLS 策略**:
- 用户只能查看和管理自己保存的外部内容

**MVP 必需**: ✅ 是

---

### 2.7 collections（专题）

**用途**: 存储用户创建的专题

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 专题 ID |
| user_id | uuid | NOT NULL, FK | 用户 ID |
| name | text | NOT NULL | 专题名称 |
| description | text | NULL | 专题描述 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE

**RLS 策略**:
- 用户只能查看和管理自己的专题

**MVP 必需**: ✅ 是

---

### 2.8 collection_items（专题内容）

**用途**: 存储专题中的内容项

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 专题内容 ID |
| collection_id | uuid | NOT NULL, FK | 专题 ID |
| item_type | text | NOT NULL | 内容类型：article/external_item |
| article_id | uuid | NULL, FK | 文章 ID |
| external_item_id | uuid | NULL, FK | 外部内容 ID |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 添加时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (collection_id)
- UNIQUE (collection_id, article_id) WHERE article_id IS NOT NULL
- UNIQUE (collection_id, external_item_id) WHERE external_item_id IS NOT NULL

**外键**:
- collection_id REFERENCES collections(id) ON DELETE CASCADE
- article_id REFERENCES articles(id) ON DELETE CASCADE
- external_item_id REFERENCES external_items(id) ON DELETE CASCADE

**约束**:
- CHECK ((article_id IS NOT NULL AND external_item_id IS NULL) OR (article_id IS NULL AND external_item_id IS NOT NULL))

**RLS 策略**:
- 用户只能管理自己专题中的内容

**MVP 必需**: ✅ 是

---

### 2.9 notes（笔记）

**用途**: 存储用户的阅读笔记

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 笔记 ID |
| user_id | uuid | NOT NULL, FK | 用户 ID |
| item_type | text | NOT NULL | 内容类型：article/external_item |
| article_id | uuid | NULL, FK | 文章 ID |
| external_item_id | uuid | NULL, FK | 外部内容 ID |
| selected_text | text | NULL | 选中的文本 |
| content | text | NOT NULL | 笔记内容 |
| visibility | text | NOT NULL, DEFAULT 'private' | 可见性：private/public |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (article_id)
- INDEX (external_item_id)
- INDEX (visibility)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE
- article_id REFERENCES articles(id) ON DELETE CASCADE
- external_item_id REFERENCES external_items(id) ON DELETE CASCADE

**约束**:
- CHECK ((article_id IS NOT NULL AND external_item_id IS NULL) OR (article_id IS NULL AND external_item_id IS NOT NULL))

**RLS 策略**:
- 用户可以查看和管理自己的所有笔记
- 当前 migration 仅开放用户本人读写
- 公开笔记读取策略留到 T43 明确分享边界后再开放

**MVP 必需**: ✅ 是

---

### 2.10 reflections（读后感）

**用途**: 存储用户的读后感

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 读后感 ID |
| user_id | uuid | NOT NULL, FK | 用户 ID |
| item_type | text | NOT NULL | 内容类型：article/external_item |
| article_id | uuid | NULL, FK | 文章 ID |
| external_item_id | uuid | NULL, FK | 外部内容 ID |
| content | text | NOT NULL | 读后感内容 |
| visibility | text | NOT NULL, DEFAULT 'private' | 可见性：private/public |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (article_id)
- INDEX (external_item_id)
- INDEX (visibility)

**外键**:
- user_id REFERENCES profiles(id) ON DELETE CASCADE
- article_id REFERENCES articles(id) ON DELETE CASCADE
- external_item_id REFERENCES external_items(id) ON DELETE CASCADE

**约束**:
- CHECK ((article_id IS NOT NULL AND external_item_id IS NULL) OR (article_id IS NULL AND external_item_id IS NOT NULL))

**RLS 策略**:
- 用户可以查看和管理自己的所有读后感
- 当前 migration 仅开放用户本人读写
- 公开读后感读取策略留到 T44-T45 明确分享边界后再开放

**MVP 必需**: ✅ 是

---

### 2.11 moderation_reports（举报）

**用途**: 存储用户举报记录

**字段**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 举报 ID |
| reporter_id | uuid | NOT NULL, FK | 举报人 ID |
| target_type | text | NOT NULL | 举报对象类型：article/reflection/note |
| article_id | uuid | NULL, FK | 文章 ID |
| reflection_id | uuid | NULL, FK | 读后感 ID |
| note_id | uuid | NULL, FK | 笔记 ID |
| reason | text | NOT NULL | 举报原因 |
| status | text | NOT NULL, DEFAULT 'open' | 状态：open/reviewing/resolved/dismissed |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 举报时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (reporter_id)
- INDEX (status)
- INDEX (created_at DESC)

**外键**:
- reporter_id REFERENCES profiles(id) ON DELETE CASCADE
- article_id REFERENCES articles(id) ON DELETE CASCADE
- reflection_id REFERENCES reflections(id) ON DELETE CASCADE
- note_id REFERENCES notes(id) ON DELETE CASCADE

**约束**:
- CHECK (article_id IS NOT NULL OR reflection_id IS NOT NULL OR note_id IS NOT NULL)

**RLS 策略**:
- 用户可以创建举报
- 用户可以查看自己提交的举报
- Admin 查看和处理策略留到 T50-T52 再补充

**MVP 必需**: ⚠️ 可选

---

## 三、表关系图

```
profiles (用户)
  ├─→ author_profiles (作者身份)
  │     ├─→ articles (文章)
  │     │     ├─→ inbox_items (收件箱)
  │     │     ├─→ collection_items (专题内容)
  │     │     ├─→ notes (笔记)
  │     │     └─→ reflections (读后感)
  │     └─→ subscriptions (订阅关系)
  ├─→ external_items (外部内容)
  │     ├─→ inbox_items (收件箱)
  │     ├─→ collection_items (专题内容)
  │     ├─→ notes (笔记)
  │     └─→ reflections (读后感)
  ├─→ collections (专题)
  │     └─→ collection_items (专题内容)
  ├─→ subscriptions (订阅关系)
  ├─→ inbox_items (收件箱)
  ├─→ notes (笔记)
  ├─→ reflections (读后感)
  └─→ moderation_reports (举报)
```

---

## 四、RLS 权限原则

### 4.1 基本原则
- 用户只能访问自己的私有数据
- 公开数据所有人可见
- 管理员跨用户访问策略按模块逐步补充，不在当前初始 migration 中一次性放开

### 4.2 具体策略

**profiles**:
```sql
-- 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用户可以更新自己的 profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

**articles**:
```sql
-- 所有人可以查看已发布文章
CREATE POLICY "Anyone can view published articles" ON articles
  FOR SELECT USING (status = 'published');

-- 作者可以查看自己的所有文章
CREATE POLICY "Authors can view own articles" ON articles
  FOR SELECT USING (author_id IN (
    SELECT id FROM author_profiles WHERE user_id = auth.uid()
  ));
```

**inbox_items**:
```sql
-- 用户只能查看自己的收件箱
CREATE POLICY "Users can view own inbox" ON inbox_items
  FOR SELECT USING (user_id = auth.uid());

-- 用户只能更新自己的收件箱
CREATE POLICY "Users can update own inbox" ON inbox_items
  FOR UPDATE USING (user_id = auth.uid());
```

---

## 五、未来调整空间

### 5.1 可能新增的字段
- articles.view_count - 阅读次数
- articles.like_count - 点赞数（如果未来添加点赞功能）
- author_profiles.verified - 作者认证标识
- profiles.subscription_tier - 订阅等级（如果未来添加付费功能）

### 5.2 可能新增的表
- article_versions - 文章版本历史
- payments - 支付记录（如果未来添加付费功能）
- notifications - 通知记录
- tags - 标签系统
- article_tags - 文章标签关联

### 5.3 性能优化空间
- 添加全文搜索索引（PostgreSQL tsvector）
- 添加物化视图缓存统计数据
- 分区大表（如 inbox_items）

---

**文档状态**: ✅ 完成  
**下一步**: 查看 `supabase/migrations/0001_initial_schema.sql` 了解实际 SQL
