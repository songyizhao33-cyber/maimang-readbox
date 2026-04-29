import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AdminReportsPage() {
  return (
    <PlaceholderPage
      title="举报管理"
      description="处理用户举报"
      module="admin"
      futureFeatures={[
        '举报列表',
        '按状态筛选',
        '查看举报详情',
        '处理举报 (通过/驳回)',
        '标记为已处理',
      ]}
    />
  );
}