import type { ReactNode } from 'react';

import { Button } from './Button';
import { Modal } from './Modal';

type Props = {
  title: string;
  open: boolean;
  description?: ReactNode;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export const ConfirmModal = ({
  title,
  open,
  description,
  confirmText,
  danger,
  loading,
  onClose,
  onConfirm
}: Props) => {
  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="space-y-4">
        {description ? <div className="text-sm text-zinc-600">{description}</div> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={loading} onClick={() => void onConfirm()}>
            {loading ? '处理中...' : confirmText ?? '确认'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
