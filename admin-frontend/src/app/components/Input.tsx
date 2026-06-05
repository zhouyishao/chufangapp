import type { InputHTMLAttributes } from 'react';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none',
        'focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200',
        props.className ?? ''
      ].join(' ')}
    />
  );
};
