import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="管理后台"
      description="系统管理和数据概览"
      module="admin"
      futureFeatures={[
        '用户总数统计',
        '文章总数统计',
        '待处理举报数量',
        '系统健康状态',
        '快速管理入口',
      ]}
    />
  );
}