import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
  }
>;

const variantClass: Record<Variant, string> = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed',
  ghost: 'bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300 disabled:cursor-not-allowed'
};

export const Button = ({ variant = 'primary', className, ...props }: Props) => {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition',
        variantClass[variant],
        className ?? ''
      ].join(' ')}
    />
  );
};
