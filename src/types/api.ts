// API Response Types for Maimang Readbox
// Version: 0.1

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Error Codes
// ============================================================================

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

// ============================================================================
// Request Types
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CreateAuthorRequest {
  penName: string;
  bio?: string;
  avatarUrl?: string;
  homepageUrl?: string;
}

export interface CreateArticleRequest {
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
}

export interface UpdateArticleRequest {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  coverUrl?: string;
}

export interface CreateExternalItemRequest {
  url?: string;
  title: string;
  sourcePlatform?: string;
  sourceAuthor?: string;
  excerpt?: string;
  contentType: 'link' | 'text' | 'image' | 'pdf';
  originalContent?: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface AddCollectionItemRequest {
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
}

export interface CreateNoteRequest {
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
  selectedText?: string;
  content: string;
  visibility?: 'private' | 'public';
}

export interface CreateReflectionRequest {
  itemType: 'article' | 'external_item';
  articleId?: string;
  externalItemId?: string;
  content: string;
  visibility?: 'private' | 'public';
}
