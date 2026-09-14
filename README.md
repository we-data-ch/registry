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

## Adding a definition

1. Publish a Type Definition repository (or a `definitions/<pkg>/` directory here for the long
   tail) following the format in `typR/registry.md` §5 / `typr/rfcs/0031-external-type-definitions.md`.
2. Open a PR against this repo adding or updating `packages/<pkg>.json`, validated against
   `schema/package.schema.json`.
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
schema, registry-backed resolution in `typr add`/`typr types update`, `typr search <pkg>`) and
the first two items of **J4** ("CI de validation": `typr types validate`'s mechanical checks, and
the periodic revalidation job above). Not yet done, tracked in the same section:

- nominative display of what has been verified beyond the raw `status/validation.json` (a Store,
  or a rendered page, is J6 — optional)
- **J5** — bootstrapping actual coverage: `packages/` is still empty, so today every revalidation
  run reports "nothing to revalidate" (see the badge-free philosophy in `registry.md` §9/§16: an
  empty registry is not a failure, just nothing indexed yet)

Full design and rationale: `typR/registry.md` (in the `TypR` workspace, alongside the compiler,
playground and docs-site repos).
