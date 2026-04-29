import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function InboxPage() {
  return (
    <PlaceholderPage
      title="收件箱"
      description="订阅作者的新文章会自动投递到这里"
      module="inbox"
      futureFeatures={[
        '展示订阅作者的新文章',
        '按时间倒序排列',
        '标记为已读/未读',
        '星标收藏',
        '归档',
        '筛选和搜索',
      ]}
    />
  );
}