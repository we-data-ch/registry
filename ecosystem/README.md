# `ecosystem/`

`cran.json` and `r-universe.json` are **generated**, not hand-edited — produced by
[`../scripts/fetch-cran-index.mjs`](../scripts/fetch-cran-index.mjs) and
[`../scripts/fetch-runiverse-index.mjs`](../scripts/fetch-runiverse-index.mjs) from CRAN's and
R-universe's own public, unauthenticated endpoints (see each script's header comment for exactly
which ones). Together they're the full name/version/title index of every package on CRAN, plus
every package on [R-universe](https://r-universe.dev) — including the ones that never made it to
CRAN at all — the discovery layer behind the store's "Browse packages" tab
(`typR/registry2.md` §14.1 "Browsing the full R ecosystem", §15.1 "Package indexing").

This is deliberately independent of `packages/*.json` and the resolution/validation machinery
`registry.md` describes: it does not affect `typr add`, does not require a Type Definition to
exist, and does not mirror any package's actual contents — only name/version/title metadata (plus,
for R-universe, which universe hosts it and its GitHub star count). `../scripts/gen-store-data.mjs`
joins both against `packages/*.json` to compute, per package, whether this registry already has an
annotation for it, and whether the package is on CRAN, R-universe, or both — that joined result is
`store/data/ecosystem.json`, what `store/index.html` actually reads.

## Why two files

- `cran.json` is authoritative for what's actually on CRAN (version, install.packages()-ability).
- `r-universe.json` comes from R-universe's own global search API, which already deduplicates one
  canonical universe per package name (usually the package's own dev universe, e.g. `tidyverse`
  for `dplyr`, falling back to the automatic `cran` mirror universe for packages with no dedicated
  one). It's the only reliable way to discover a package's *real* R-universe URL
  (`https://<universe>.r-universe.dev/<package>` — verified to resolve; the shorter
  `https://<package>.r-universe.dev` guess does **not** resolve, 404s for every package tried) and
  to list packages that live on R-universe but never got a CRAN release.

A package can be `on_cran` only, `on_r_universe` only, or both — `gen-store-data.mjs` unions them
by name rather than picking one source over the other.

## Regenerating

```bash
node scripts/fetch-cran-index.mjs        # refreshes ecosystem/cran.json from CRAN
node scripts/fetch-runiverse-index.mjs   # refreshes ecosystem/r-universe.json from R-universe
node scripts/gen-store-data.mjs          # re-derives store/data/{packages,ecosystem}.json
```

[`.github/workflows/ecosystem.yml`](../.github/workflows/ecosystem.yml) runs all three on a
weekly schedule (and on manual dispatch) and commits the result — same "generated, committed
periodically, never hand-patched" contract as `status/validation.json`
(see [`../status/README.md`](../status/README.md)).

Do not hand-edit either file — both are overwritten on every workflow run.
