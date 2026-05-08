export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  AUTHORS: "/authors",

  INBOX: "/inbox",
  LATER: "/later",
  READING_TRACES: "/reading-traces",
  EXTERNAL_ITEM_DETAIL: (id: string) => `/external-items/${id}`,
  COLLECTIONS: "/collections",
  COLLECTION_DETAIL: (id: string) => `/collections/${id}`,
  SETTINGS: "/settings",
  ARTICLE: (id: string) => `/articles/${id}`,
  AUTHOR_DETAIL: (id: string) => `/authors/${id}`,

  AUTHOR_DASHBOARD: "/author/dashboard",
  AUTHOR_WRITE: "/author/write",
  AUTHOR_ARTICLES: "/author/articles",

  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_ARTICLES: "/admin/articles",
  ADMIN_REPORTS: "/admin/reports",

  API_HEALTH: "/api/health",
} as const;

export interface NavItem {
  label: string;
  href: string;
  hint?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "首页", href: ROUTES.HOME, hint: "产品概览" },
  { label: "作者", href: ROUTES.AUTHORS, hint: "公开作者资料" },
  { label: "收件箱", href: ROUTES.INBOX, hint: "订阅文章入口" },
  { label: "待读", href: ROUTES.LATER, hint: "外部保存内容" },
  { label: "专题", href: ROUTES.COLLECTIONS, hint: "按主题整理" },
];

export const SECONDARY_NAV_SECTIONS: NavSection[] = [
  {
    title: "作者",
    items: [
      {
        label: "作者后台",
        href: ROUTES.AUTHOR_DASHBOARD,
        hint: "作者概览",
      },
      {
        label: "写作",
        href: ROUTES.AUTHOR_WRITE,
        hint: "草稿与发布前入口",
      },
    ],
  },
  {
    title: "系统",
    items: [
      { label: "管理后台", href: ROUTES.ADMIN, hint: "内容与举报管理" },
      { label: "登录", href: ROUTES.LOGIN, hint: "认证占位页" },
      { label: "注册", href: ROUTES.REGISTER, hint: "认证占位页" },
    ],
  },
];
