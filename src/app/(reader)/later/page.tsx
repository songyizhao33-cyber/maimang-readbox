import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function LaterPage() {
  return (
    <PlaceholderPage
      title="待读列表"
      description="保存的外部内容和稍后阅读的文章"
      module="external-items"
      futureFeatures={[
        '展示用户保存的外部链接',
        '手动添加标题、来源、摘要',
        '支持粘贴文本、图片文字、PDF',
        '合规提示',
        '分类和标签',
      ]}
    />
  );
}