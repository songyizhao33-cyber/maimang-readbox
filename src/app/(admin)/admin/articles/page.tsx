import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AdminArticlesPage() {
  return (
    <PlaceholderPage
      title="文章管理"
      description="管理平台文章"
      module="admin"
      futureFeatures={[
        '文章列表',
        '搜索文章',
        '查看文章详情',
        '下架文章',
        '恢复文章',
      ]}
    />
  );
}