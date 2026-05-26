type Props = {
  label: string;
  tone?: 'green' | 'orange' | 'red' | 'gray' | 'accent';
};

const toneClass = {
  green: 'bg-[#edf5ea] text-[#6ba368] border-[#d8e9d1]',
  orange: 'bg-[#fbf1e7] text-[#c27b48] border-[#ead3be]',
  red: 'bg-red-50 text-red-700 border-red-100',
  gray: 'bg-[#f5f1ea] text-[#8c8c8c] border-[#e9e2d6]',
  accent: 'bg-[#f4e7dc] text-[#c27b48] border-[#ead3be]'
};

export const StatusTag = ({ label, tone = 'gray' }: Props) => {
  return (
    <span className={['inline-flex min-w-[64px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass[tone]].join(' ')}>
      {label}
    </span>
  );
};
