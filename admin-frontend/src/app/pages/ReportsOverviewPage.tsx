import { ArrowUpRight, BarChart2, BookOpen, Clock, Heart, Search, Users } from 'lucide-react';

export const ReportsOverviewPage = () => {
  const metrics = [
    { title: '今日新增内容', value: '42', change: '+12%', icon: <BookOpen className="h-5 w-5" />, tone: 'green' },
    { title: '今日新增用户', value: '185', change: '+8%', icon: <Users className="h-5 w-5" />, tone: 'blue' },
    { title: '今日访问量 (PV)', value: '14,250', change: '+24%', icon: <ArrowUpRight className="h-5 w-5" />, tone: 'orange' },
    { title: '今日搜索量', value: '3,840', change: '+15%', icon: <Search className="h-5 w-5" />, tone: 'blue' },
    { title: '今日收藏量', value: '920', change: '+18%', icon: <Heart className="h-5 w-5" />, tone: 'red' },
    { title: '内容审核待处理', value: '7', change: '-4', isWarning: true, icon: <Clock className="h-5 w-5" />, tone: 'orange' }
  ];

  const trends = [
    { date: '06-13', userCount: 185, searchCount: 3840, viewCount: 14250 },
    { date: '06-12', userCount: 171, searchCount: 3510, viewCount: 13100 },
    { date: '06-11', userCount: 165, searchCount: 3220, viewCount: 12400 },
    { date: '06-10', userCount: 190, searchCount: 3400, viewCount: 12900 },
    { date: '06-09', userCount: 142, searchCount: 2900, viewCount: 11200 },
    { date: '06-08', userCount: 138, searchCount: 2750, viewCount: 10900 },
    { date: '06-07', userCount: 151, searchCount: 2950, viewCount: 11500 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">运营概览</h1>
        <p className="mt-1 text-sm text-[#8c8c8c]">查看系统今日核心流量、活跃指标、内容建设情况及多维趋势表现。</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m, i) => {
          const toneClass = {
            green: 'bg-[#edf5ea] text-[#6f8b62]',
            blue: 'bg-blue-50 text-blue-600',
            orange: 'bg-[#fbf1e7] text-[#c27b48]',
            red: 'bg-rose-50 text-rose-600'
          }[m.tone ?? 'green'];
          return (
            <div key={i} className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8c8c8c]">{m.title}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
                  {m.icon}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-bold text-[#2f2f2f]">{m.value}</span>
                <span className={`text-[11px] font-semibold ${m.isWarning ? 'text-orange-500' : m.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend table & graphical representation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#e9e2d6] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#2f2f2f] flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#7a8b6f]" /> 最近 7 天核心流量趋势
            </h3>
            <span className="text-xs text-[#8c8c8c]">单位: 次 / 人</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[#8c8c8c] border-b border-[#f1ece4]">
                <tr>
                  <th className="py-2">日期</th>
                  <th className="py-2">新增用户数</th>
                  <th className="py-2">搜索量</th>
                  <th className="py-2">页面访问量 (PV)</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.date} className="border-b border-[#f1ece4] last:border-b-0 hover:bg-[#fffdfc]">
                    <td className="py-3 font-semibold text-[#2f2f2f]">{t.date}</td>
                    <td className="py-3 text-zinc-700">{t.userCount}</td>
                    <td className="py-3 text-zinc-700">{t.searchCount}</td>
                    <td className="py-3 text-zinc-700">{t.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e9e2d6] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#2f2f2f] mb-3">系统运行状态</h3>
            <p className="text-xs text-[#8c8c8c] leading-relaxed">系统后台及接口同步状态良好。最近 7 天各模块未检测到服务中断，三方资源同步耗时处于正常区间内。</p>
          </div>
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-[#f5f1ea] pb-2 text-xs">
              <span className="text-[#8c8c8c]">主后端延迟</span>
              <span className="font-semibold text-emerald-600">8 ms</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f5f1ea] pb-2 text-xs">
              <span className="text-[#8c8c8c]">媒体服务器</span>
              <span className="font-semibold text-emerald-600">正常</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8c8c8c]">Prisma 数据库池</span>
              <span className="font-semibold text-emerald-600">5 / 20 连接</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
