---
description: "preset 可视化编辑器：把 agent preset 组合投影为 Harness Graph 的 dsh web 插件（首页「预设配置」按钮打开全页工作室，不占用设置页菜单）。"
---

# @WeiLinCool/dsh-preset-studio

[English](README.md) | 中文

[![powered by dsh](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

把 **agent preset 的组合文件（`agent.cordis.yml`）** 变成可交互的 **Harness Graph**：节点不是「步骤」，而是组合里的 **Runtime Capability**；边只画组合文件能证明的关系。这是一个「Agent Runtime 架构编辑器」，而不是又一个 workflow 画布。首页新增「预设配置」按钮，直接从主页打开**全页** Preset Studio（不再占用设置页菜单，也不再挤在设置弹窗里）。

> 发现约定：请为本仓库添加 GitHub Topic [`dsh-plugin`](https://github.com/topics/dsh-plugin)。安装不依赖任何「官方认证」，有地址即可 `dsh plugin add`。

## 为什么是这个形态

官方「Agent 预设」板块负责创建 / 删除 / 选为默认，但组合内容只有一块只读文本。本插件不另起一本账：**同一份真实数据**（`remote.agentPresets` 名单与文档、`remote.pluginInventory` 真实插件清单），补上空间化阅读与设计能力：

- **同源真实数据** — 预设名单、组合文本、插件清单全部来自 Host wire；没有 mock，没有平行账本。
- **Harness Graph DSL** — 独立领域模型（`src/core`，零框架依赖）。画布只是它的可视化投影，领域模型从不属于 React 组件。
- **五种边，只画可证明的** — DSL 定义 `service / event / context / data / lifecycle`（架构文档 §五）。Phase 1 从组合文件能证明的只有三种：`data`（组合顺序）、`lifecycle`（group 归属）、`service`（内置注册表的声明式 provides/consumes）；`event` / `context` 留给运行期 trace（Phase 2），不画臆造箭头。
- **Schema-driven UI** — 内置注册表为常见行（persona、tool-web、agent-instructions…）携带 JSON Schema，配置表单自动生成：数值区间变滑块、布尔变开关、枚举变下拉。
- **组合 YAML 编辑器** — 实时解析 → 图谱与校验联动；错误/警告带行号（r0.1 定位）。导出即保存（Host 刻意拒绝组合文本写回，这是安全边界）。
- **预设差异对比** — A/B 双选：官方 DiffBlock 行级差异 + 能力行增删摘要（架构文档 §九）。
- **不占用设置菜单** — 设置页不再注册「Preset Studio」板块，工作室完全从首页入口打开；设置 → 插件配置仍有启用开关，外观跟随 `--dsw-*` 主题。
- **全页模式** — 首页「预设配置」按钮（空对话时在预设选择旁边、有对话时在顶部预设标签旁）把同一套工作室打开为整页（经 `shell.overlay`），图谱、YAML 编辑器、组件面板与检查器拥有设置弹窗给不出的空间。

## 能力一览

- **预设浏览器**：内置 / 自定义分组，默认 / 不可挂载徽标，每预设真实组合行数（来自 pluginInventory）。
- **首页入口**：空对话时按钮出现在工作区预设选择旁边；有对话时出现在顶部标题区预设标签旁边，点击一键打开全页工作室；Esc 或右上角按钮关闭。
- **画布工具栏**：底部工具栏提供能力分类芯片（高亮并定位到该类别节点）与节点搜索（实时高亮匹配、计数、前后跳转定位）。
- **Harness Graph 画布**（ReactFlow + dagre）：拖拽节点、点击查看详情、悬停高亮。
- **节点检查器**：row id / 模块 / 能力类别 / 启用状态（含 `!!js` 条件表达式原文）/ 配置表单 / 原始 JSON / 从草稿删除该行。
- **组件 / 插件面板**：内置注册表按能力分组 + 真实 pluginInventory 中未收录的插件；点击或拖拽到画布即向草稿追加一行 YAML（Row surgery：只重写被编辑的行，行外注释与格式保留）。
- **组合 YAML**：实时校验（解析错误、缺 name、重复 id、未收录模块、空 group…）、复制文本、下载 `agent.cordis.yml` / `preset.yml`、一键「复制为新预设」（Host 唯一允许的写操作）。
- **差异视图**：A/B 预设组合行级差异 + 能力行增删清单。
- **设置卡**（设置 → 插件配置）：`enabled`、`announceToAgent`、`defaultView`。
- **可选 host 公告**：让 agent 知道本机已安装该插件（与 dsh-trace-graph 同一机制）。

## 环境要求

- Node.js `^22.19 || >=24`
- pnpm
- 已可用的 `dsh web`（官方 `@deepseek-ai/dsh` SDK）

## 安装

### 从本地仓库安装（开发）

```sh
git clone https://github.com/WeiLinCool/dsh-preset-studio.git
cd dsh-preset-studio
pnpm install
pnpm build
dsh plugin --profile web add link:$(pwd)
```

重启 `dsh web` 并刷新页面，设置页出现「Preset Studio」板块；配置页「插件」里出现同名设置卡。

pnpm ≥10 可能在首次安装时拦截包的 `prepare` 脚本。若 `dsh` 提示需要允许构建，把打印的包键写入该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds`，再执行一次 `add`。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

升级 `@xyflow/react` 后，重新生成带作用域的 ReactFlow 样式表：

```sh
pnpm gen:reactflow-css
```

## 数据模型

浏览器 adapter 把组合文本解析为递归 `CompositionRow`（`cordis:group` 的 `config` 是子行列表），再投影为 `HarnessNode` / `HarnessEdge`（见 `src/core/types.ts` 与 [图怎么读](#图怎么读)）。`!!js` disabled 表达式通过自定义 js-yaml schema 读回为标记对象，行级编辑往返不丢表达式。

## 图怎么读

| 视觉 | 含义 |
| --- | --- |
| **灰色虚线（`data`）** | **组合顺序**。相邻兄弟行之间必有：先 A 后 B。图例：「顺序 · data」。 |
| **紫色实线（`lifecycle`）** | **归属**。group 行初始化先于其成员，子行挂在父节点下方。图例：「归属 · lifecycle」。 |
| **蓝色实线（`service`）** | **服务依赖**。仅当内置注册表声明了 provides/consumes 且两边同处一份组合时出现（如 persona → subagent 的 system-prompt）。图例：「依赖 · service」。 |
| **节点颜色** | 能力类别：model / loop / memory / tool / skill / storage / persona / group / other。 |
| **节点状态点** | 绿=启用、红=禁用、黄=条件启用（`!!js`，原文在检查器里）。 |

**读图提示：** 灰线只确定先后；紫线是结构；蓝线是声明式依赖（注册表知识，非运行期证明）。运行期验证属于 Phase 2（Runtime Inspector / Trace）。

## 已知限制

- 组合文本**不回写 Host**：DSH 的安全边界就是「组合文本不过 wire」（`copy` 是唯一写操作）。草稿通过下载 `agent.cordis.yml` 落到 `~/.dsh/.agent-presets/<id>/` 生效，或用「复制为新预设」走官方 seam。
- 配置表单只覆盖内置注册表收录的模块；未收录的插件可添加、可在 YAML 视图编辑，但无表单。
- 行级编辑（表单写入 / 删行）只重写被编辑行的 YAML，**该行内部的注释会丢失**；行外注释与格式保留。
- ReactFlow 右下角署名标记保持显示（未购买 Pro 授权时不应隐藏）。
- `event` / `context` 边需要运行期 trace，Phase 2 之前不推导。

## 许可证

[MIT](./LICENSE)
