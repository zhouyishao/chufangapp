import { PagePlaceholder } from '../components/PagePlaceholder';

export const UnitDetailPage = () => (
  <PagePlaceholder
    title="单位详情"
    description="单位详情尚未接入真实后端，已移除本地固定记录及伪编辑、伪启禁用、伪删除操作。"
    modules={['基础信息（待接入）', '换算关系（待接入）']}
    fields={['unit_id / name / code', 'base_unit / ratio / status']}
  />
);
