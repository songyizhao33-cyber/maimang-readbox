import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  description: string;
  module: string;
  futureFeatures?: string[];
}

export function PlaceholderPage({ title, description, module, futureFeatures }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm p-8 space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-gray-500">模块: {module}</div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        {futureFeatures && futureFeatures.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">未来功能</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {futureFeatures.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-4">
            当前为项目框架阶段,此页面为占位页面,业务逻辑尚未实现。
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}