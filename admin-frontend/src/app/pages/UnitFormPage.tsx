import { PagePlaceholder } from '../components/PagePlaceholder';

type Props = { mode: 'create' | 'edit' };

export const UnitFormPage = ({ mode }: Props) => (
  <PagePlaceholder
    title={mode === 'edit' ? '编辑单位' : '新增单位'}
    description="单位保存接口尚未实现，本页面暂不提供表单，也不会向本地或后端提交任何数据。"
    modules={['单位表单（待接入）', '发布状态（待接入）']}
    fields={['name / code / type', 'base_unit / ratio / status']}
  />
);
