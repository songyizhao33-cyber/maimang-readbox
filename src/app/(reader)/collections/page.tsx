import { PlaceholderPage } from '@/components/common/placeholder-page';

export default function CollectionsPage() {
  return (
    <PlaceholderPage
      title="我的专题"
      description="管理个人专题和分类"
      module="collections"
      futureFeatures={[
        '创建专题',
        '编辑专题名称和描述',
        '添加文章和外部内容到专题',
        '专题内容排序',
        '删除专题',
      ]}
    />
  );
}