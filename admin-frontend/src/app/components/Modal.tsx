import type { PropsWithChildren } from 'react';

import { Button } from './Button';

type Props = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
}>;

export const Modal = ({ title, open, onClose, children }: Props) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

