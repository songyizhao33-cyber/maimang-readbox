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
    label: "Authors",
    href: ROUTES.AUTHORS,
    hint: "Browse public author profiles.",
  },
];

export const READER_WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    label: "Inbox",
    href: ROUTES.INBOX,
    hint: "Published subscription articles.",
  },
  {
    label: "Later",
    href: ROUTES.LATER,
    hint: "Your saved external reading items.",
  },
  {
    label: "Collections",
    href: ROUTES.COLLECTIONS,
    hint: "Small shelves for stable themes.",
  },
  {
    label: "Reading Traces",
    href: ROUTES.READING_TRACES,
    hint: "Your notes and reflections in one view.",
  },
];

export const AUTHOR_WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    label: "Author Dashboard",
    href: ROUTES.AUTHOR_DASHBOARD,
    hint: "Manage your public author card.",
  },
  {
    label: "Write",
    href: ROUTES.AUTHOR_WRITE,
    hint: "Draft and publish your next article.",
  },
  {
    label: "My Articles",
    href: ROUTES.AUTHOR_ARTICLES,
    hint: "Review your drafts and published work.",
  },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    label: "Settings",
    href: ROUTES.SETTINGS,
    hint: "Profile details and account basics.",
  },
];

export const AUTH_ACTION_NAV_ITEMS: NavItem[] = [
  {
    label: "Login",
    href: ROUTES.LOGIN,
    hint: "Sign in to your private reader workspace.",
  },
  {
    label: "Register",
    href: ROUTES.REGISTER,
    hint: "Create a new account.",
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
        title: "Account",
        items: AUTH_ACTION_NAV_ITEMS,
      },
    ];
  }

  return [
    {
      title: "Writing",
      items: hasAuthorProfile
        ? AUTHOR_WORKSPACE_NAV_ITEMS
        : [AUTHOR_WORKSPACE_NAV_ITEMS[0]],
    },
    {
      title: "Account",
      items: ACCOUNT_NAV_ITEMS,
    },
  ];
}
