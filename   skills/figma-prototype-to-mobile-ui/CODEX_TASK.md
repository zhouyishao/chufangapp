# 给 Codex 的执行任务

请把我提供的 `figma-prototype-to-mobile-ui` Skill 安装到当前项目中，并更新项目规则。

## 需要操作

1. 在项目根目录创建目录：

```bash
mkdir -p skills/figma-prototype-to-mobile-ui
```

2. 把压缩包里的文件复制到项目对应位置：

```text
skills/figma-prototype-to-mobile-ui/SKILL.md
```

3. 打开项目根目录的 `AGENTS.md`。

如果项目已有 `AGENTS.md`：
- 不要覆盖原文件。
- 把 `AGENTS_APPEND.md` 里的内容追加到文件末尾。

如果项目没有 `AGENTS.md`：
- 创建一个新的 `AGENTS.md`。
- 把 `AGENTS_APPEND.md` 里的内容写进去。

## 安装后验证

请确认：

1. `skills/figma-prototype-to-mobile-ui/SKILL.md` 是否存在。
2. `AGENTS.md` 是否包含「Figma 原型图与 C 端页面实现规则」。
3. 后续涉及 Figma、原型图、C 端页面、移动端 UI、截图还原、页面重构时，是否会使用 `figma-prototype-to-mobile-ui` Skill。

## 后续使用方式

以后我给你 C 端原型图时，请按下面规则执行：

```text
请使用 figma-prototype-to-mobile-ui Skill，按照我提供的 C 端原型图修改当前页面。不要自由发挥，不要重新设计，以原型图为准。完成后输出页面差异清单、组件清单、接口绑定清单、lint/build 结果。
```

## 重点要求

1. 不要自由发挥重新设计。
2. 不要擅自改变原型图页面结构。
3. 当前代码和原型图不一致时，以原型图为准。
4. 所有页面必须继续接真实接口。
5. 不允许回退到 mock/fake/static 假数据。
6. 页面需要复用公共组件。
7. 完成后必须运行 lint/build 或说明无法运行的原因。
