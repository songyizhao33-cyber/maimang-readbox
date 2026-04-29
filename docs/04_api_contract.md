# API 接口契约

**文档用途**: 定义前后端接口规范、请求响应格式和权限要求  
**当前版本**: v0.1  
**最后更新**: 2026-04-29

---

## 一、API 设计原则

### 1.1 命名约定
- RESTful 风格
- 使用复数名词（`/articles` 而非 `/article`）
- 使用 kebab-case（`/external-items` 而非 `/externalItems`）
- 动作使用 POST（`/articles/:id/publish`）

### 1.2 HTTP 方法
- `GET` - 查询资源
- `POST` - 创建资源或执行动作
- `PATCH` - 部分更新资源
- `DELETE` - 删除资源

### 1.3 响应格式

**成功响应**:
```typescript
{
  "data": T,
  "message"?: string
}
```

**错误响应**:
```typescript
{
  "error": {
    "code": string,
    "message": string,
    "details"?: any
  }
}
```

**分页响应**:
```typescript
{
  "data": T[],
  "pagination": {
    "page": number,
    "pageSize": number,
    "total": number,
    "totalPages": number
  }
}
```

### 1.4 权限要求
- 🔓 Public - 无需认证
- 🔐 Authenticated - 需要登录
- 👤 Owner - 需要是资源所有者
- 📝 Author - 需要是作者身份
- 🛡️ Admin - 需要管理员权限

### 1.5 错误代码
- `AUTH_REQUIRED` - 需要登录
- `FORBIDDEN` - 无权限
- `NOT_FOUND` - 资源不存在
- `VALIDATION_ERROR` - 参数验证失败
- `CONFLICT` - 资源冲突
- `INTERNAL_ERROR` - 服务器错误

---

## 二、Auth 模块接口

### 2.1 用户注册
**接口**: `POST /api/auth/register`  
**权限**: 🔓 Public  
**用途**: 用户注册

**请求体**:
```typescript
{
  email: string;
  password: string;
  displayName?: string;
}
```

**响应**:
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      displayName: string;
    };
    session: {
      accessToken: string;
      refreshToken: string;
    };
  }
}
```

**可能错误**:
- `VALIDATION_ERROR` - 邮箱格式错误或密码过短
- `CONFLICT` - 邮箱已存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `profiles`  
**Codex 任务**: T10

---

### 2.2 用户登录
**接口**: `POST /api/auth/login`  
**权限**: 🔓 Public  
**用途**: 用户登录

**请求体**:
```typescript
{
  email: string;
  password: string;
}
```

**响应**:
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      displayName: string;
      role: string;
    };
    session: {
      accessToken: string;
      refreshToken: string;
    };
  }
}
```

**可能错误**:
- `VALIDATION_ERROR` - 参数错误
- `AUTH_REQUIRED` - 邮箱或密码错误

**MVP 必需**: ✅ 是  
**依赖数据表**: `profiles`  
**Codex 任务**: T10

---

### 2.3 用户登出
**接口**: `POST /api/auth/logout`  
**权限**: 🔐 Authenticated  
**用途**: 用户登出

**请求体**: 无

**响应**:
```typescript
{
  message: "Logged out successfully"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: 无  
**Codex 任务**: T10

---

### 2.4 获取当前用户
**接口**: `GET /api/me`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前登录用户信息

**请求参数**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    role: 'reader' | 'author' | 'admin';
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `profiles`  
**Codex 任务**: T10

---

## 三、Profiles 模块接口

### 3.1 获取用户 Profile
**接口**: `GET /api/me/profile`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前用户详细信息

**请求参数**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `profiles`  
**Codex 任务**: T11

---

### 3.2 更新用户 Profile
**接口**: `PATCH /api/me/profile`  
**权限**: 🔐 Authenticated  
**用途**: 更新当前用户信息

**请求体**:
```typescript
{
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `profiles`  
**Codex 任务**: T11

---

## 四、Authors 模块接口

### 4.1 获取作者列表
**接口**: `GET /api/authors`  
**权限**: 🔓 Public  
**用途**: 获取平台作者列表

**请求参数**:
```typescript
{
  page?: number;
  pageSize?: number;
  search?: string;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    userId: string;
    penName: string;
    bio: string | null;
    avatarUrl: string | null;
    homepageUrl: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**: 无

**MVP 必需**: ✅ 是  
**依赖数据表**: `author_profiles`  
**Codex 任务**: T12

---

### 4.2 获取作者详情
**接口**: `GET /api/authors/:id`  
**权限**: 🔓 Public  
**用途**: 获取作者详细信息和文章列表

**请求参数**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    penName: string;
    bio: string | null;
    avatarUrl: string | null;
    homepageUrl: string | null;
    isActive: boolean;
    subscriberCount: number;
    articleCount: number;
    createdAt: string;
  }
}
```

**可能错误**:
- `NOT_FOUND` - 作者不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `author_profiles`, `subscriptions`, `articles`  
**Codex 任务**: T13

---

### 4.3 创建作者身份
**接口**: `POST /api/authors`  
**权限**: 🔐 Authenticated  
**用途**: 用户创建作者身份

**请求体**:
```typescript
{
  penName: string;
  bio?: string;
  avatarUrl?: string;
  homepageUrl?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    penName: string;
    bio: string | null;
    avatarUrl: string | null;
    homepageUrl: string | null;
    isActive: boolean;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `CONFLICT` - 用户已有作者身份
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `author_profiles`  
**Codex 任务**: T12

---

### 4.4 更新作者信息
**接口**: `PATCH /api/authors/:id`  
**权限**: 👤 Owner  
**用途**: 更新作者信息

**请求体**:
```typescript
{
  penName?: string;
  bio?: string;
  avatarUrl?: string;
  homepageUrl?: string;
  isActive?: boolean;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    penName: string;
    bio: string | null;
    avatarUrl: string | null;
    homepageUrl: string | null;
    isActive: boolean;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是作者本人
- `NOT_FOUND` - 作者不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `author_profiles`  
**Codex 任务**: T12

---

## 五、Articles 模块接口

### 5.1 获取文章详情
**接口**: `GET /api/articles/:id`  
**权限**: 🔓 Public（已发布）/ 👤 Owner（草稿）  
**用途**: 获取文章详细内容

**请求参数**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    authorId: string;
    author: {
      id: string;
      penName: string;
      avatarUrl: string | null;
    };
    title: string;
    subtitle: string | null;
    slug: string;
    excerpt: string | null;
    content: string;
    coverUrl: string | null;
    status: 'draft' | 'published' | 'archived' | 'removed';
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `NOT_FOUND` - 文章不存在
- `FORBIDDEN` - 无权查看草稿

**MVP 必需**: ✅ 是  
**依赖数据表**: `articles`, `author_profiles`  
**Codex 任务**: T15

---

### 5.2 创建文章
**接口**: `POST /api/articles`  
**权限**: 📝 Author  
**用途**: 创建文章草稿

**请求体**:
```typescript
{
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    authorId: string;
    title: string;
    subtitle: string | null;
    slug: string;
    excerpt: string | null;
    content: string;
    coverUrl: string | null;
    status: 'draft';
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是作者
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `articles`  
**Codex 任务**: T14

---

### 5.3 更新文章
**接口**: `PATCH /api/articles/:id`  
**权限**: 👤 Owner  
**用途**: 更新文章内容

**请求体**:
```typescript
{
  title?: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  coverUrl?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    title: string;
    subtitle: string | null;
    excerpt: string | null;
    content: string;
    coverUrl: string | null;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是作者本人
- `NOT_FOUND` - 文章不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `articles`  
**Codex 任务**: T14

---

### 5.4 发布文章
**接口**: `POST /api/articles/:id/publish`  
**权限**: 👤 Owner  
**用途**: 发布文章并投递给订阅者

**请求体**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    status: 'published';
    publishedAt: string;
    inboxItemsCreated: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是作者本人
- `NOT_FOUND` - 文章不存在
- `CONFLICT` - 文章已发布

**MVP 必需**: ✅ 是  
**依赖数据表**: `articles`, `subscriptions`, `inbox_items`  
**Codex 任务**: T15, T22

---

### 5.5 获取我的文章列表
**接口**: `GET /api/me/articles`  
**权限**: 📝 Author  
**用途**: 获取当前作者的所有文章

**请求参数**:
```typescript
{
  status?: 'draft' | 'published' | 'archived';
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    excerpt: string | null;
    coverUrl: string | null;
    status: string;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是作者

**MVP 必需**: ✅ 是  
**依赖数据表**: `articles`  
**Codex 任务**: T15

---

## 六、Subscriptions 模块接口

### 6.1 订阅作者
**接口**: `POST /api/subscriptions`  
**权限**: 🔐 Authenticated  
**用途**: 订阅作者

**请求体**:
```typescript
{
  authorId: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    readerId: string;
    authorId: string;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `NOT_FOUND` - 作者不存在
- `CONFLICT` - 已订阅该作者

**MVP 必需**: ✅ 是  
**依赖数据表**: `subscriptions`  
**Codex 任务**: T20

---

### 6.2 取消订阅
**接口**: `DELETE /api/subscriptions/:id`  
**权限**: 👤 Owner  
**用途**: 取消订阅作者

**请求参数**: 无

**响应**:
```typescript
{
  message: "Unsubscribed successfully"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是订阅者本人
- `NOT_FOUND` - 订阅关系不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `subscriptions`  
**Codex 任务**: T21

---

### 6.3 获取我的订阅列表
**接口**: `GET /api/me/subscriptions`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前用户订阅的作者列表

**请求参数**:
```typescript
{
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    author: {
      id: string;
      penName: string;
      avatarUrl: string | null;
      bio: string | null;
    };
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `subscriptions`, `author_profiles`  
**Codex 任务**: T20

---

## 七、Inbox 模块接口

### 7.1 获取收件箱列表
**接口**: `GET /api/inbox`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前用户的收件箱文章

**请求参数**:
```typescript
{
  status?: 'unread' | 'reading' | 'read' | 'archived';
  isStarred?: boolean;
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    sourceType: 'platform_article';
    article: {
      id: string;
      title: string;
      subtitle: string | null;
      excerpt: string | null;
      coverUrl: string | null;
      author: {
        id: string;
        penName: string;
        avatarUrl: string | null;
      };
    };
    status: string;
    isStarred: boolean;
    receivedAt: string;
    readAt: string | null;
    archivedAt: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `inbox_items`, `articles`, `author_profiles`  
**Codex 任务**: T23

---

### 7.2 更新收件箱状态
**接口**: `PATCH /api/inbox/:id/status`  
**权限**: 👤 Owner  
**用途**: 更新收件箱项状态

**请求体**:
```typescript
{
  status: 'unread' | 'reading' | 'read';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    status: string;
    readAt: string | null;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是收件箱所有者
- `NOT_FOUND` - 收件箱项不存在
- `VALIDATION_ERROR` - 状态值无效

**MVP 必需**: ✅ 是  
**依赖数据表**: `inbox_items`  
**Codex 任务**: T24

---

### 7.3 星标收件箱项
**接口**: `PATCH /api/inbox/:id/star`  
**权限**: 👤 Owner  
**用途**: 星标或取消星标

**请求体**:
```typescript
{
  isStarred: boolean;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    isStarred: boolean;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是收件箱所有者
- `NOT_FOUND` - 收件箱项不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `inbox_items`  
**Codex 任务**: T24

---

### 7.4 归档收件箱项
**接口**: `POST /api/inbox/:id/archive`  
**权限**: 👤 Owner  
**用途**: 归档收件箱项

**请求体**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    status: 'archived';
    archivedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是收件箱所有者
- `NOT_FOUND` - 收件箱项不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `inbox_items`  
**Codex 任务**: T24

---

## 八、External Items 模块接口

### 8.1 保存外部内容
**接口**: `POST /api/external-items`  
**权限**: 🔐 Authenticated  
**用途**: 保存外部链接或文本

**请求体**:
```typescript
{
  url?: string;
  title: string;
  sourcePlatform?: string;
  sourceAuthor?: string;
  excerpt?: string;
  contentType: 'link' | 'text' | 'image' | 'pdf';
  originalContent?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    url: string | null;
    title: string;
    sourcePlatform: string | null;
    sourceAuthor: string | null;
    excerpt: string | null;
    contentType: string;
    legalNote: string;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `external_items`  
**Codex 任务**: T30

---

### 8.2 获取待读列表
**接口**: `GET /api/external-items`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前用户保存的外部内容

**请求参数**:
```typescript
{
  contentType?: 'link' | 'text' | 'image' | 'pdf';
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    url: string | null;
    title: string;
    sourcePlatform: string | null;
    sourceAuthor: string | null;
    excerpt: string | null;
    contentType: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `external_items`  
**Codex 任务**: T32

---

### 8.3 获取外部内容详情
**接口**: `GET /api/external-items/:id`  
**权限**: 👤 Owner  
**用途**: 获取外部内容详细信息

**请求参数**: 无

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    url: string | null;
    title: string;
    sourcePlatform: string | null;
    sourceAuthor: string | null;
    excerpt: string | null;
    contentType: string;
    originalContent: string | null;
    extractedContent: string | null;
    legalNote: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是内容所有者
- `NOT_FOUND` - 内容不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `external_items`  
**Codex 任务**: T34

---

### 8.4 更新外部内容
**接口**: `PATCH /api/external-items/:id`  
**权限**: 👤 Owner  
**用途**: 更新外部内容元数据

**请求体**:
```typescript
{
  title?: string;
  sourcePlatform?: string;
  sourceAuthor?: string;
  excerpt?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    title: string;
    sourcePlatform: string | null;
    sourceAuthor: string | null;
    excerpt: string | null;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是内容所有者
- `NOT_FOUND` - 内容不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `external_items`  
**Codex 任务**: T31

---

## 九、Collections 模块接口

### 9.1 创建专题
**接口**: `POST /api/collections`  
**权限**: 🔐 Authenticated  
**用途**: 创建新专题

**请求体**:
```typescript
{
  name: string;
  description?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `collections`  
**Codex 任务**: T40

---

### 9.2 获取专题列表
**接口**: `GET /api/collections`  
**权限**: 🔐 Authenticated  
**用途**: 获取当前用户的专题列表

**请求参数**:
```typescript
{
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录

**MVP 必需**: ✅ 是  
**依赖数据表**: `collections`, `collection_items`  
**Codex 任务**: T40

---

### 9.3 更新专题
**接口**: `PATCH /api/collections/:id`  
**权限**: 👤 Owner  
**用途**: 更新专题信息

**请求体**:
```typescript
{
  name?: string;
  description?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是专题所有者
- `NOT_FOUND` - 专题不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `collections`  
**Codex 任务**: T41

---

### 9.4 删除专题
**接口**: `DELETE /api/collections/:id`  
**权限**: 👤 Owner  
**用途**: 删除专题

**请求参数**: 无

**响应**:
```typescript
{
  message: "Collection deleted successfully"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是专题所有者
- `NOT_FOUND` - 专题不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `collections`, `collection_items`  
**Codex 任务**: T41

---

### 9.5 添加内容到专题
**接口**: `POST /api/collections/:id/items`  
**权限**: 👤 Owner  
**用途**: 将文章或外部内容加入专题

**请求体**:
```typescript
{
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    collectionId: string;
    itemType: string;
    articleId: string | null;
    externalItemId: string | null;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是专题所有者
- `NOT_FOUND` - 专题或内容不存在
- `CONFLICT` - 内容已在专题中
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `collection_items`  
**Codex 任务**: T42

---

### 9.6 从专题移除内容
**接口**: `DELETE /api/collections/:id/items/:itemId`  
**权限**: 👤 Owner  
**用途**: 从专题中移除内容

**请求参数**: 无

**响应**:
```typescript
{
  message: "Item removed from collection"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是专题所有者
- `NOT_FOUND` - 专题或内容不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `collection_items`  
**Codex 任务**: T42

---

## 十、Notes 模块接口

### 10.1 创建笔记
**接口**: `POST /api/notes`  
**权限**: 🔐 Authenticated  
**用途**: 为文章或外部内容创建笔记

**请求体**:
```typescript
{
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
  selectedText?: string;
  content: string;
  visibility?: 'private' | 'public';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    itemType: string;
    articleId: string | null;
    externalItemId: string | null;
    selectedText: string | null;
    content: string;
    visibility: string;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `NOT_FOUND` - 文章或外部内容不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `notes`  
**Codex 任务**: T43

---

### 10.2 获取内容的笔记列表
**接口**: `GET /api/items/:id/notes`  
**权限**: 👤 Owner（私密）/ 🔓 Public（公开）  
**用途**: 获取某个内容的所有笔记

**请求参数**:
```typescript
{
  itemType: 'article' | 'external_item';
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    userId: string;
    user: {
      displayName: string;
      avatarUrl: string | null;
    };
    selectedText: string | null;
    content: string;
    visibility: string;
    createdAt: string;
  }>
}
```

**可能错误**:
- `NOT_FOUND` - 内容不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `notes`, `profiles`  
**Codex 任务**: T43

---

### 10.3 更新笔记
**接口**: `PATCH /api/notes/:id`  
**权限**: 👤 Owner  
**用途**: 更新笔记内容

**请求体**:
```typescript
{
  content?: string;
  visibility?: 'private' | 'public';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    content: string;
    visibility: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是笔记所有者
- `NOT_FOUND` - 笔记不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `notes`  
**Codex 任务**: T43

---

### 10.4 删除笔记
**接口**: `DELETE /api/notes/:id`  
**权限**: 👤 Owner  
**用途**: 删除笔记

**请求参数**: 无

**响应**:
```typescript
{
  message: "Note deleted successfully"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是笔记所有者
- `NOT_FOUND` - 笔记不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `notes`  
**Codex 任务**: T43

---

## 十一、Reflections 模块接口

### 11.1 创建读后感
**接口**: `POST /api/reflections`  
**权限**: 🔐 Authenticated  
**用途**: 为文章或外部内容创建读后感

**请求体**:
```typescript
{
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
  content: string;
  visibility?: 'private' | 'public';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    userId: string;
    itemType: string;
    articleId: string | null;
    externalItemId: string | null;
    content: string;
    visibility: string;
    createdAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `NOT_FOUND` - 文章或外部内容不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `reflections`  
**Codex 任务**: T44

---

### 11.2 获取内容的读后感列表
**接口**: `GET /api/items/:id/reflections`  
**权限**: 👤 Owner（私密）/ 🔓 Public（公开）  
**用途**: 获取某个内容的所有读后感

**请求参数**:
```typescript
{
  itemType: 'article' | 'external_item';
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    userId: string;
    user: {
      displayName: string;
      avatarUrl: string | null;
    };
    content: string;
    visibility: string;
    createdAt: string;
  }>
}
```

**可能错误**:
- `NOT_FOUND` - 内容不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `reflections`, `profiles`  
**Codex 任务**: T44

---

### 11.3 更新读后感
**接口**: `PATCH /api/reflections/:id`  
**权限**: 👤 Owner  
**用途**: 更新读后感内容

**请求体**:
```typescript
{
  content?: string;
  visibility?: 'private' | 'public';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    content: string;
    visibility: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是读后感所有者
- `NOT_FOUND` - 读后感不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ✅ 是  
**依赖数据表**: `reflections`  
**Codex 任务**: T45

---

### 11.4 删除读后感
**接口**: `DELETE /api/reflections/:id`  
**权限**: 👤 Owner  
**用途**: 删除读后感

**请求参数**: 无

**响应**:
```typescript
{
  message: "Reflection deleted successfully"
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是读后感所有者
- `NOT_FOUND` - 读后感不存在

**MVP 必需**: ✅ 是  
**依赖数据表**: `reflections`  
**Codex 任务**: T45

---

## 十二、Admin 模块接口

### 12.1 获取用户列表
**接口**: `GET /api/admin/users`  
**权限**: 🛡️ Admin  
**用途**: 管理员查看用户列表

**请求参数**:
```typescript
{
  role?: 'reader' | 'author' | 'admin';
  page?: number;
  pageSize?: number;
  search?: string;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是管理员

**MVP 必需**: ⚠️ 可选  
**依赖数据表**: `profiles`  
**Codex 任务**: T50

---

### 12.2 获取文章列表（管理）
**接口**: `GET /api/admin/articles`  
**权限**: 🛡️ Admin  
**用途**: 管理员查看所有文章

**请求参数**:
```typescript
{
  status?: 'draft' | 'published' | 'archived' | 'removed';
  page?: number;
  pageSize?: number;
  search?: string;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    title: string;
    author: {
      id: string;
      penName: string;
    };
    status: string;
    publishedAt: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是管理员

**MVP 必需**: ⚠️ 可选  
**依赖数据表**: `articles`, `author_profiles`  
**Codex 任务**: T51

---

### 12.3 内容审核
**接口**: `PATCH /api/admin/articles/:id/moderation`  
**权限**: 🛡️ Admin  
**用途**: 管理员审核或下架文章

**请求体**:
```typescript
{
  status: 'published' | 'removed';
  reason?: string;
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    status: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是管理员
- `NOT_FOUND` - 文章不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ⚠️ 可选  
**依赖数据表**: `articles`  
**Codex 任务**: T51

---

### 12.4 获取举报列表
**接口**: `GET /api/admin/reports`  
**权限**: 🛡️ Admin  
**用途**: 管理员查看举报列表

**请求参数**:
```typescript
{
  status?: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  page?: number;
  pageSize?: number;
}
```

**响应**:
```typescript
{
  data: Array<{
    id: string;
    reporter: {
      id: string;
      displayName: string;
    };
    targetType: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是管理员

**MVP 必需**: ⚠️ 可选  
**依赖数据表**: `moderation_reports`, `profiles`  
**Codex 任务**: T52

---

### 12.5 处理举报
**接口**: `PATCH /api/admin/reports/:id`  
**权限**: 🛡️ Admin  
**用途**: 管理员处理举报

**请求体**:
```typescript
{
  status: 'reviewing' | 'resolved' | 'dismissed';
}
```

**响应**:
```typescript
{
  data: {
    id: string;
    status: string;
    updatedAt: string;
  }
}
```

**可能错误**:
- `AUTH_REQUIRED` - 未登录
- `FORBIDDEN` - 不是管理员
- `NOT_FOUND` - 举报不存在
- `VALIDATION_ERROR` - 参数验证失败

**MVP 必需**: ⚠️ 可选  
**依赖数据表**: `moderation_reports`  
**Codex 任务**: T52

---

## 十三、Health 模块接口

### 13.1 健康检查
**接口**: `GET /api/health`  
**权限**: 🔓 Public  
**用途**: 服务健康检查

**请求参数**: 无

**响应**:
```typescript
{
  ok: true,
  service: "maimang-readbox",
  timestamp: string
}
```

**可能错误**: 无

**MVP 必需**: ✅ 是（已实现）  
**依赖数据表**: 无  
**Codex 任务**: T05（已完成）

---

## 十四、接口实现优先级

### Phase 1: 核心功能（高优先级）
- ✅ Auth: T10
- ✅ Profiles: T11
- ✅ Authors: T12-T13
- ✅ Articles: T14-T15
- ✅ Subscriptions: T20-T21
- ✅ Inbox: T22-T25

### Phase 2: 扩展功能（中优先级）
- ✅ External Items: T30-T34
- ✅ Collections: T40-T42
- ✅ Notes: T43
- ✅ Reflections: T44-T45

### Phase 3: 管理功能（低优先级）
- ⚠️ Admin: T50-T54

---

## 十五、接口总结

**总计**: 46 个接口

**已实现**: 1 个（/api/health）

**待实现**: 45 个

**MVP 必需**: 41 个

**MVP 可选**: 5 个（Admin 模块）

---

**文档状态**: ✅ 完成  
**下一步**: 查看 `docs/05_database_schema.md` 了解数据库设计