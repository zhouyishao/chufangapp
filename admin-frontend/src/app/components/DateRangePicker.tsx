import { ConfigProvider, DatePicker } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';

type Props = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
};

const toDayjs = (value: string) => (value ? dayjs(value) : null);

export const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange, className = '' }: Props) => (
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: {
        colorPrimary: '#6f8b62',
        borderRadius: 10,
        colorBorder: '#d9d2c6',
        colorBgContainer: '#fffdfc'
      }
    }}
  >
    <DatePicker.RangePicker
      className={`h-10 w-full rounded-lg border-[#d9d2c6] bg-[#fffdfc] text-sm ${className}`}
      value={startDate || endDate ? [toDayjs(startDate), toDayjs(endDate)] : null}
      format="YYYY年M月D日"
      placeholder={['开始日期', '结束日期']}
      separator="→"
      popupClassName="admin-date-range-picker"
      onChange={(dates) => {
        onStartChange(dates?.[0]?.format('YYYY-MM-DD') ?? '');
        onEndChange(dates?.[1]?.format('YYYY-MM-DD') ?? '');
      }}
    />
  </ConfigProvider>
);
