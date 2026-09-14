# TypR Registry

A community index of [TypR](https://github.com/we-data-ch/typr) Type Definitions for R packages.
This repository **indexes** definitions; it does not host or own them — they stay with their
authors, in priority on GitHub (`typR/registry.md` §1, §3 in the `TypR` design-notes workspace).

## Layout

```text
schema/
├── package.schema.json     # JSON Schema every packages/<pkg>.json entry must satisfy
└── package.example.json    # a worked, non-real example — validates against the schema above
packages/
└── <pkg>.json               # one file per R package, e.g. shiny.json, dplyr.json
definitions/
└── <pkg>/                  # long-tail monorepo: definitions with no external repo of their own
ecosystem/
└── cran.json                # generated: full CRAN package index (name/version/title/downloads)
```

- **`schema/`** — the contract every `packages/*.json` file must satisfy. Validate with any
  JSON Schema draft-07 validator, e.g.:
  ```bash
  python3 -c "
  import json, jsonschema
  jsonschema.validate(
      json.load(open('schema/package.example.json')),
      json.load(open('schema/package.schema.json')),
  )
  print('OK')
  "
  ```
- **`packages/`** — see [`packages/README.md`](packages/README.md).
- **`definitions/`** — see [`definitions/README.md`](definitions/README.md).
- **`ecosystem/`** — see [`ecosystem/README.md`](ecosystem/README.md). The full CRAN package
  index, independent of what this registry has annotations for — lets the store answer "does
  package X have TypR types yet?" for *any* CRAN package, not just the ones already indexed.
- **`store/`** — a static, read-only search/browse page over `packages/*.json` and
  `ecosystem/cran.json`, no account or backend. See [`store/README.md`](store/README.md).

## Adding a definition

1. Publish a Type Definition repository (or a `definitions/<pkg>/` directory here for the long
   tail) following the format in `typR/registry.md` §5 / `typr/rfcs/0031-external-type-definitions.md`.
2. Open a PR against this repo adding or updating `packages/<pkg>.json`, validated against
   `schema/package.schema.json` — either by hand, or with `typr types submit <pkg>
   [github:owner/repo[@rev]]` (needs `gh`, already run through `gh auth login`): it validates the
   definition, forks this repo, writes the entry, and opens the PR for you.
3. `rev` must be a real, pinned commit SHA — never a branch or tag (reproducibility by digest,
   `registry.md` §7.2, D4).
4. `capabilities` must match what the target repository actually contains — a mismatch (e.g.
   undeclared R) is rejected at fetch time by `typr types add` (`registry.md` §5.5).

## Revalidation

[`.github/workflows/revalidate.yml`](.github/workflows/revalidate.yml) runs `typr types
revalidate` (`we-data-ch/typr`, `crates/typr-cli/src/registry_revalidate.rs`) against every entry
in `packages/*.json` on a weekly schedule (and on manual dispatch), and commits the result to
[`status/validation.json`](status/validation.json) — `typR/registry.md` §13 J4, "revalidation
périodique des définitions déjà indexées (détection de dérive)". The job fails only when a
definition that was fine last run just broke; a long-standing, already-known failure doesn't keep
it red forever. See §9 of `registry.md` for what each check does and does not verify.

## Status

This repo currently covers `typR/registry.md` §13 **J3** ("Registre minimal", directory layout,
schema, registry-backed resolution in `typr add`/`typr types update`, `typr search <pkg>`), **J4**
in full ("CI de validation": `typr types validate`'s mechanical checks, the periodic revalidation
job above, and nominative per-check reporting — no badge, ever), and **J5** ("amorçage de la
couverture"): `packages/` indexes 31 definitions under `definitions/` — the 30 most-downloaded
CRAN packages (per `cranlogs.r-pkg.org`, minus a handful of header-only/build-scaffolding
packages with no real R-level API), generated at `T3` by `typr gen-types` and verified end-to-end
with `typr types validate` against this repo's own commits — plus `jsonlite`, `purrr`, and `R6`
carrying a small hand-verified `T1` core (real functions, real types, actually executed against R
via `typr run`, not just type-checked). It also covers **J6** *(optional)* in full: a static
[`store/`](store/) page (search, package sheets, provenance, tier, capability flags), generated
from `packages/*.json` and, when available, `status/validation.json` — no account, no backend —
plus `typr types submit <pkg> [repo]` (`we-data-ch/typr`,
`crates/typr-cli/src/registry_submit.rs`), a CLI-scoped stand-in for "Add to Registry via
automated PR". It shells out to the submitter's own, already-authenticated `gh`: fork this repo,
add/update the one `packages/<pkg>.json` entry (validated with `typr types validate` first, never
a no-op PR), push, open the PR — as them, from their own fork, no GitHub App or backend involved.

The store also covers the discovery idea in `typR/registry2.md` §14.1/§15.1/§19.1: a "Browse
CRAN" tab lists the full CRAN package index (`ecosystem/cran.json`,
[`scripts/fetch-cran-index.mjs`](scripts/fetch-cran-index.mjs), refreshed weekly by
[`.github/workflows/ecosystem.yml`](.github/workflows/ecosystem.yml)), each entry flagged
annotated/untyped against `packages/*.json`, with a "most wanted" ranking of high-download,
still-untyped packages linking straight to the contribution instructions above — so a developer
picking an R package, or a contributor picking what to type next, doesn't have to leave this
site to check CRAN first. Not yet done:

- `store/` is not yet published (GitHub Pages is not enabled on this repo).
- The web-form version of "Add to Registry" that `registry.md` §12/D6 originally scoped (a GitHub
  App, stored tokens, a backend, anti-spam moderation) remains unbuilt and may never be — `typr
  types submit` covers the same end goal for anyone with `gh` installed, at a fraction of the
  cost.

Full design and rationale: `typR/registry.md` (in the `TypR` workspace, alongside the compiler,
playground and docs-site repos).
