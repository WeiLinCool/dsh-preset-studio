/**
 * Preset Studio surface copy: the section and the settings card.
 */

/** Every locale key this plugin owns (union of the dictionary keys). */
export type PresetStudioKey = keyof typeof zh

/** Interface-shaped documentation of every key the dictionaries carry. */
export interface PresetStudioKeyShape {  // ── settings card ────────────────────────────────────────────────────────
  'settings.title': string
  'settings.description': string
  'settings.enabled': string
  'settings.enabledHint': string
  'settings.announceToAgent': string
  'settings.announceToAgentHint': string
  'settings.defaultView': string
  'settings.defaultViewHint': string
  'settings.choice.viewGraph': string
  'settings.choice.viewYaml': string
  'settings.choice.viewDiff': string
  'settings.inherit': string
  'settings.on': string
  'settings.off': string
  'settings.overridden': string
  'settings.reset': string
  'settings.notExposed': string
  'settings.readOnly': string
  'settings.expand': string
  'settings.collapse': string
  'settings.save': string
  'settings.saving': string
  'settings.discard': string
  'settings.unsaved': string
  'settings.saveFailed': string
  'settings.invalidNumber': string
  // ── section ──────────────────────────────────────────────────────────────
  'nav': string
  'intro': string
  'home.button': string
  'page.title': string
  'loading': string
  'error': string
  'retry': string
  'unavailable.title': string
  'unavailable.body': string
  'preset.selector': string
  'trust.system': string
  'trust.user': string
  'badge.default': string
  'badge.broken': string
  // ── view tabs ────────────────────────────────────────────────────────────
  'view.graph': string
  'view.yaml': string
  'view.diff': string
  // ── explorer / palette ───────────────────────────────────────────────────
  'explorer.title': string
  'explorer.rows': string
  'explorer.copy': string
  'explorer.delete': string
  'explorer.deleteConfirm': string
  'explorer.deleteBody': string
  'explorer.deleting': string
  'explorer.openFiles': string
  'palette.title': string
  'palette.hint': string
  'palette.group': string
  'palette.registry': string
  'palette.installed': string
  'palette.installedHint': string
  'palette.addGroup': string
  // ── graph ────────────────────────────────────────────────────────────────
  'graph.title': string
  'graph.legend.sequence': string
  'graph.legend.membership': string
  'graph.legend.service': string
  'graph.empty': string
  'graph.searchPlaceholder': string
  'graph.toolbar': string
  'graph.clear': string
  'graph.unknown': string
  // ── inspector ────────────────────────────────────────────────────────────
  'inspector.title': string
  'inspector.empty': string
  'inspector.rowId': string
  'inspector.module': string
  'inspector.kind': string
  'inspector.kind.model': string
  'inspector.kind.loop': string
  'inspector.kind.memory': string
  'inspector.kind.tool': string
  'inspector.kind.skill': string
  'inspector.kind.storage': string
  'inspector.kind.persona': string
  'inspector.kind.group': string
  'inspector.kind.other': string
  'inspector.enabled': string
  'inspector.conditional': string
  'inspector.disabled': string
  'inspector.config': string
  'inspector.raw': string
  'inspector.json': string
  'inspector.yaml': string
  'inspector.close': string
  'inspector.noSchema': string
  'inspector.readonly': string
  'inspector.formNote': string
  // ── composer ─────────────────────────────────────────────────────────────
  'composer.title': string
  'composer.readonly': string
  'composer.dirty': string
  'composer.reset': string
  'composer.download': string
  'composer.downloadMeta': string
  'composer.copyText': string
  'composer.copied': string
  'composer.copyAsNew': string
  'composer.exportPath': string
  'composer.exportPathHint': string
  'composer.metadataFile': string
  'composer.metadataEmpty': string
  'validation.title': string
  'validation.clean': string
  'validation.errorCount': string
  'validation.warningCount': string
  // ── diff ─────────────────────────────────────────────────────────────────
  'diff.title': string
  'diff.pickLeft': string
  'diff.pickRight': string
  'diff.rowsAdded': string
  'diff.rowsRemoved': string
  'diff.rowsUnchanged': string
  'diff.samePreset': string
  'diff.empty': string
  'diff.labels.copy': string
  'diff.labels.copied': string
  'diff.labels.collapse': string
  'diff.labels.expand': string
  'diff.labels.files': string
  'diff.labels.collapseAria': string
  // ── copy dialog ──────────────────────────────────────────────────────────
  'copy.title': string
  'copy.intro': string
  'copy.id': string
  'copy.idPlaceholder': string
  'copy.name': string
  'copy.namePlaceholder': string
  'copy.idRequired': string
  'copy.idInvalid': string
  'copy.idTaken': string
  'copy.cancel': string
  'copy.create': string
  'copy.creating': string
  'copy.created': string
  // ── misc ─────────────────────────────────────────────────────────────────
  'notice.deleted': string
  'notice.copyPath': string
  'close': string
}

export const zh: PresetStudioKeyShape = {
  'settings.title': 'Preset Studio（预设编辑器）',
  'settings.description': '预设可视化编辑器的启用状态与初始视图。',
  'settings.enabled': '启用 Preset Studio',
  'settings.enabledHint': '关闭后会隐藏设置页里的 Preset Studio 板块。',
  'settings.announceToAgent': '向 agent 公告本插件',
  'settings.announceToAgentHint': '开启：每个 agent 的系统提示词包含本插件的说明。关闭：不公告，只有你提到时 agent 才知道。',
  'settings.defaultView': '初始视图',
  'settings.defaultViewHint': '打开 Preset Studio 时首先显示的视图。',
  'settings.choice.viewGraph': 'Harness Graph 图谱',
  'settings.choice.viewYaml': '组合 YAML 编辑器',
  'settings.choice.viewDiff': '预设差异对比',
  'settings.inherit': '继承',
  'settings.on': '开',
  'settings.off': '关',
  'settings.overridden': '已覆盖',
  'settings.reset': '恢复默认',
  'settings.notExposed': '当前 DSH 版本未向配置页开放本插件的设置命名空间，表单不可用。可直接编辑 ~/.dsh/settings.yaml，或将命名空间加入 dsh-host-apiproxy 的 WEB_SETTINGS_NAMESPACES 白名单后重启。',
  'settings.readOnly': '此部署的设置存储为只读。',
  'settings.expand': '展开设置',
  'settings.collapse': '收起设置',
  'settings.save': '保存',
  'settings.saving': '保存中…',
  'settings.discard': '放弃',
  'settings.unsaved': '未保存',
  'settings.saveFailed': '部署未接受这些值，已保留待你修正。',
  'settings.invalidNumber': '请输入数字，或留空使用默认值。',
  'nav': 'Preset Studio',
  'intro': '把每个 agent preset 的组合文件（agent.cordis.yml）投影为 Harness Graph：节点是组合里的 Runtime Capability，边只画组合文件能证明的关系。官方「Agent 预设」板块负责创建与删除，这里负责看懂与设计组合。',
  'home.button': '预设配置',
  'page.title': 'Preset Studio · 预设配置',
  'loading': '加载中…',
  'error': '加载失败',
  'retry': '重试',
  'unavailable.title': '本部署未配置 agent preset',
  'unavailable.body': '该部署没有组合任何 preset 名单（agentPresets 服务未挂载或名单为空）。',
  'preset.selector': '选择预设',
  'trust.system': '内置',
  'trust.user': '自定义',
  'badge.default': '默认',
  'badge.broken': '不可挂载',
  'view.graph': 'Harness Graph',
  'view.yaml': '组合 YAML',
  'view.diff': '差异',
  'explorer.title': '预设浏览器',
  'explorer.rows': '组合行',
  'explorer.copy': '复制为新预设',
  'explorer.delete': '删除',
  'explorer.deleteConfirm': '删除预设',
  'explorer.deleteBody': '该预设的目录会被删除；正在运行该组合的会话不受影响。',
  'explorer.deleting': '删除中…',
  'explorer.openFiles': '在桌面打开文件',
  'palette.title': '组件 / 插件面板',
  'palette.hint': '点击或拖拽到画布，向组合草稿追加一行。内置注册表提供常见行的 JSON Schema 配置表单；安装清单来自真实 pluginInventory。',
  'palette.group': '组合容器',
  'palette.registry': '内置注册表（带 Schema）',
  'palette.installed': '已安装插件（pluginInventory）',
  'palette.installedHint': '不在注册表中的插件没有配置表单，仍可添加并在 YAML 视图编辑。',
  'palette.addGroup': '添加 Group',
  'graph.title': 'Harness Graph',
  'graph.legend.sequence': '顺序 data',
  'graph.legend.membership': '归属 lifecycle',
  'graph.legend.service': '服务依赖 service',
  'graph.empty': '组合为空或无法解析：请在「组合 YAML」视图修正后再回到图谱。',
  'graph.searchPlaceholder': '搜索节点 / 模块 / row id',
  'graph.toolbar': '画布工具栏',
  'graph.clear': '清除筛选',
  'graph.unknown': '未知行',
  'inspector.title': '节点检查器',
  'inspector.empty': '点击图谱节点查看该行的详情与配置表单。',
  'inspector.rowId': 'Row id',
  'inspector.module': '模块',
  'inspector.kind': '能力类别',
  'inspector.kind.model': 'Model 模型',
  'inspector.kind.loop': 'Agent Loop 循环',
  'inspector.kind.memory': 'Memory 记忆',
  'inspector.kind.tool': 'Tool 工具',
  'inspector.kind.skill': 'Skill 技能',
  'inspector.kind.storage': 'Storage 存储',
  'inspector.kind.persona': 'Persona 人设',
  'inspector.kind.group': 'Group 组合容器',
  'inspector.kind.other': 'Other 其他',
  'inspector.enabled': '启用',
  'inspector.conditional': '条件启用（!!js）',
  'inspector.disabled': '禁用',
  'inspector.config': '配置',
  'inspector.raw': '原始数据',
  'inspector.json': 'JSON',
  'inspector.yaml': 'YAML',
  'inspector.close': '关闭',
  'inspector.noSchema': '该模块不在内置注册表中：没有配置表单，请直接在「组合 YAML」视图编辑。',
  'inspector.readonly': '内置预设只读：请「复制为新预设」后在副本上编辑。',
  'inspector.formNote': '表单生成自内置注册表的 JSON Schema（架构文档 §七 Schema-driven UI）。',
  'composer.title': '组合 YAML',
  'composer.readonly': '内置预设由部署交付，组合内容只读。要改它，先「复制为新预设」，再编辑副本；或导出后放到自定义预设目录。',
  'composer.dirty': '未保存的草稿（Host 不接收组合文本写回，导出即保存）',
  'composer.reset': '还原为已存版本',
  'composer.download': '下载 agent.cordis.yml',
  'composer.downloadMeta': '下载 preset.yml',
  'composer.copyText': '复制文本',
  'composer.copied': '已复制',
  'composer.copyAsNew': '复制为新预设',
  'composer.exportPath': '导出位置',
  'composer.exportPathHint': '用户自定义预设的目录：~/.dsh/.agent-presets/<preset-id>/agent.cordis.yml（preset.yml 放同目录）。',
  'composer.metadataFile': 'preset.yml（显示元数据）',
  'composer.metadataEmpty': '该预设没有发布显示元数据。',
  'validation.title': '组合校验',
  'validation.clean': '组合有效：没有发现结构问题。',
  'validation.errorCount': '错误',
  'validation.warningCount': '警告',
  'diff.title': '预设差异',
  'diff.pickLeft': '基准（A）',
  'diff.pickRight': '对比（B）',
  'diff.rowsAdded': '新增能力行',
  'diff.rowsRemoved': '移除能力行',
  'diff.rowsUnchanged': '未变能力行',
  'diff.samePreset': '同一个预设：没有差异。',
  'diff.empty': '选择两侧预设后显示组合差异。',
  'diff.labels.copy': '复制',
  'diff.labels.copied': '已复制',
  'diff.labels.collapse': '收起',
  'diff.labels.expand': '展开 {count} 行',
  'diff.labels.files': '{count} 个文件',
  'diff.labels.collapseAria': '收起差异块',
  'copy.title': '复制为自定义预设',
  'copy.intro': 'Host 端唯一允许的组合写操作是「按 id 复制」：新预设继承源预设的目录（组合 + 元数据），之后在其文件上编辑。',
  'copy.id': '新预设 id（目录名）',
  'copy.idPlaceholder': 'my-agent',
  'copy.name': '显示名称（可选）',
  'copy.namePlaceholder': 'My Agent',
  'copy.idRequired': '请输入预设 id。',
  'copy.idInvalid': 'id 只能由小写字母、数字、连字符组成，且以字母或数字开头。',
  'copy.idTaken': '该 id 已被占用（内置预设名也会遮蔽同名目录）。',
  'copy.cancel': '取消',
  'copy.create': '创建',
  'copy.creating': '创建中…',
  'copy.created': '已复制，正在打开新预设…',
  'notice.deleted': '预设已删除。',
  'notice.copyPath': '预设文件位置：{path}',
  'close': '关闭',
}

export const en: Record<PresetStudioKey, string> = {
  'settings.title': 'Preset Studio',
  'settings.description': 'Preset studio enablement and the view it opens on.',
  'settings.enabled': 'Enable Preset Studio',
  'settings.enabledHint': 'When off, the Preset Studio settings section is hidden.',
  'settings.announceToAgent': 'Announce the preset studio to agents',
  'settings.announceToAgentHint': 'When on, every agent\'s system prompt carries a note about this plugin. When off, agents only learn about it when you mention it.',
  'settings.defaultView': 'Initial view',
  'settings.defaultViewHint': 'The view Preset Studio opens on.',
  'settings.choice.viewGraph': 'Harness Graph',
  'settings.choice.viewYaml': 'Composition YAML editor',
  'settings.choice.viewDiff': 'Preset diff',
  'settings.inherit': 'Inherit',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.overridden': 'Overridden',
  'settings.reset': 'Reset',
  'settings.notExposed': 'This DSH version does not expose the plugin\'s settings namespace to the configuration page. Edit ~/.dsh/settings.yaml directly, or add the namespace to dsh-host-apiproxy\'s WEB_SETTINGS_NAMESPACES allowlist and restart.',
  'settings.readOnly': 'The settings store of this deployment is read-only.',
  'settings.expand': 'Expand settings',
  'settings.collapse': 'Collapse settings',
  'settings.save': 'Save',
  'settings.saving': 'Saving…',
  'settings.discard': 'Discard',
  'settings.unsaved': 'Unsaved',
  'settings.saveFailed': 'The deployment did not accept these values; your edits are kept for correction.',
  'settings.invalidNumber': 'Enter a number, or leave empty to inherit the default.',
  'nav': 'Preset Studio',
  'intro': 'Projects each agent preset\'s composition (agent.cordis.yml) into a Harness Graph: nodes are Runtime Capabilities, edges only what the composition file proves. The official Agent Presets section creates and deletes presets; this studio exists to read and design compositions.',
  'home.button': 'Preset Studio',
  'page.title': 'Preset Studio',
  'loading': 'Loading…',
  'error': 'Load failed',
  'retry': 'Retry',
  'unavailable.title': 'This deployment composes no agent presets',
  'unavailable.body': 'No preset roster is composed here (agentPresets service absent, or the roster is empty).',
  'preset.selector': 'Choose preset',
  'trust.system': 'built-in',
  'trust.user': 'custom',
  'badge.default': 'default',
  'badge.broken': 'unmountable',
  'view.graph': 'Harness Graph',
  'view.yaml': 'Composition YAML',
  'view.diff': 'Diff',
  'explorer.title': 'Preset Explorer',
  'explorer.rows': 'rows',
  'explorer.copy': 'Copy as new preset',
  'explorer.delete': 'Delete',
  'explorer.deleteConfirm': 'Delete preset',
  'explorer.deleteBody': 'The preset directory is removed; sessions already running it are unaffected.',
  'explorer.deleting': 'Deleting…',
  'explorer.openFiles': 'Open files on desktop',
  'palette.title': 'Components / Plugins',
  'palette.hint': 'Click or drag onto the canvas to append a row to the working draft. The bundled registry ships JSON Schema config forms for well-known rows; the installed list comes from the real pluginInventory.',
  'palette.group': 'Composition group',
  'palette.registry': 'Bundled registry (with schema)',
  'palette.installed': 'Installed plugins (pluginInventory)',
  'palette.installedHint': 'Plugins outside the registry have no config form; they can still be added and edited in the YAML view.',
  'palette.addGroup': 'Add group',
  'graph.title': 'Harness Graph',
  'graph.legend.sequence': 'order · data',
  'graph.legend.membership': 'ownership · lifecycle',
  'graph.legend.service': 'dependency · service',
  'graph.empty': 'The composition is empty or unparseable: fix it in the Composition YAML view, then return to the graph.',
  'graph.searchPlaceholder': 'Search nodes / modules / row id',
  'graph.toolbar': 'Canvas toolbar',
  'graph.clear': 'Clear filters',
  'graph.unknown': 'Unknown row',
  'inspector.title': 'Inspector',
  'inspector.empty': 'Click a graph node to inspect its row and config form.',
  'inspector.rowId': 'Row id',
  'inspector.module': 'Module',
  'inspector.kind': 'Capability',
  'inspector.kind.model': 'Model',
  'inspector.kind.loop': 'Agent Loop',
  'inspector.kind.memory': 'Memory',
  'inspector.kind.tool': 'Tool',
  'inspector.kind.skill': 'Skill',
  'inspector.kind.storage': 'Storage',
  'inspector.kind.persona': 'Persona',
  'inspector.kind.group': 'Group',
  'inspector.kind.other': 'Other',
  'inspector.enabled': 'Enabled',
  'inspector.conditional': 'Conditional (!!js)',
  'inspector.disabled': 'Disabled',
  'inspector.config': 'Config',
  'inspector.raw': 'Raw',
  'inspector.json': 'JSON',
  'inspector.yaml': 'YAML',
  'inspector.close': 'Close',
  'inspector.noSchema': 'This module is not in the bundled registry: no config form. Edit it directly in the Composition YAML view.',
  'inspector.readonly': 'Built-in presets are read-only: copy the preset first, then edit the copy.',
  'inspector.formNote': 'This form is generated from the bundled registry\'s JSON Schema (spec §7 Schema-driven UI).',
  'composer.title': 'Composition YAML',
  'composer.readonly': 'Built-in presets ship with the deployment and their composition is read-only here. Copy the preset, edit the copy; or export and place the file in your custom preset directory.',
  'composer.dirty': 'Unsaved draft (the Host refuses composition writes; exporting is saving)',
  'composer.reset': 'Restore stored version',
  'composer.download': 'Download agent.cordis.yml',
  'composer.downloadMeta': 'Download preset.yml',
  'composer.copyText': 'Copy text',
  'composer.copied': 'Copied',
  'composer.copyAsNew': 'Copy as new preset',
  'composer.exportPath': 'Export location',
  'composer.exportPathHint': 'A custom preset lives at ~/.dsh/.agent-presets/<preset-id>/agent.cordis.yml (preset.yml beside it).',
  'composer.metadataFile': 'preset.yml (display metadata)',
  'composer.metadataEmpty': 'This preset publishes no display metadata.',
  'validation.title': 'Composition validation',
  'validation.clean': 'The composition is valid: no structural problems found.',
  'validation.errorCount': 'errors',
  'validation.warningCount': 'warnings',
  'diff.title': 'Preset diff',
  'diff.pickLeft': 'Base (A)',
  'diff.pickRight': 'Compare (B)',
  'diff.rowsAdded': 'Rows added',
  'diff.rowsRemoved': 'Rows removed',
  'diff.rowsUnchanged': 'Rows unchanged',
  'diff.samePreset': 'Same preset: no difference.',
  'diff.empty': 'Pick both sides to see the composition difference.',
  'diff.labels.copy': 'Copy',
  'diff.labels.copied': 'Copied',
  'diff.labels.collapse': 'Collapse',
  'diff.labels.expand': 'Expand {count} lines',
  'diff.labels.files': '{count} files',
  'diff.labels.collapseAria': 'Collapse diff block',
  'copy.title': 'Copy as custom preset',
  'copy.intro': 'The only composition write the Host accepts is copy-by-id: the new preset inherits the source directory (composition + metadata) and you edit its files afterwards.',
  'copy.id': 'New preset id (directory name)',
  'copy.idPlaceholder': 'my-agent',
  'copy.name': 'Display name (optional)',
  'copy.namePlaceholder': 'My Agent',
  'copy.idRequired': 'Enter a preset id.',
  'copy.idInvalid': 'Ids use lowercase letters, digits and hyphens, starting with a letter or digit.',
  'copy.idTaken': 'That id is taken (a built-in preset would shadow the same directory).',
  'copy.cancel': 'Cancel',
  'copy.create': 'Create',
  'copy.creating': 'Creating…',
  'copy.created': 'Copied; opening the new preset…',
  'notice.deleted': 'Preset deleted.',
  'notice.copyPath': 'Preset files live at: {path}',
  'close': 'Close',
}

/** Keys the settings card chrome may use (the card's `t` accepts every key). */
export type SettingsCardKey = PresetStudioKey
