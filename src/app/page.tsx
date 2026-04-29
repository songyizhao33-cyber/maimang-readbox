import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
      <main className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900">
          麦芒订阅
        </h1>
        <p className="text-xl text-gray-600">
          反信息流的深度阅读收件箱
        </p>
        <p className="text-gray-500 leading-relaxed">
          订阅你喜欢的作者,作品像邮件一样投递到收件箱。<br />
          保存外部内容,建立个人资料库。<br />
          深度阅读,长期整理,为思想买单。
        </p>

        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            注册
          </Link>
        </div>

        <div className="pt-12 text-sm text-gray-400">
          <p>当前为项目框架阶段,业务功能尚未实现</p>
          <p className="mt-2">
            <Link href="/api/health" className="text-blue-600 hover:underline">
              API Health Check
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
