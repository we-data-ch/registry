#!/usr/bin/env node
// Refreshes ecosystem/cran.json — the full CRAN package name index, used to let the store
// (store/index.html) browse and search the whole R ecosystem, not just the packages this
// registry already has Type Definitions for (typR/registry2.md §14.1/§15.1, "Browsing the full
// R ecosystem" / "Package indexing"). This is a *discovery* layer over CRAN's own metadata — it
// does not mirror package contents, does not affect `typr add` resolution, and is independent of
// packages/*.json (registry.md's own resolution/validation machinery).
//
// Three real network calls, all read-only and unauthenticated:
//   - https://cran.r-project.org/src/contrib/PACKAGES  — the canonical DCF index of every
//     package currently on CRAN (name, version — deliberately minimal, no Title/Description:
//     it's what R's own package tools resolve against, not a metadata feed).
//   - https://cran.r-project.org/web/packages/available_packages_by_name.html — the one-line
//     title for each package (what the PACKAGES file above omits), as a simple HTML table;
//     joined onto the PACKAGES record by name.
//   - https://cranlogs.r-pkg.org/top/last-month/100    — download-count ranking for the top
//     packages over the last month (the endpoint's own hard cap is 100, regardless of the number
//     requested — verified empirically, not documented by the API), the popularity signal behind
//     the "most wanted" (untyped, high-impact) list gen-store-data.mjs derives from this file
//     (§19.1).
//
// Usage: node scripts/fetch-cran-index.mjs
// Run this, then `node scripts/gen-store-data.mjs`, to refresh store/data/ecosystem.json.
// `.github/workflows/ecosystem.yml` does both on a weekly schedule and commits the result —
// same "generated, committed periodically, never hand-patched" contract as status/validation.json.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "ecosystem");
const outPath = join(outDir, "cran.json");

const PACKAGES_URL = "https://cran.r-project.org/src/contrib/PACKAGES";
const TITLES_URL = "https://cran.r-project.org/web/packages/available_packages_by_name.html";
const TOP_DOWNLOADS_URL = "https://cranlogs.r-pkg.org/top/last-month/100";

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

// Debian Control File (DCF) format: records separated by one or more blank lines; within a
// record, "Key: value" starts a field and any following line beginning with whitespace is a
// continuation of that field's value (used heavily by multi-line Title/Description fields).
function parsePackagesFile(text) {
  const blocks = text.split(/\r?\n\r?\n+/).map((b) => b.trim()).filter(Boolean);
  const records = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const fields = {};
    let key = null;
    for (const line of lines) {
      const m = /^(\S[^:]*):\s?(.*)$/.exec(line);
      if (m && !/^\s/.test(line)) {
        key = m[1];
        fields[key] = m[2];
      } else if (key) {
        fields[key] += " " + line.trim();
      }
    }
    if (fields.Package) records.push(fields);
  }
  return records;
}

// Titles legitimately start or end with a single quote (CRAN's own convention for quoting
// software/package names, e.g. "'Eigen' Templated...") — collapse whitespace only, never strip
// quote characters just because they land at either end of the string.
function cleanTitle(title) {
  if (!title) return "";
  return title.replace(/\s+/g, " ").trim();
}

const HTML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };

function decodeHtmlEntities(s) {
  return s.replace(/&(#39|amp|lt|gt|quot|apos);/g, (_, e) => HTML_ENTITIES[e]);
}

// available_packages_by_name.html: one <tr> per package, name in the anchor, title in the
// second <td>. Titles occasionally wrap across source lines, so match across the whole
// document rather than line by line.
function parseTitlesPage(html) {
  const titles = new Map();
  const rowRe =
    /<td><a href="\.\.\/\.\.\/web\/packages\/([^/]+)\/index\.html"><span class="CRAN">[^<]*<\/span><\/a><\/td><td>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = rowRe.exec(html))) {
    titles.set(m[1], cleanTitle(decodeHtmlEntities(m[2])));
  }
  return titles;
}

async function main() {
  console.log(`fetching ${PACKAGES_URL} ...`);
  const packagesText = await fetchText(PACKAGES_URL);
  const records = parsePackagesFile(packagesText);
  console.log(`parsed ${records.length} CRAN packages`);

  console.log(`fetching ${TITLES_URL} ...`);
  const titlesHtml = await fetchText(TITLES_URL);
  const titles = parseTitlesPage(titlesHtml);
  console.log(`parsed ${titles.size} package titles`);

  console.log(`fetching ${TOP_DOWNLOADS_URL} ...`);
  const top = await fetchJson(TOP_DOWNLOADS_URL);
  const downloads = new Map();
  for (const row of top.downloads ?? []) {
    downloads.set(row.package, Number(row.downloads));
  }
  console.log(`got download counts for ${downloads.size} packages (window ${top.start} .. ${top.end})`);

  const packages = records
    .map((r) => ({
      name: r.Package,
      version: r.Version ?? null,
      title: titles.get(r.Package) ?? "",
      downloads_last_month: downloads.has(r.Package) ? downloads.get(r.Package) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source: PACKAGES_URL,
        titles_source: TITLES_URL,
        downloads_source: TOP_DOWNLOADS_URL,
        downloads_window: { start: top.start ?? null, end: top.end ?? null },
        total_packages: packages.length,
        packages,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`wrote ${outPath} (${packages.length} packages, ${downloads.size} with download counts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
