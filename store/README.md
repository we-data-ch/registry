# Store (read-only)

A static search/browse page over `packages/*.json` — `typR/registry.md` §13 J6, item 1
("recherche, fiche package, provenance, drapeaux de capacités"). No account, no upload, no
backend: everything runs in the visitor's browser against a generated JSON file. This is
deliberately **not** the "Add to Registry → automated PR" item (§12/D6) — that item is unstarted.

## Files

- `index.html` — the page itself (search box, package list, package detail). Vanilla HTML/CSS/JS,
  no build step, no dependency.
- `data/packages.json` — **generated**, not hand-edited. Produced by
  `../scripts/gen-store-data.mjs` from `../packages/*.json` (and, when present,
  `../status/validation.json` — §9's nominative per-check results, joined in so the page can show
  what was actually verified instead of a green badge).

## Regenerating

Run this after editing anything under `packages/`:

```bash
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

Not wired up yet. To publish this as a real page, enable GitHub Pages on this repository (Settings
→ Pages → Deploy from a branch, folder `/store`, or via a `actions/deploy-pages` job) — a repo
setting change, left for whoever picks this up to decide deliberately rather than flipped as a
side effect of adding the page.
