import { StatusTag } from './StatusTag';

export type CreatedPageItem = {
  title: string;
  description: string;
  status: string;
};

type Props = {
  items: CreatedPageItem[];
};

export const CreatedPageList = ({ items }: Props) => {
  return (
    <div className="absolute left-[680px] top-[318px] flex w-[420px] flex-col gap-5">
      {items.map((item) => (
        <div
          key={item.title}
          className="relative h-16 rounded-[18px] border border-[#e9e2d6] bg-[#fffdfc]"
        >
          <div className="absolute left-[14px] top-3 h-10 w-10 rounded-[12px] border border-[#e9e2d6] bg-[#f5f1ea]" />
          <div className="absolute left-[68px] top-[11px] h-[17px] w-[190px] text-[14px] font-medium leading-[17px] text-[#2f2f2f]">
            {item.title}
          </div>
          <div className="absolute left-[68px] top-[35px] h-[14px] w-[190px] text-[12px] font-normal leading-[14px] text-[#b7aea1]">
            {item.description}
          </div>
          <div className="absolute left-[328px] top-4">
            <StatusTag label={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
};
