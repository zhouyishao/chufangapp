# figma-prototype-to-mobile-ui Skill 安装包

这个包用于让 Codex 在「家里有菜 App」项目中按照你的 Figma/截图原型图修改 C 端页面。

## 文件说明

```text
skills/figma-prototype-to-mobile-ui/SKILL.md
```

Codex Skill 主文件。用于约束 Codex：按原型图还原，不自由发挥，接真实接口，不使用假数据。

```text
AGENTS_APPEND.md
```

需要追加到项目根目录 `AGENTS.md` 的项目规则。

```text
CODEX_TASK.md
```

可以直接发给 Codex 的安装指令。

## 安装方式

1. 解压本压缩包。
2. 把 `skills` 文件夹复制到你的项目根目录。
3. 把 `AGENTS_APPEND.md` 的内容追加到项目根目录的 `AGENTS.md`。
4. 如果没有 `AGENTS.md`，就新建一个。
5. 把 `CODEX_TASK.md` 的内容发给 Codex，让它自己检查和安装。

## 后续使用

每次你要让 Codex 按原型图改页面时，直接说：

```text
请使用 figma-prototype-to-mobile-ui Skill，按照我提供的 C 端原型图修改当前页面。不要自由发挥，不要重新设计，以原型图为准。完成后输出页面差异清单、组件清单、接口绑定清单、lint/build 结果。
```
