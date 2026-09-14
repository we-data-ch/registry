# `ecosystem/`

`cran.json` is **generated**, not hand-edited — produced by
[`../scripts/fetch-cran-index.mjs`](../scripts/fetch-cran-index.mjs) from CRAN's own public,
unauthenticated endpoints (see the header comment in that script for exactly which ones). It is
the full name/version/title index of every package currently on CRAN, plus last month's download
count for the ~100 most-downloaded packages — the discovery layer behind the store's "Browse
CRAN" tab (`typR/registry2.md` §14.1 "Browsing the full R ecosystem", §15.1 "Package indexing").

This is deliberately independent of `packages/*.json` and the resolution/validation machinery
`registry.md` describes: it does not affect `typr add`, does not require a Type Definition to
exist, and does not mirror any package's actual contents — only CRAN's own name/version/title
metadata. `../scripts/gen-store-data.mjs` joins it against `packages/*.json` to compute, per CRAN
package, whether this registry already has an annotation for it — that joined result is
`store/data/ecosystem.json`, what `store/index.html` actually reads.

## Regenerating

```bash
node scripts/fetch-cran-index.mjs   # refreshes ecosystem/cran.json from CRAN
node scripts/gen-store-data.mjs     # re-derives store/data/{packages,ecosystem}.json
```

[`.github/workflows/ecosystem.yml`](../.github/workflows/ecosystem.yml) runs both on a weekly
schedule (and on manual dispatch) and commits the result — same "generated, committed
periodically, never hand-patched" contract as `status/validation.json`
(see [`../status/README.md`](../status/README.md)).

Do not hand-edit `cran.json` — it is overwritten on every workflow run.
