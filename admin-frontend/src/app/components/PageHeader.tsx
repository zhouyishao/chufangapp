import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, actions }: Props) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[#8c8c8c]">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
