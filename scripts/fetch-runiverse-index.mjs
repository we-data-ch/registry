#!/usr/bin/env node
// Refreshes ecosystem/r-universe.json — the full R-universe package index, joined against
// ecosystem/cran.json by scripts/gen-store-data.mjs so the store's "Browse packages" tab can
// list packages that live on R-universe but never made it to CRAN, not just link out to a CRAN
// mirror per package (typR/registry2.md §14.1 "Browsing the full R ecosystem", extended per
// user request to cover R-universe listings, not just CRAN).
//
// One real, unauthenticated, read-only endpoint: https://r-universe.dev/api/search — a global,
// cross-universe search. Queried with an empty `q` and paginated via `skip`/`limit`, it returns
// one deduplicated row per unique package name (verified empirically: searching for a single
// package, e.g. "dplyr", returns exactly one hit even though the package exists both in its own
// dev universe and in the automatic "cran" mirror universe — the API already picks a single
// canonical `_user` per name, generally the package's own dev universe when it has one, falling
// back to "cran" otherwise). That canonical `_user` is what decides the package's real R-universe
// URL: https://<_user>.r-universe.dev/<Package> — verified to actually resolve (HTTP 200), unlike
// the https://<Package>.r-universe.dev shortcut this script's first version wrongly assumed
// (that subdomain form 404s for every package tried, including on CRAN).
//
// Usage: node scripts/fetch-runiverse-index.mjs
// Run this, then `node scripts/gen-store-data.mjs`, to refresh store/data/ecosystem.json.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "ecosystem");
const outPath = join(outDir, "r-universe.json");

const SEARCH_URL = "https://r-universe.dev/api/search";
const PAGE_SIZE = 5000;
const MAX_PAGES = 20; // safety cap — actual total is ~30k packages (6-7 pages) as of writing

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  // Keyed by name: the live ranking the search API sorts by can shift package positions across
  // our sequential page requests, occasionally landing the same package on two adjacent pages —
  // a Map absorbs that instead of emitting duplicate rows.
  const byName = new Map();
  let skip = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${SEARCH_URL}?q=&limit=${PAGE_SIZE}&skip=${skip}`;
    console.log(`fetching ${url} ...`);
    const data = await fetchJson(url);
    const results = data.results ?? [];
    if (results.length === 0) break;
    for (const r of results) {
      byName.set(r.Package, {
        name: r.Package,
        title: (r.Title ?? "").replace(/\s+/g, " ").trim(),
        universe: r._user ?? null,
        stars: typeof r.stars === "number" ? r.stars : null,
        usedby: typeof r._usedby === "number" ? r._usedby : null,
      });
    }
    skip += PAGE_SIZE;
  }

  const packages = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source: SEARCH_URL,
        total_packages: packages.length,
        packages,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`wrote ${outPath} (${packages.length} packages)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
