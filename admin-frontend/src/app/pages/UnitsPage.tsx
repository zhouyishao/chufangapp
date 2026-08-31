import { PagePlaceholder } from '../components/PagePlaceholder';

export const UnitsPage = () => (
  <PagePlaceholder
    title="单位管理"
    description="单位主数据尚未接入真实后端。为避免产生无法保存的配置，列表、换算编辑和状态操作暂不开放。"
    modules={['单位列表（待接入）', '换算关系（待接入）', '适用对象（待接入）']}
    fields={['name / code / type', 'base_unit / ratio / status']}
  />
);
