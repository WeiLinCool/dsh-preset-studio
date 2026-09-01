# AGENTS.md — The documentation standard

This file defines the document structure, tier taxonomy, and writing rules for
the dsh-preset-studio repository. The mechanical gates in `docs-constraint.yaml`
enforce the structure; this file states the intent behind them.

## The tier taxonomy: one home per fact

Each tier has one job. A fact belongs to exactly one tier; everywhere else, link
there instead of restating it.

| Tier | Where | Job |
|------|-------|-----|
| Root AGENTS.md | `AGENTS.md` | Standing orders for agents (budgeted) |
| Doc standard | `docs/AGENTS.md` | This file: taxonomy and writing rules (budgeted) |
| Subsystems | `docs/**/*.md` | Type definitions and semantics (unbudgeted) |
| Package readme | `README.md` | Per-package contract; bilingual triplet with `README.zh.md` (budgeted) |
| Agent notes | `.agents/notes/{lifecycle}/{class}/` | Decision rationale (unbudgeted) |

## Bilingual pairing

`README.md` (English) and `README.zh.md` (Chinese) form one triplet with
`README.i18n.yaml`, which records the git blob hashes of both files. The pair
must keep identical structure: heading levels, code blocks, tables, and list
shapes. Add a fact to the English source first, then translate.

## Agent Notes

Decisions and proposals live under `.agents/notes/{lifecycle}/{class}/`, one
file per decision. Lifecycles are `proposed/`, `implemented/`, `rejected/`, and
the frozen `archived/`. Every note follows the uniform header and skeleton
enforced by `verify-agent-note-format` and the classification tree enforced by
`verify-agent-note-classification`.

## Writing rules

- **Document current state, not change history.**
- **One physical line per paragraph.**
- **Comments state complete contracts, not reasoning transcripts.**
- **State the why near the decision** that needs it; link elsewhere.
- **Do not restate a fact that already has a home in its tier.**