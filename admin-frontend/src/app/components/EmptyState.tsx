type Props = {
  title?: string;
  description?: string;
};

export const EmptyState = ({ title = '暂无数据', description = '调整筛选条件或新增内容后再查看。' }: Props) => (
  <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[#f5f1ea] px-6 py-10 text-center">
    <div className="text-base font-medium text-[#2f2f2f]">{title}</div>
    <div className="mt-2 text-sm text-[#8c8c8c]">{description}</div>
  </div>
);
