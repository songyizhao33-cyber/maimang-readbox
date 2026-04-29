import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function AuthorWritePage() {
  return (
    <PlaceholderPage
      title="写作"
      description="轻量写作编辑器"
      module="articles"
      futureFeatures={[
        'Markdown 编辑器',
        '实时预览',
        '保存草稿',
        '发布文章',
        '添加封面图',
        '设置摘要',
      ]}
    />
  );
}