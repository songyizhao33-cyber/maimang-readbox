// Route constants

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Reader routes
  INBOX: '/inbox',
  LATER: '/later',
  COLLECTIONS: '/collections',
  SETTINGS: '/settings',
  ARTICLE: (id: string) => `/articles/${id}`,

  // Author routes
  AUTHOR_DASHBOARD: '/author/dashboard',
  AUTHOR_WRITE: '/author/write',
  AUTHOR_ARTICLES: '/author/articles',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_REPORTS: '/admin/reports',

  // API routes
  API_HEALTH: '/api/health',
} as const;