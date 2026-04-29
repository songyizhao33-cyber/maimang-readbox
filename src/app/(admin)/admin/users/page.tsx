import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      title="用户管理"
      description="管理平台用户"
      module="admin"
      futureFeatures={[
        '用户列表',
        '搜索用户',
        '查看用户详情',
        '禁用/启用用户',
        '修改用户角色',
      ]}
    />
  );
}