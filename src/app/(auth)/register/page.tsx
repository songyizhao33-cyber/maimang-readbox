import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function RegisterPage() {
  return (
    <PlaceholderPage
      title="注册"
      description="用户注册页面"
      module="auth"
      futureFeatures={[
        '邮箱密码注册',
        '邮箱验证',
        '用户协议和隐私政策',
      ]}
    />
  );
}