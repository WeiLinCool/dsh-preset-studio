# AGENTS.md

This repository enforces a documentation constraint system (see `docs-constraint.yaml`
and `docs/AGENTS.md`). Four mechanical gates keep it honest:

- `verify-doc-budgets` - word-count ceilings for standing documents
- `verify-md-links` - relative links and fragment anchors resolve
- `verify-translation-pairing` - bilingual triplets stay consistent
- `verify-agent-note-format` / `verify-agent-note-classification` - Agent Notes
  follow the uniform format and lifecycle tree

Run all gates with:

```bash
node --experimental-strip-types scripts/run-gates.ts
```

## Facts live in exactly one tier

Each fact has one home; everywhere else, link to that home. See the tier table in
`docs/AGENTS.md`. Do not duplicate a fact across tiers.

## Writing rules

- Document current state, not change history.
- One physical line per paragraph.
- Agent Notes: one file per decision under `.agents/notes/{lifecycle}/{class}/`,
  following the uniform format in `.agents/notes/README.md`.
