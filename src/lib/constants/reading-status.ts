// Reading status constants

import type { InboxStatus, ArticleStatus } from '@/types/domain';

export const INBOX_STATUS: Record<InboxStatus, { label: string; color: string }> = {
  unread: { label: '未读', color: 'blue' },
  reading: { label: '阅读中', color: 'yellow' },
  read: { label: '已读', color: 'green' },
  archived: { label: '已归档', color: 'gray' },
};

export const ARTICLE_STATUS: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'gray' },
  published: { label: '已发布', color: 'green' },
  archived: { label: '已归档', color: 'yellow' },
  removed: { label: '已下架', color: 'red' },
};