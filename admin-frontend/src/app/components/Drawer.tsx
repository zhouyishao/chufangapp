import type { PropsWithChildren } from 'react';

import { Button } from './Button';

type Props = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
  widthClassName?: string;
}>;

export const Drawer = ({ title, open, onClose, widthClassName, children }: Props) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={[
          'absolute right-0 top-0 h-full w-full bg-white shadow-2xl',
          widthClassName ?? 'max-w-xl'
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

