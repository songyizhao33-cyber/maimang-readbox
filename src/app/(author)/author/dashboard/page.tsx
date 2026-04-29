import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AuthorDashboardPage() {
  return (
    <PlaceholderPage
      title="作者后台"
      description="作者数据概览和管理"
      module="authors"
      futureFeatures={[
        '订阅者数量统计',
        '文章阅读量统计',
        '最近发布的文章',
        '草稿列表',
        '快速写作入口',
      ]}
    />
  );
}