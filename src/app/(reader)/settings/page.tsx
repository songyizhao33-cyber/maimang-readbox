import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="设置"
      description="个人资料和偏好设置"
      module="profiles"
      futureFeatures={[
        '编辑个人资料',
        '修改头像',
        '修改密码',
        '通知设置',
        '隐私设置',
      ]}
    />
  );
}