# `packages/`

One file per R package: `<pkg>.json`, named after the R package it indexes (e.g. `shiny.json`
for the `shiny` package). Each file lists every known Type Definition for that package and must
validate against [`../schema/package.schema.json`](../schema/package.schema.json) — see
[`../schema/package.example.json`](../schema/package.example.json) for a worked (non-real)
example.

This directory is empty until the first Type Definition is indexed — see `typR/registry.md` §13
J3/J5 in the `TypR` workspace (compiler repo: `we-data-ch/typr`).

Adding an entry is a pull request against this repo: add or edit `packages/<pkg>.json`, pin a
real commit `rev` in the target Definition Repository, and make sure `capabilities` matches what
that repository actually contains (`registry.md` §5.5, §9).
