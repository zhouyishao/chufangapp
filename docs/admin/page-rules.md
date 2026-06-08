# 后台页面规则

## 技术栈

- React + TypeScript。
- Ant Design Pro / Ant Design。
- 表格使用 Ant Design Table 或 ProComponents。
- 表单使用 Ant Design Form 或 ProComponents。
- 弹窗使用 Ant Design Modal。
- 分页使用 Ant Design Pagination。

## 页面能力

- 列表页默认支持搜索、筛选、分页。
- 新增、编辑、删除、上下架、排序等按钮必须有真实交互。
- 删除必须二次确认。
- 表单必须有校验。
- 接口失败必须有错误提示。

## 后台到 C 端联动

后台新增或修改以下内容后，必须验证 C 端同步展示：

- 顶部导航。
- 首页模块。
- Banner。
- 推荐位。
- 菜谱。
- 食材、水果、调料、酒水。
- 分类、标签、单位。
- 菜篮子相关数据。

详细验收归档见：`docs/admin-cms-to-capp-test-checklist.md`。
