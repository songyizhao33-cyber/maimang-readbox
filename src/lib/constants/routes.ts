export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  AUTHORS: "/authors",

  INBOX: "/inbox",
  LATER: "/later",
  READING_TRACES: "/reading-traces",
  COLLECTIONS: "/collections",
  SETTINGS: "/settings",

  ARTICLE: (id: string) => `/articles/${id}`,
  AUTHOR_DETAIL: (id: string) => `/authors/${id}`,
  COLLECTION_DETAIL: (id: string) => `/collections/${id}`,
  EXTERNAL_ITEM_DETAIL: (id: string) => `/external-items/${id}`,

  AUTHOR_DASHBOARD: "/author/dashboard",
  AUTHOR_WRITE: "/author/write",
  AUTHOR_ARTICLES: "/author/articles",

  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_ARTICLES: "/admin/articles",
  ADMIN_REPORTS: "/admin/reports",

  API_HEALTH: "/api/health",
  API_AUTH_LOGOUT: "/api/auth/logout",
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

export const DISCOVERY_NAV_ITEMS: NavItem[] = [
  {
    label: "作者",
    href: ROUTES.AUTHORS,
    hint: "浏览可订阅的作者。",
  },
];

export const READER_WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    label: "工作台",
    href: ROUTES.HOME,
    hint: "回到今天的阅读入口。",
  },
  {
    label: "收件箱",
    href: ROUTES.INBOX,
    hint: "订阅作者的新文章。",
  },
  {
    label: "稍后阅读",
    href: ROUTES.LATER,
    hint: "手动保存外部内容。",
  },
  {
    label: "专题",
    href: ROUTES.COLLECTIONS,
    hint: "整理长期阅读主题。",
  },
  {
    label: "阅读痕迹",
    href: ROUTES.READING_TRACES,
    hint: "笔记和读后感汇总。",
  },
];

export const AUTHOR_WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    label: "作者工作区",
    href: ROUTES.AUTHOR_DASHBOARD,
    hint: "管理作者资料和写作入口。",
  },
  {
    label: "写作",
    href: ROUTES.AUTHOR_WRITE,
    hint: "写一篇新草稿。",
  },
  {
    label: "我的文章",
    href: ROUTES.AUTHOR_ARTICLES,
    hint: "查看草稿和已发布文章。",
  },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    label: "设置",
    href: ROUTES.SETTINGS,
    hint: "个人资料和账号设置。",
  },
];

export const AUTH_ACTION_NAV_ITEMS: NavItem[] = [
  {
    label: "登录",
    href: ROUTES.LOGIN,
    hint: "进入你的阅读空间。",
  },
  {
    label: "注册",
    href: ROUTES.REGISTER,
    hint: "创建新账号。",
  },
];

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  ...DISCOVERY_NAV_ITEMS,
  ...READER_WORKSPACE_NAV_ITEMS,
];

export const SECONDARY_NAV_SECTIONS: NavSection[] = [
  {
    title: "Writing",
    items: AUTHOR_WORKSPACE_NAV_ITEMS,
  },
  {
    title: "Account",
    items: [...ACCOUNT_NAV_ITEMS, ...AUTH_ACTION_NAV_ITEMS],
  },
];

export function getPrimaryNavItems(isAuthenticated: boolean): NavItem[] {
  return isAuthenticated ? PRIMARY_NAV_ITEMS : DISCOVERY_NAV_ITEMS;
}

export function getSecondaryNavSections({
  hasAuthorProfile,
  isAuthenticated,
}: {
  hasAuthorProfile: boolean;
  isAuthenticated: boolean;
}): NavSection[] {
  if (!isAuthenticated) {
    return [
    {
      title: "账号",
      items: AUTH_ACTION_NAV_ITEMS,
    },
  ];
  }

  return [
    {
      title: "写作",
      items: hasAuthorProfile
        ? AUTHOR_WORKSPACE_NAV_ITEMS
        : [AUTHOR_WORKSPACE_NAV_ITEMS[0]],
    },
    {
      title: "账号",
      items: ACCOUNT_NAV_ITEMS,
    },
  ];
}
