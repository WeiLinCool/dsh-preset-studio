# @tieveto666-code/dsh-preset-studio

[中文](README.zh.md) | English

> Preset Studio is a `dsh` web plugin — a settings-section visual IDE that projects each agent preset's composition (`agent.cordis.yml`) into an interactive Harness Graph.

[![powered by dsh](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

> Discovery convention: please add the GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin) to this repository. Installation needs no "official certification" — any address works with `dsh plugin add`.

## Why this shape

The official Agent Presets section creates / deletes / makes default, but compositions are read-only text there. This plugin keeps the **same real data** (roster + documents via `remote.agentPresets`, real plugin inventory via `remote.pluginInventory`) and adds spatial reading plus a designer's surface:

- **Same real data** — roster, composition text, and plugin inventory all come off the Host wire. No mocks, no parallel ledger.
- **Harness Graph DSL** — a framework-free domain model (`src/core`) decoupled from the canvas: the canvas is a visualization projection, never the source of truth.
- **Five edge kinds, provable only** — the DSL declares `service / event / context / data / lifecycle`. Phase 1 derives only what the composition file proves: `data` (composition order), `lifecycle` (group ownership), `service` (declarative provides/consumes from the bundled registry). `event` / `context` stay reserved for runtime traces (Phase 2).
- **Schema-driven UI** — the bundled registry carries JSON Schema for well-known rows (persona, tool-web, agent-instructions, …) and the config form is generated: ranged numbers become sliders, booleans switches, enums selects.
- **Composition YAML editor** — live parse → graph + validation; errors/warnings locate the row (`r0.1`). Exporting is saving (the Host deliberately refuses composition writes over the wire).
- **Preset diff** — A/B picker: the official DiffBlock line diff plus a capability-row added/removed summary.
- **Native fit** — registered as an official settings section (Settings → Preset Studio) next to Agent Presets; follows `--dsw-*` theme tokens.

## Feature overview

- Preset explorer: built-in / custom groups, default and unmountable badges, real per-preset row counts.
- Harness Graph canvas (ReactFlow + dagre): draggable nodes, click-to-inspect, hover highlight.
- Node inspector: row id / module / capability kind / enablement (including `!!js` condition source) / config form / raw JSON / remove-row-from-draft.
- Components / Plugins palette: bundled registry grouped by capability plus unregistered installed plugins; click or drag onto the canvas to append a YAML row (row surgery rewrites only the edited row; comments outside it survive).
- Composition YAML: live validation, clipboard copy, download `agent.cordis.yml` / `preset.yml`, one-click "copy as new preset" (the Host's only authoring write).
- Diff view: composition line diff + row-set diff.
- Settings card (Settings → Plugins): `enabled`, `announceToAgent`, `defaultView`.
- Optional host announcement so agents know the plugin is installed.

## Requirements

- Node.js `^22.19 || >=24`
- pnpm
- A working `dsh web` (the official `@deepseek-ai/dsh` SDK)

## Install (from a local clone, for development)

```sh
git clone https://github.com/WeiLinCool/dsh-preset-studio.git
cd dsh-preset-studio
pnpm install
pnpm build
dsh plugin --profile web add link:$(pwd)
```

Restart `dsh web` and refresh the page: the Preset Studio section appears under Settings, with a same-named card on the Plugins settings page.

## Development

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

After upgrading `@xyflow/react`, regenerate the scoped ReactFlow stylesheet:

```sh
pnpm gen:reactflow-css
```

## Known limits

- Composition text never travels back to the Host (that seam is the DSH safety boundary; `copy` is the only write). Drafts take effect by downloading `agent.cordis.yml` into `~/.dsh/.agent-presets/<id>/`, or through "copy as new preset".
- Config forms cover only bundled-registry modules; unregistered plugins can be added and edited in YAML, without a form.
- Row-level edits re-emit only the edited row: comments INSIDE that row are lost; comments and formatting outside it survive.
- The ReactFlow attribution badge stays visible (do not hide it without a Pro license).
- `event` / `context` edges need runtime traces; they are not derived before Phase 2.

## License

[MIT](./LICENSE)
