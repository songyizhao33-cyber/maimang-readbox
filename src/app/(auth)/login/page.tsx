import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="登录"
      description="用户登录页面"
      module="auth"
      futureFeatures={[
        '邮箱密码登录',
        'OAuth 登录 (Google, GitHub 等)',
        '记住登录状态',
        '忘记密码',
      ]}
    />
  );
}