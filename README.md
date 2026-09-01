# @WeiLinCool/dsh-preset-studio

[中文](README.zh.md) | English

> Preset Studio is a `dsh` web plugin — a full-page visual IDE that projects each agent preset's composition (`agent.cordis.yml`) into an interactive Harness Graph, launched from beside the agent-preset selector on the home hero / active-session header instead of inside the narrow settings dialog.

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
- **Native fit** — no settings-page menu entry: the studio opens from the home launchers (hero row / session header), and the Settings → Plugins card carries enablement; follows `--dsw-*` theme tokens.
- **Full-page studio** — a launcher above the home composer opens the same studio as a full-frame page (via the shell overlay), giving the graph, YAML editor, add-node menu, and inspector the room the settings dialog cannot.

## Feature overview

- Preset explorer: built-in / custom groups, default and unmountable badges, real per-preset row counts.
- Home launcher: a "Preset Studio" button beside the agent-preset selector on the new-session hero, and next to the preset label in an active session's header (opens the full-page studio; Escape or the header button closes it).
- Canvas toolbar: bottom toolbar with capability-kind chips (highlight + fit-to-category) and node search (live match highlight, count, prev/next locate).
- Harness Graph canvas (ReactFlow + dagre): draggable nodes, click-to-inspect, hover highlight; selecting a node highlights its edges with a green particle flow.
- Node inspector: row id / module / capability kind / enablement (including `!!js` condition source) / config form / raw JSON / remove-row-from-draft.
- In-canvas add-related-node menu: right-click a node, or use the ＋ on a selected node, to insert a related component by capability category (group anchors may add inside the group); the menu groups by category and filters by name/module/description plus category chips; a global ＋ button covers the empty canvas. Row surgery rewrites only the inserted row; comments outside it survive.
- Composition YAML: live validation, clipboard copy, download `agent.cordis.yml` / `preset.yml`, one-click "copy as new preset" (the Host's only authoring write).
- Diff view: composition line diff + row-set diff.
- Settings card (Settings → Plugins): `enabled`, `announceToAgent`, `defaultView`.
- Optional host announcement so agents know the plugin is installed.

## Requirements

- Node.js `^22.19 || >=24`
- pnpm
- A working `dsh web` (the official `@deepseek-ai/dsh` SDK)

## Install

### From a local clone (development)

```sh
git clone https://github.com/WeiLinCool/dsh-preset-studio.git
cd dsh-preset-studio
pnpm install
pnpm build
dsh plugin --profile web add link:$(pwd)
```

Restart `dsh web` and refresh the page: the Preset Studio section appears under Settings, with a same-named card on the Plugins settings page.

pnpm ≥10 may block a package's `prepare` script during first install. If `dsh` reports that a build needs approval, write the printed package key into that profile's `pnpm-workspace.yaml` `allowBuilds`, then run `add` again.

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

## Data model

The browser adapter parses the composition text into a recursive `CompositionRow` (`cordis:group` `config` is the child-row list), then projects it into `HarnessNode` / `HarnessEdge` (see `src/core/types.ts` and [Reading the graph](#reading-the-graph)). `!!js` disabled expressions are read back as tagged objects through a custom js-yaml schema, so row-level edits round-trip without losing the expression.

## Reading the graph

| Visual | Meaning |
| --- | --- |
| **Gray dashed (`data`)** | **Composition order**. Adjacent sibling rows always read A before B. Legend: "Order · data". |
| **Purple solid (`lifecycle`)** | **Ownership**. A group row initializes before its members; child rows hang under the parent node. Legend: "Ownership · lifecycle". |
| **Blue solid (`service`)** | **Service dependency**. Drawn only when the bundled registry declares provides/consumes and both sides sit in the same composition (e.g. persona → subagent system-prompt). Legend: "Dependency · service". |
| **Node color** | Capability kind: model / loop / memory / tool / skill / storage / persona / group / other. |
| **Node status dot** | Green=enabled, red=disabled, yellow=conditionally enabled (`!!js`; the raw expression lives in the inspector). |

**How to read the graph:** gray lines only fix order; purple lines are structure; blue lines are declared dependencies (registry knowledge, not runtime proof). Runtime verification is Phase 2 (Runtime Inspector / Trace).

## Known limits

- Composition text never travels back to the Host (that seam is the DSH safety boundary; `copy` is the only write). Drafts take effect by downloading `agent.cordis.yml` into `~/.dsh/.agent-presets/<id>/`, or through "copy as new preset".
- Config forms cover only bundled-registry modules; unregistered plugins can be added and edited in YAML, without a form.
- Row-level edits re-emit only the edited row: comments INSIDE that row are lost; comments and formatting outside it survive.
- The ReactFlow attribution badge stays visible (do not hide it without a Pro license).
- `event` / `context` edges need runtime traces; they are not derived before Phase 2.

## License

[MIT](./LICENSE)
