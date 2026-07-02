import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '../components/PageHeader';
import { resolveAssetUrl } from '../api';
import type { AdminUserActivityItem, PageResult } from '../types';

type Fetcher = (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  targetType?: AdminUserActivityItem['targetType'] | 'all';
}) => Promise<PageResult<AdminUserActivityItem>>;

type Props = {
  title: string;
  description: string;
  eventLabel: string;
  emptyText: string;
  fetcher: Fetcher;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const UserActivityListPage = ({ title, description, eventLabel, emptyText, fetcher }: Props) => {
  const [items, setItems] = useState<AdminUserActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [targetType, setTargetType] = useState<AdminUserActivityItem['targetType'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher({ page, pageSize, q: keyword, targetType });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetcher, keyword, page, pageSize, targetType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns = useMemo<ColumnsType<AdminUserActivityItem>>(
    () => [
      {
        title: '用户',
        dataIndex: 'userName',
        width: 240,
        render: (_, item) => (
          <Space>
            <Avatar src={resolveAssetUrl(item.avatar) || undefined}>
              {(item.userName || item.phone || '用').slice(0, 1)}
            </Avatar>
            <div className="text-left">
              <div className="font-medium text-[#2f2f2f]">{item.userName || '未命名用户'}</div>
              <div className="text-xs text-[#8c8c8c]">{item.phone || item.userCode}</div>
            </div>
          </Space>
        )
      },
      {
        title: '内容',
        dataIndex: 'targetTitle',
        render: (_, item) => (
          <Space>
            <Avatar shape="square" size={48} src={resolveAssetUrl(item.targetCover) || undefined}>
              {item.targetTitle.slice(0, 1)}
            </Avatar>
            <div className="text-left">
              <div className="font-medium text-[#2f2f2f]">{item.targetTitle}</div>
              <div className="text-xs text-[#8c8c8c]">ID：{item.targetId ?? '-'}</div>
            </div>
          </Space>
        )
      },
      {
        title: '类型',
        dataIndex: 'targetType',
        width: 120,
        render: (value: AdminUserActivityItem['targetType']) => (
          <Tag color={value === 'RECIPE' ? 'green' : 'gold'}>{value === 'RECIPE' ? '菜谱' : '食材'}</Tag>
        )
      },
      {
        title: '内容状态',
        width: 140,
        render: (_, item) => (
          <Space>
            <Tag color={item.targetStatus === 'ACTIVE' ? 'success' : 'default'}>
              {item.targetStatus === 'ACTIVE' ? '启用' : '停用'}
            </Tag>
            <Tag color={item.isPublish ? 'blue' : 'default'}>{item.isPublish ? '已发布' : '未发布'}</Tag>
          </Space>
        )
      },
      {
        title: eventLabel,
        dataIndex: 'updatedAt',
        width: 180,
        render: (value: string) => <span className="text-[#6f6a61]">{formatDateTime(value)}</span>
      }
    ],
    [eventLabel]
  );

  const handleSearch = () => {
    setPage(1);
    setKeyword(keywordDraft.trim());
  };

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />

      <Card className="rounded-3xl border-[#e9e2d6]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Space wrap>
            <Input
              allowClear
              className="w-72"
              placeholder="搜索用户、手机号、内容名称"
              prefix={<SearchOutlined />}
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              onPressEnter={handleSearch}
            />
            <Select
              className="w-36"
              value={targetType}
              options={[
                { label: '全部类型', value: 'all' },
                { label: '菜谱', value: 'RECIPE' },
                { label: '食材', value: 'INGREDIENT' }
              ]}
              onChange={(value) => {
                setPage(1);
                setTargetType(value);
              }}
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
            刷新
          </Button>
        </div>
      </Card>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        locale={{ emptyText }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => `共 ${count} 条`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }
        }}
      />
    </div>
  );
};
