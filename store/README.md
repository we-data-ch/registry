# Store (read-only)

A static search/browse page over `packages/*.json` — `typR/registry.md` §13 J6, item 1
("recherche, fiche package, provenance, drapeaux de capacités"). No account, no upload, no
backend: everything runs in the visitor's browser against generated JSON files. This is
deliberately **not** the "Add to Registry → automated PR" item (§12/D6) — that item is unstarted.

The page has two tabs:

- **TypR definitions** — the packages this registry already indexes a Type Definition for
  (unchanged behaviour).
- **Browse CRAN** — the full CRAN package index, overlaid with which of those packages already
  have a TypR annotation (official/community/generated) and which don't, plus a "most wanted"
  list of high-download, still-untyped packages. This is the discovery use case from
  `typR/registry2.md` §14.1 ("Browsing the full R ecosystem") / §19.1 ("Most wanted packages"):
  a developer evaluating an R package can check, before adopting it, whether typed interfaces
  already exist — and if not, jump straight to the contribution instructions.

## Files

- `index.html` — the page itself (tabs, search box, package list, package detail). Vanilla
  HTML/CSS/JS, no build step, no dependency.
- `data/packages.json` — **generated**, not hand-edited. Produced by
  `../scripts/gen-store-data.mjs` from `../packages/*.json` (and, when present,
  `../status/validation.json` — §9's nominative per-check results, joined in so the page can show
  what was actually verified instead of a green badge).
- `data/ecosystem.json` — **generated**, not hand-edited. Produced by the same script from
  `../ecosystem/cran.json` (see [`../ecosystem/README.md`](../ecosystem/README.md)) joined
  against `../packages/*.json` for annotation status. Absent until `ecosystem/cran.json` exists —
  the "Browse CRAN" tab degrades to a "not available" message rather than erroring (D2).

## Regenerating

Run this after editing anything under `packages/`, or after refreshing the CRAN index:

```bash
node scripts/fetch-cran-index.mjs   # optional: refresh ecosystem/cran.json from CRAN first
node scripts/gen-store-data.mjs
```

`.github/workflows/store.yml` fails CI if `store/data/packages.json` is committed stale relative
to `packages/*.json` — same "generated, checked, never hand-patched" contract as
`typr syntax --check` in the compiler repo.

## Serving locally

```bash
cd store && python3 -m http.server 8000
# open http://localhost:8000/
```

## Publishing

Wired up via `.github/workflows/deploy-pages.yml` (`actions/upload-pages-artifact` +
`actions/deploy-pages`, `store/` as the artifact root — a folder-scoped branch deploy can't serve
`/store` directly, only repo root or `/docs`, so this repo uses the Actions build type instead).
Pages is enabled on the repo with `build_type: workflow`. The job runs on every push to `master`
that touches `store/**`, or on demand via `workflow_dispatch`. Live at
<https://we-data-ch.github.io/registry/>.
