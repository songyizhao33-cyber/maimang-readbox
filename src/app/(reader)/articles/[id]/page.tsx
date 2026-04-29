import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title="文章阅读器"
      description={`文章 ID: ${params.id}`}
      module="reader-ui"
      futureFeatures={[
        '沉浸式阅读体验',
        '添加笔记和高亮',
        '写读后感',
        '星标和归档',
        '分享',
        '字体和排版设置',
      ]}
    />
  );
}