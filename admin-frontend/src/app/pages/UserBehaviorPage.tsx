import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, DatePicker, Input, Select, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listUserBehavior, resolveAssetUrl } from '../api';
import { PageHeader } from '../components/PageHeader';
import type { AdminUserBehaviorEvent, AdminUserBehaviorEventType } from '../types';

const { RangePicker } = DatePicker;

const EVENT_META: Record<AdminUserBehaviorEventType, { label: string; color: string }> = {
  VIEW: { label: '浏览内容', color: 'blue' },
  FAVORITE: { label: '收藏内容', color: 'gold' },
  SEARCH: { label: '执行搜索', color: 'purple' },
  BASKET_ADD: { label: '加入菜篮', color: 'green' }
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false });
};

export const UserBehaviorPage = () => {
  const [items, setItems] = useState<AdminUserBehaviorEvent[]>([]);
  const [summary, setSummary] = useState({ views: 0, favorites: 0, searches: 0, basketAdds: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [eventType, setEventType] = useState<AdminUserBehaviorEventType | 'all'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [appliedDateRange, setAppliedDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUserBehavior({
        page,
        pageSize,
        q: keyword,
        eventType,
        startDate: appliedDateRange?.[0].format('YYYY-MM-DD'),
        endDate: appliedDateRange?.[1].format('YYYY-MM-DD')
      });
      setItems(data.list);
      setSummary(data.summary);
      setTotal(data.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '加载用户行为失败');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedDateRange, eventType, keyword, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns = useMemo<ColumnsType<AdminUserBehaviorEvent>>(() => [
    {
      title: '用户',
      width: 230,
      render: (_, item) => (
        <Space>
          <Avatar src={resolveAssetUrl(item.user.avatar) || undefined}>{(item.user.name || '用').slice(0, 1)}</Avatar>
          <div>
            <div className="font-medium text-[#2f2f2f]">{item.user.name || '未命名用户'}</div>
            <div className="text-xs text-[#8c8c8c]">{item.user.phone || item.user.code}</div>
          </div>
        </Space>
      )
    },
    {
      title: '行为',
      dataIndex: 'eventType',
      width: 130,
      render: (value: AdminUserBehaviorEventType) => <Tag color={EVENT_META[value].color}>{EVENT_META[value].label}</Tag>
    },
    {
      title: '对象',
      dataIndex: ['target', 'title'],
      render: (_, item) => (
        <div>
          <div className="font-medium text-[#2f2f2f]">{item.target.title}</div>
          <div className="text-xs text-[#8c8c8c]">{item.target.type} · {item.target.id}</div>
        </div>
      )
    },
    { title: '详情', dataIndex: 'detail', render: (value: string | null) => value || '-' },
    { title: '发生时间', dataIndex: 'eventTime', width: 190, render: formatDateTime }
  ], []);

  const applyFilters = () => {
    setPage(1);
    setKeyword(keywordDraft.trim());
    setAppliedDateRange(dateRange);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="用户行为"
        description="统一查看 C 端真实浏览、收藏、搜索和加入菜篮记录；页面只读，不生成或修改用户数据。"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><Statistic title="浏览内容" value={summary.views} /></Card>
        <Card><Statistic title="收藏内容" value={summary.favorites} /></Card>
        <Card><Statistic title="执行搜索" value={summary.searches} /></Card>
        <Card><Statistic title="加入菜篮" value={summary.basketAdds} /></Card>
      </div>

      <Card className="rounded-3xl border-[#e9e2d6]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Space wrap>
            <Input
              allowClear
              className="w-72"
              placeholder="搜索用户、手机号、内容或关键词"
              prefix={<SearchOutlined />}
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              onPressEnter={applyFilters}
            />
            <Select
              className="w-36"
              value={eventType}
              options={[
                { label: '全部行为', value: 'all' },
                ...Object.entries(EVENT_META).map(([value, meta]) => ({ label: meta.label, value }))
              ]}
              onChange={(value) => { setPage(1); setEventType(value); }}
            />
            <RangePicker value={dateRange} onChange={(value) => setDateRange(value as [Dayjs, Dayjs] | null)} />
            <Button type="primary" onClick={applyFilters}>查询</Button>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>刷新</Button>
        </div>
      </Card>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (value) => `共 ${value} 条行为`,
          onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); }
        }}
      />
    </div>
  );
};
