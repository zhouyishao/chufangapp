import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  HolderOutlined,
  MobileOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Skeleton, Switch, Tag, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PermissionGate } from '../components/PermissionGate';

import {
  listContentModules,
  listHeroBanners,
  listHomeTopNavs,
  reorderContentModules,
  resolveAssetUrl,
  updateContentModule,
  updateContentModuleStatus,
  updateHeroBannerStatus,
  updateHomeTopNavStatus,
  type BannerStatus,
  type ContentModule,
  type ContentModulePayload,
  type ContentModuleStatus,
  type HeroBanner,
  type HomeTopNav
} from '../api';
import {
  type ComposerChannelKey
} from '../home-module-catalog';

type Selection =
  | { kind: 'channel' }
  | { kind: 'banner'; id: number }
  | { kind: 'module'; id: number };

type ComposerChannel = HomeTopNav & {
  composerKey: ComposerChannelKey;
  composerLabel: string;
  sourceLabel: string;
};

type ChannelDefinition = {
  key: ComposerChannelKey;
  label: string;
  source: 'home_top' | 'category_top';
  contentType?: string;
  keywords: string[];
};

const lockedChannelDefinitions: ChannelDefinition[] = [
  { key: 'recommend', label: '推荐', source: 'home_top', keywords: ['recommend', '推荐', '精选'] },
  { key: 'recipe', label: '菜谱', source: 'category_top', contentType: 'recipe', keywords: ['recipe', '菜谱'] },
  { key: 'ingredient', label: '食材', source: 'category_top', contentType: 'ingredient', keywords: ['ingredient', '食材'] },
  { key: 'fruit', label: '水果', source: 'category_top', contentType: 'fruit', keywords: ['fruit', '水果'] },
  { key: 'beverage', label: '饮品', source: 'category_top', contentType: 'beverage', keywords: ['beverage', 'drink', '饮品', '酒水'] }
];

const matchesChannel = (channel: HomeTopNav, definition: ChannelDefinition) => {
  if (definition.contentType && channel.contentType?.toLowerCase() === definition.contentType) return true;
  const searchable = [channel.code, channel.name, channel.alias, channel.contentType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return definition.keywords.some((keyword) => searchable.includes(keyword.toLowerCase()));
};

const buildComposerChannels = (homeChannels: HomeTopNav[], categoryChannels: HomeTopNav[]) => {
  const missing: string[] = [];
  const channels = lockedChannelDefinitions.flatMap((definition) => {
    const source = definition.source === 'home_top' ? homeChannels : categoryChannels;
    const channel = definition.key === 'recommend'
      ? source.find((item) => item.isDefault) ?? source.find((item) => matchesChannel(item, definition))
      : source.find((item) => matchesChannel(item, definition));
    if (!channel) {
      missing.push(definition.label);
      return [];
    }
    return [{
      ...channel,
      composerKey: definition.key,
      composerLabel: definition.label,
      sourceLabel: channel.name
    } satisfies ComposerChannel];
  });
  return { channels, missing };
};

const getCAppPreviewUrl = () => import.meta.env.VITE_C_APP_PREVIEW_URL
  || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:5175/#/` : '');

const withPreviewChannel = (baseUrl: string, channelId?: string | null) => {
  if (!baseUrl || !channelId) return baseUrl;
  const [origin, hash = '/'] = baseUrl.split('#');
  const separator = hash.includes('?') ? '&' : '?';
  return `${origin}#${hash}${separator}previewNav=${encodeURIComponent(channelId)}`;
};

const moduleStyleLabels: Record<ContentModule['displayStyle'], string> = {
  HORIZONTAL_RECIPE_CARD: '菜谱方图横滑',
  SEASONAL_INGREDIENT_CARD: '时令方图横滑',
  IMAGE_TEXT_LIST: '横向图文指南',
  TWO_COLUMN_RECIPE_GRID: '双列内容卡',
  LARGE_IMAGE_CAROUSEL: '大图内容轮播',
  FOUR_CARD_GRID: '紧凑四宫格'
};

const contentTypeLabels: Record<ContentModule['contentType'], string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '饮品'
};

const contentSourceLabels: Record<ContentModule['contentSource'], string> = {
  MANUAL: '手动选择',
  CATEGORY: '旧分类规则',
  CATEGORY_CONTENT: '按分类内容',
  CATEGORY_GROUP: '按分类组',
  TAG: '按标签'
};

const channelStatus = {
  online: { label: '已发布', color: 'success' },
  draft: { label: '草稿', color: 'warning' },
  offline: { label: '已停用', color: 'default' }
} as const;

const moduleStatus = {
  ENABLED: { label: '展示中', color: 'success' },
  DISABLED: { label: '已隐藏', color: 'default' }
} as const;

const toModulePayload = (item: ContentModule, sortOrder = item.sortOrder): ContentModulePayload => ({
  moduleKey: item.moduleKey,
  title: item.title,
  subtitle: item.subtitle,
  displayStyle: item.displayStyle,
  contentType: item.contentType,
  contentSource: item.contentSource,
  displayCount: item.displayCount,
  showMore: item.showMore,
  showTitle: item.showTitle,
  moreLink: item.moreLink,
  sortOrder,
  status: item.status,
  items: item.items,
  categoryId: item.categoryId,
  sourceCategoryId: item.sourceCategoryId,
  tagId: item.tagId
});

const getValidationIssues = (banners: HeroBanner[], modules: ContentModule[]) => {
  const issues: string[] = [];
  const enabledBanners = banners.filter((item) => item.status === 'ENABLED');
  const enabledModules = modules.filter((item) => item.status === 'ENABLED');

  if (enabledBanners.length === 0) issues.push('当前频道没有启用的 Banner。');
  if (enabledModules.length === 0) issues.push('当前频道没有启用的内容模块。');
  enabledBanners.forEach((item) => {
    if (!item.cover) issues.push(`Banner「${item.title}」缺少图片。`);
    if (!item.title.trim()) issues.push('存在未填写标题的 Banner。');
  });
  enabledModules.forEach((item) => {
    if (!item.title.trim()) issues.push('存在未填写标题的内容模块。');
    if (item.contentSource === 'MANUAL' && item.items.length === 0) {
      issues.push(`模块「${item.title}」尚未选择内容。`);
    }
    if (['CATEGORY', 'CATEGORY_CONTENT', 'CATEGORY_GROUP'].includes(item.contentSource) && !item.sourceCategoryId) {
      issues.push(`模块「${item.title}」尚未选择内容来源分类。`);
    }
    if (item.items.length > 0 && item.items.length < Math.min(item.displayCount, 2)) {
      issues.push(`模块「${item.title}」内容数量不足。`);
    }
  });
  return issues;
};

const formatLoadError = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  if (error.message.toLowerCase().includes('unauthorized')) {
    return '登录状态已失效，请重新登录后台后刷新页面。';
  }
  return error.message || fallback;
};

export const HomeComposerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [channels, setChannels] = useState<ComposerChannel[]>([]);
  const [missingChannelLabels, setMissingChannelLabels] = useState<string[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: 'channel' });
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);

  const selectedChannel = useMemo(
    () => channels.find((item) => item.id === selectedChannelId) ?? null,
    [channels, selectedChannelId]
  );
  const selectedBanner = selection.kind === 'banner'
    ? banners.find((item) => item.id === selection.id) ?? null
    : null;
  const selectedModule = selection.kind === 'module'
    ? modules.find((item) => item.id === selection.id) ?? null
    : null;
  const cAppPreviewUrl = useMemo(() => getCAppPreviewUrl(), []);
  const selectedChannelPreviewUrl = useMemo(
    () => withPreviewChannel(cAppPreviewUrl, selectedChannel?.id),
    [cAppPreviewUrl, selectedChannel?.id]
  );
  const validationIssues = useMemo(() => getValidationIssues(banners, modules), [banners, modules]);
  const publishIssues = useMemo(
    () => orderDirty ? ['模块顺序尚未保存。', ...validationIssues] : validationIssues,
    [orderDirty, validationIssues]
  );

  const loadChannels = useCallback(async () => {
    setLoadingChannels(true);
    setError(null);
    try {
      const [homeResult, categoryResult] = await Promise.all([
        listHomeTopNavs({ page: 1, pageSize: 100, displayPosition: 'home_top' }),
        listHomeTopNavs({ page: 1, pageSize: 100, displayPosition: 'category_top' })
      ]);
      const mapped = buildComposerChannels(homeResult.list, categoryResult.list);
      setChannels(mapped.channels);
      setMissingChannelLabels(mapped.missing);
      setSelectedChannelId((current) => {
        if (current && mapped.channels.some((item) => item.id === current)) return current;
        const requestedNavId = searchParams.get('nav');
        if (requestedNavId && mapped.channels.some((item) => item.id === requestedNavId)) return requestedNavId;
        return mapped.channels[0]?.id ?? null;
      });
    } catch (loadError) {
      setChannels([]);
      setMissingChannelLabels(lockedChannelDefinitions.map((item) => item.label));
      setError(formatLoadError(loadError, '首页频道加载失败'));
    } finally {
      setLoadingChannels(false);
    }
  }, [searchParams]);

  const loadChannelContent = useCallback(async (channel: HomeTopNav) => {
    setLoadingContent(true);
    setError(null);
    const bannerNavId = channel.legacyId ? String(channel.legacyId) : channel.id;
    const [bannerResult, moduleResult] = await Promise.allSettled([
      listHeroBanners(bannerNavId, { page: 1, pageSize: 50 }),
      listContentModules(channel.id, { page: 1, pageSize: 50 })
    ]);

    if (bannerResult.status === 'fulfilled') {
      setBanners([...bannerResult.value.list].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      setBanners([]);
      if (!(bannerResult.reason instanceof Error && bannerResult.reason.message.includes('404'))) {
        setError(bannerResult.reason instanceof Error ? bannerResult.reason.message : 'Banner 加载失败');
      }
    }

    if (moduleResult.status === 'fulfilled') {
      setModules([...moduleResult.value.list].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      setModules([]);
      if (!(moduleResult.reason instanceof Error && moduleResult.reason.message.includes('404'))) {
        setError(moduleResult.reason instanceof Error ? moduleResult.reason.message : '内容模块加载失败');
      }
    }
    setOrderDirty(false);
    setLoadingContent(false);
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!selectedChannel) {
      setBanners([]);
      setModules([]);
      return;
    }
    setSelection({ kind: 'channel' });
    void loadChannelContent(selectedChannel);
  }, [loadChannelContent, selectedChannel]);

  const moveModule = (item: ContentModule, direction: -1 | 1) => {
    const index = modules.findIndex((moduleItem) => moduleItem.id === item.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= modules.length) return;
    const next = [...modules];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setModules(next.map((moduleItem, sortIndex) => ({ ...moduleItem, sortOrder: sortIndex + 1 })));
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    if (!selectedChannel || !orderDirty) {
      setNotice('当前编排没有未保存的排序变更');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const reorderedModules = await reorderContentModules(
        selectedChannel.id,
        modules.map((item, index) => ({ id: item.id, sortOrder: index + 1 }))
      );
      setModules(reorderedModules);
      setOrderDirty(false);
      setNotice('模块顺序已保存');
      setPreviewRevision((current) => current + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存排序失败');
    } finally {
      setSaving(false);
    }
  };

  const publishChannel = async () => {
    if (!selectedChannel || publishIssues.length > 0) {
      setValidationOpen(true);
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      await updateHomeTopNavStatus(selectedChannel.id, 'online');
      setNotice(`「${selectedChannel.composerLabel}」已发布到 C 端`);
      await loadChannels();
      setPreviewRevision((current) => current + 1);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const toggleModule = async (item: ContentModule, checked: boolean) => {
    if (!selectedChannel) return;
    const nextStatus: ContentModuleStatus = checked ? 'ENABLED' : 'DISABLED';
    try {
      await updateContentModuleStatus(selectedChannel.id, item.id, nextStatus);
      setModules((current) => current.map((moduleItem) => (
        moduleItem.id === item.id ? { ...moduleItem, status: nextStatus } : moduleItem
      )));
      setNotice(checked ? `「${item.title}」已显示` : `「${item.title}」已隐藏`);
      setPreviewRevision((current) => current + 1);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : '模块状态更新失败');
    }
  };

  const toggleBanner = async (item: HeroBanner, checked: boolean) => {
    if (!selectedChannel) return;
    const bannerNavId = selectedChannel.legacyId ? String(selectedChannel.legacyId) : selectedChannel.id;
    const nextStatus: BannerStatus = checked ? 'ENABLED' : 'DISABLED';
    try {
      await updateHeroBannerStatus(bannerNavId, item.id, nextStatus);
      setBanners((current) => current.map((banner) => (
        banner.id === item.id ? { ...banner, status: nextStatus } : banner
      )));
      setNotice(checked ? `「${item.title}」已启用` : `「${item.title}」已停用`);
      setPreviewRevision((current) => current + 1);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Banner 状态更新失败');
    }
  };

  const openCAppPreview = () => {
    const previewUrl = getCAppPreviewUrl();
    if (!previewUrl) {
      setNotice('未配置 C 端预览地址，请设置 VITE_C_APP_PREVIEW_URL 后再试');
      return;
    }
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const renderInspector = () => {
    if (!selectedChannel) return <Empty description="请先选择一个首页频道" />;

    if (selectedBanner) {
      const bannerStatusItem = selectedBanner.status === 'ENABLED'
        ? { label: '展示中', color: 'success' }
        : selectedBanner.status === 'DRAFT'
          ? { label: '草稿', color: 'warning' }
          : { label: '已停用', color: 'default' };
      return (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-[#2f2f2f]">Banner 设置</h2>
              <Tag color={bannerStatusItem.color}>{bannerStatusItem.label}</Tag>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#6f726b]">只显示当前频道可用的 Banner 配置。</p>
          </div>
          <div className="overflow-hidden rounded-[12px] bg-[#f1f0ec]">
            {selectedBanner.cover ? (
              <img className="aspect-[16/9] w-full object-cover" src={resolveAssetUrl(selectedBanner.cover)} alt={selectedBanner.title} />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center text-[#9a9c95]"><PictureOutlined className="text-2xl" /></div>
            )}
          </div>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-[#85877f]">标题</dt><dd className="mt-1 font-medium text-[#2f2f2f]">{selectedBanner.title || '未填写'}</dd></div>
            <div><dt className="text-[#85877f]">副标题</dt><dd className="mt-1 text-[#4f514c]">{selectedBanner.subtitle || '未填写'}</dd></div>
            <div><dt className="text-[#85877f]">生效时间</dt><dd className="mt-1 text-[#4f514c]">{selectedBanner.startAt || selectedBanner.endAt ? `${selectedBanner.startAt ?? '立即'} — ${selectedBanner.endAt ?? '长期'}` : '长期有效'}</dd></div>
          </dl>
          <div className="flex items-center justify-between border-t border-[#e6e5e0] pt-4">
            <span className="text-sm text-[#4f514c]">在 C 端显示</span>
            <Switch checked={selectedBanner.status === 'ENABLED'} onChange={(checked) => void toggleBanner(selectedBanner, checked)} />
          </div>
          <Button
            block
            icon={<EditOutlined />}
            onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/content/carousels/${selectedBanner.id}/edit`)}
          >
            编辑 Banner
          </Button>
        </div>
      );
    }

    if (selectedModule) {
      return (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-[#2f2f2f]">模块设置</h2>
              <Tag color={moduleStatus[selectedModule.status].color}>{moduleStatus[selectedModule.status].label}</Tag>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#6f726b]">模块可自由配置内容类型、来源、展示样式与顺序，C 端按当前设置直接渲染。</p>
          </div>
          <dl className="divide-y divide-[#e6e5e0] text-sm">
            {[
              ['模块标题', selectedModule.title],
              ['推荐模板', selectedModule.moduleKey ?? '未套用'],
              ['展示模板', moduleStyleLabels[selectedModule.displayStyle]],
              ['内容类型', contentTypeLabels[selectedModule.contentType]],
              ['内容来源', contentSourceLabels[selectedModule.contentSource]],
              ['展示数量', `${selectedModule.displayCount} 项`],
              ['已选内容', `${selectedModule.items.length} 项`]
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-3">
                <dt className="text-[#85877f]">{label}</dt>
                <dd className="text-right font-medium text-[#343531]">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between border-t border-[#e6e5e0] pt-4">
            <span className="text-sm text-[#4f514c]">在 C 端显示</span>
            <Switch checked={selectedModule.status === 'ENABLED'} onChange={(checked) => void toggleModule(selectedModule, checked)} />
          </div>
          <Button
            block
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/content/modules/${selectedModule.id}/edit`)}
          >
            编辑内容与规则
          </Button>
        </div>
      );
    }

    const status = channelStatus[selectedChannel.status];
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-[#2f2f2f]">频道设置</h2>
            <Tag color={status.color}>{status.label}</Tag>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#6f726b]">频道控制顶部导航、Banner 和下方模块的完整组合。</p>
        </div>
        <dl className="divide-y divide-[#e6e5e0] text-sm">
          {[
            ['页面频道', selectedChannel.composerLabel],
            ['数据源名称', selectedChannel.sourceLabel],
            ['数据源位置', selectedChannel.displayPositionLabel ?? selectedChannel.displayPosition],
            ['频道类型', selectedChannel.navTypeText ?? selectedChannel.navType],
            ['关联内容', selectedChannel.relationName ?? '未设置'],
            ['模块数量', `${modules.length} 个`],
            ['Banner 数量', `${banners.length} 张`]
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[#85877f]">{label}</dt>
              <dd className="text-right font-medium text-[#343531]">{value}</dd>
            </div>
          ))}
        </dl>
        <Button block icon={<SettingOutlined />} onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/edit`)}>
          编辑频道基础信息
        </Button>
        <Button block onClick={() => navigate('/home-ops/navigation')}>管理全部频道</Button>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-[1720px] space-y-4">
      <header className="flex flex-col gap-4 rounded-[14px] bg-[#fffdfc] px-5 py-4 shadow-[0_2px_8px_rgba(47,47,47,0.045)] xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#2f2f2f]">C 端首页编排</h1>
            {selectedChannel ? <Tag color={channelStatus[selectedChannel.status].color}>{channelStatus[selectedChannel.status].label}</Tag> : null}
            {orderDirty ? <Tag color="warning">有未保存排序</Tag> : null}
          </div>
          <p className="mt-1 text-sm text-[#6f726b]">配置固定五频道的数据源、Banner 与模块，中间区域直接显示真实 C 端页面。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => void loadChannels()}>刷新</Button>
          <Button icon={<EyeOutlined />} onClick={openCAppPreview}>打开 C 端</Button>
          <PermissionGate permission="home:configuration:update"><Button icon={<SaveOutlined />} loading={saving} disabled={!selectedChannel} onClick={() => void saveOrder()}>保存编排</Button></PermissionGate>
          <PermissionGate permission="home:configuration:status"><Button type="primary" loading={publishing} disabled={!selectedChannel} onClick={() => void publishChannel()}>发布当前频道</Button></PermissionGate>
        </div>
      </header>

      {notice ? <Alert closable type="success" message={notice} onClose={() => setNotice(null)} /> : null}
      {error ? <Alert closable type="error" message={error} onClose={() => setError(null)} /> : null}
      {missingChannelLabels.length > 0 ? (
        <Alert
          showIcon
          type="warning"
          message={`缺少频道数据源：${missingChannelLabels.join('、')}`}
          description="C 端顶部固定为推荐、菜谱、食材、水果、饮品。请在频道数据源中补齐对应 contentType，测试频道不会进入首页顶部。"
          action={<Button size="small" onClick={() => navigate('/home-ops/navigation')}>管理数据源</Button>}
        />
      ) : null}

      <div className="grid min-h-[720px] gap-4 xl:grid-cols-[270px_minmax(430px,1fr)_340px]">
        <aside className="overflow-hidden rounded-[14px] bg-[#fffdfc] shadow-[0_2px_8px_rgba(47,47,47,0.045)]">
          <div className="flex items-center justify-between border-b border-[#e6e5e0] px-4 py-3.5">
            <div>
              <h2 className="text-[15px] font-semibold text-[#2f2f2f]">首页频道</h2>
              <p className="mt-0.5 text-xs text-[#85877f]">正式 C 端展示排序前 5 个；完整频道池在数据源中维护</p>
            </div>
            <Tooltip title="管理频道数据源">
              <Button type="text" shape="circle" icon={<SettingOutlined />} onClick={() => navigate('/home-ops/navigation')} />
            </Tooltip>
          </div>

          <div className="border-b border-[#e6e5e0] p-2.5">
            {loadingChannels ? <Skeleton active paragraph={{ rows: 4 }} title={false} /> : channels.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未映射到 C 端频道">
                <Button size="small" type="primary" onClick={() => navigate('/home-ops/navigation')}>配置数据源</Button>
              </Empty>
            ) : (
              <div className="space-y-1">
                {channels.map((channel) => {
                  const active = channel.id === selectedChannelId;
                  return (
                    <div key={channel.composerKey} className={['flex items-center gap-2 rounded-[10px] px-3 py-1.5', active ? 'bg-[#edf1ea]' : 'hover:bg-[#f5f4f1]'].join(' ')}>
                      <AppstoreOutlined className={active ? 'text-[#718368]' : 'text-[#a2a49d]'} />
                      <button
                        type="button"
                        className="min-w-0 flex-1 py-1.5 text-left"
                        onClick={() => setSelectedChannelId(channel.id)}
                      >
                        <span className={['block truncate text-sm font-medium', active ? 'text-[#607257]' : 'text-[#3f403c]'].join(' ')}>{channel.composerLabel}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#92948d]">数据源：{channel.sourceLabel} · {channelStatus[channel.status].label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedChannel ? (
            <div className="p-2.5">
              <button
                type="button"
                onClick={() => setSelection({ kind: 'channel' })}
                className={['mb-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left', selection.kind === 'channel' ? 'bg-[#edf1ea]' : 'hover:bg-[#f5f4f1]'].join(' ')}
              >
                <AppstoreOutlined className="text-[#788872]" />
                <span className="flex-1 text-sm font-medium text-[#3f403c]">{selectedChannel.composerLabel}频道</span>
              </button>

              <div className="mt-2 flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-[#85877f]">Banner</span>
                <Button type="text" size="small" icon={<PlusOutlined />} aria-label="新增 Banner" onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/content/carousels/new`)} />
              </div>
              {banners.length === 0 ? <p className="px-3 py-2 text-xs text-[#a0a29b]">暂无 Banner</p> : banners.map((banner) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setSelection({ kind: 'banner', id: banner.id })}
                  className={['flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left', selection.kind === 'banner' && selection.id === banner.id ? 'bg-[#edf1ea]' : 'hover:bg-[#f5f4f1]'].join(' ')}
                >
                  <PictureOutlined className="text-[#93958e]" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#4b4c47]">{banner.title || '未命名 Banner'}</span>
                  <span className={['h-1.5 w-1.5 rounded-full', banner.status === 'ENABLED' ? 'bg-[#718368]' : 'bg-[#c8c9c4]'].join(' ')} />
                </button>
              ))}

              <div className="mt-3 flex items-center justify-between px-3 py-1.5">
                <span>
                  <span className="block text-xs font-medium text-[#85877f]">内容模块</span>
                  <span className="mt-0.5 block text-[10px] text-[#a0a29b]">自由新增、排序和配置内容来源</span>
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/content/modules/new`)}
                >新增</Button>
              </div>
              {modules.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate(`/home-ops/top-nav/${selectedChannel.id}/content/modules/new`)}
                  className="flex w-full items-center gap-2.5 rounded-[10px] border border-dashed border-[#d9ddd4] px-3 py-3 text-left hover:bg-[#f5f4f1]"
                >
                  <PlusOutlined className="text-[#9a9d95]" />
                  <span className="text-sm text-[#666963]">添加第一个内容模块</span>
                </button>
              ) : (
                <div className="space-y-1">
                  {modules.map((item, index) => {
                    const active = selection.kind === 'module' && selection.id === item.id;
                    return (
                      <div key={item.id} className={['group flex items-center gap-1 rounded-[10px] pr-1', active ? 'bg-[#edf1ea]' : 'hover:bg-[#f5f4f1]'].join(' ')}>
                        <button
                          type="button"
                          onClick={() => setSelection({ kind: 'module', id: item.id })}
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
                        >
                          <HolderOutlined className="text-[#a2a49d]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-[#4b4c47]">{item.title || `模块 ${item.id}`}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-[#92948d]">{contentTypeLabels[item.contentType]} · {moduleStyleLabels[item.displayStyle]} · {contentSourceLabels[item.contentSource]}</span>
                          </span>
                          <span className={['h-1.5 w-1.5 rounded-full', item.status === 'ENABLED' ? 'bg-[#718368]' : 'bg-[#c8c9c4]'].join(' ')} />
                        </button>
                        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <Button type="text" size="small" disabled={index === 0} icon={<ArrowUpOutlined />} aria-label={`上移${item.title}`} onClick={() => moveModule(item, -1)} />
                          <Button type="text" size="small" disabled={index === modules.length - 1} icon={<ArrowDownOutlined />} aria-label={`下移${item.title}`} onClick={() => moveModule(item, 1)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </aside>

        <main className="relative flex min-h-[720px] flex-col overflow-hidden rounded-[14px] bg-[#ecece9] shadow-[0_2px_8px_rgba(47,47,47,0.035)]">
          <div className="flex items-center justify-between border-b border-[#dcded8] bg-[#f7f7f5] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#555752]"><MobileOutlined /><span>真实 C 端 · 393px</span></div>
            <div className="flex items-center gap-2 text-xs text-[#777a73]">
              {!selectedChannel
                ? '等待选择频道'
                : publishIssues.length === 0
                  ? <><CheckCircleOutlined className="text-[#718368]" />发布检查通过</>
                  : <><WarningOutlined className="text-[#c27b48]" />{publishIssues.length} 项待处理</>}
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                aria-label="刷新真实 C 端预览"
                onClick={() => setPreviewRevision((current) => current + 1)}
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center overflow-auto px-5 py-6">
            {cAppPreviewUrl ? (
              <>
                <div className="mb-3 flex w-[393px] max-w-full items-center justify-between text-xs text-[#777a73]">
                  <span>预览中的频道可直接点击切换</span>
                  {loadingContent ? <span>配置读取中…</span> : <span>配置与正式 C 端同源</span>}
                </div>
                <iframe
                  key={`${selectedChannel?.id ?? 'none'}-${previewRevision}`}
                  title="家里有菜 C 端首页真实预览"
                  src={selectedChannelPreviewUrl}
                  className="h-[780px] w-[393px] max-w-full shrink-0 rounded-[16px] border-0 bg-[#f5f1ea] shadow-[0_6px_18px_rgba(47,47,47,0.1)]"
                />
              </>
            ) : (
              <Empty className="my-auto" description="请配置 VITE_C_APP_PREVIEW_URL 后查看真实 C 端" />
            )}
          </div>
        </main>

        <aside className="overflow-hidden rounded-[14px] bg-[#fffdfc] shadow-[0_2px_8px_rgba(47,47,47,0.045)]">
          <div className="flex items-center justify-between border-b border-[#e6e5e0] px-5 py-3.5">
            <div>
              <h2 className="text-[15px] font-semibold text-[#2f2f2f]">属性</h2>
              <p className="mt-0.5 text-xs text-[#85877f]">配置当前选中项</p>
            </div>
            <Tooltip title="发布前检查">
              <Button type="text" shape="circle" disabled={!selectedChannel} icon={publishIssues.length ? <WarningOutlined /> : <CheckCircleOutlined />} onClick={() => setValidationOpen(true)} />
            </Tooltip>
          </div>
          <div className="p-5">{renderInspector()}</div>
        </aside>
      </div>

      <Modal
        title="发布前检查"
        open={validationOpen}
        onCancel={() => setValidationOpen(false)}
        footer={<Button type="primary" onClick={() => setValidationOpen(false)}>返回继续配置</Button>}
      >
        {publishIssues.length === 0 ? (
          <Alert type="success" showIcon message="当前频道已通过检查，可以发布。" />
        ) : (
          <div className="space-y-3">
            <Alert type="warning" showIcon message={`发现 ${publishIssues.length} 项问题，处理后再发布。`} />
            <ul className="space-y-2 pl-5 text-sm text-[#4f514c]">
              {publishIssues.map((issue) => <li key={issue} className="list-disc">{issue}</li>)}
            </ul>
          </div>
        )}
      </Modal>
    </section>
  );
};
