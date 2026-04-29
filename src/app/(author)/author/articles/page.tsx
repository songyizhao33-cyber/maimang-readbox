import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AuthorArticlesPage() {
  return (
    <PlaceholderPage
      title="我的文章"
      description="管理已发布和草稿文章"
      module="articles"
      futureFeatures={[
        '文章列表 (草稿/已发布/已归档)',
        '编辑文章',
        '删除文章',
        '查看阅读量',
        '归档文章',
      ]}
    />
  );
}