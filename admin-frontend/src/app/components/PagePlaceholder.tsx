type Props = {
  title: string;
  description: string;
  modules?: string[];
  fields?: string[];
};

export const PagePlaceholder = ({ title, description, modules = [], fields = [] }: Props) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#8c8c8c]">{description}</p>
        </div>
        <div className="rounded-full bg-[#7a8b6f] px-5 py-2 text-sm font-medium text-white">等待后续业务开发</div>
      </div>

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        <div className="text-lg font-semibold text-[#2f2f2f]">该页面已接入路由，等待后续业务开发</div>
        <div className="mt-2 text-sm text-[#8c8c8c]">当前仅保留导航入口和信息架构，不作为 P0 真实业务页面交付。</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">页面能力</div>
          <div className="mt-4 space-y-3 text-sm text-[#8c8c8c]">
            {(modules.length ? modules : ['列表 / 详情 / 新增 / 编辑入口', '搜索、筛选、分页占位', 'Drawer / Modal 交互占位']).map((item) => (
              <div key={item} className="rounded-2xl bg-[#f5f1ea] px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">字段/接口方向</div>
          <div className="mt-4 space-y-3 text-sm text-[#8c8c8c]">
            {(fields.length ? fields : ['字段按 PRD 接入', 'API 先保留模块边界', '后续补加载态、空态、错误态']).map((item) => (
              <div key={item} className="rounded-2xl bg-[#f5f1ea] px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
