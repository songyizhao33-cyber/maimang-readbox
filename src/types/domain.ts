// Domain Types for Maimang Readbox
// Version: 0.2

export type UserRole = "reader" | "author" | "admin";
export type ArticleStatus = "draft" | "published" | "archived" | "removed";
export type InboxStatus = "unread" | "reading" | "read" | "archived";
export type SourceType = "platform_article" | "external_link";
export type ContentType = "link" | "text" | "image" | "pdf";
export type Visibility = "private" | "public";
export type ModerationStatus =
  | "open"
  | "reviewing"
  | "resolved"
  | "dismissed";
export type ModerationTargetType = "article" | "reflection" | "note";
export type SavedItemType = "article" | "external_item";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfile {
  id: string;
  userId: string;
  penName: string;
  bio: string | null;
  avatarUrl: string | null;
  homepageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  authorId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  readerId: string;
  authorId: string;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  userId: string;
  sourceType: SourceType;
  articleId: string | null;
  externalItemId: string | null;
  status: InboxStatus;
  isStarred: boolean;
  receivedAt: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalItem {
  id: string;
  userId: string;
  url: string | null;
  title: string;
  sourcePlatform: string | null;
  sourceAuthor: string | null;
  excerpt: string | null;
  contentType: ContentType;
  originalContent: string | null;
  extractedContent: string | null;
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  selectedText: string | null;
  content: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  userId: string;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  content: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetType: ModerationTargetType;
  articleId: string | null;
  reflectionId: string | null;
  noteId: string | null;
  reason: string;
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string;
}
