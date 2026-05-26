import type { PropsWithChildren } from 'react';

export const FilterPanel = ({ children }: PropsWithChildren) => (
  <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">{children}</div>
  </div>
);
