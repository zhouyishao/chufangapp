const metrics = [
  { label: '今日访问', value: '2.8k', help: '较昨日 +12%' },
  { label: '待审核', value: '18', help: '投稿菜谱 / 评论' },
  { label: '内容总量', value: '1,286', help: '菜谱、食材、调酒' },
  { label: '价格更新', value: '365', help: '近 7 日价格记录' }
];

const todos = ['用户投稿菜谱待审核', '首页推荐位需补齐', '食材价格来源待确认', '图片库未使用文件待清理'];

const hotContents = ['番茄炒蛋', '牛肉土豆炖饭', '春季芦笋', '柠檬薄荷气泡饮'];

export const DashboardPage = () => {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#2f2f2f]">工作台</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#8c8c8c]">
          高级生活方式内容运营后台。聚合今日数据、待办事项、热门内容和运营提醒。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="text-sm text-[#8c8c8c]">{metric.label}</div>
            <div className="mt-4 text-3xl font-semibold text-[#2f2f2f]">{metric.value}</div>
            <div className="mt-2 text-sm text-[#7a8b6f]">{metric.help}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">待办事项</div>
          <div className="mt-5 space-y-3">
            {todos.map((todo) => (
              <div key={todo} className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm">
                <span>{todo}</span>
                <span className="text-[#7a8b6f]">待处理</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">热门内容</div>
          <div className="mt-5 space-y-3">
            {hotContents.map((content, index) => (
              <div key={content} className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm">
                <span>{content}</span>
                <span className="text-[#8c8c8c]">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
