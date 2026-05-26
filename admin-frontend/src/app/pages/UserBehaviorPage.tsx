import { PagePlaceholder } from '../components/PagePlaceholder';

export const UserBehaviorPage = () => (
  <PagePlaceholder
    title="用户行为"
    description="分析用户访问、搜索、收藏、菜篮子、采购和内容消费路径。"
    modules={['行为路径', '访问趋势', '内容偏好', '转化漏斗']}
    fields={['user_id / event_type / target_type', 'target_id / event_time / metadata']}
  />
);
