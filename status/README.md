# `status/`

`validation.json` is written by [`.github/workflows/revalidate.yml`](../.github/workflows/revalidate.yml),
which runs `typr types revalidate` against every entry in `packages/*.json` on a weekly schedule
(`typR/registry.md` §13 J4, "revalidation périodique des définitions déjà indexées (détection de
dérive)"). It does not exist yet — nothing is indexed in `packages/` yet either (§13 J5) — the
workflow creates it on its first run with something to check.

Format: one entry per `(package, repository)` pair actually listed in the registry, each carrying
the date it was last checked and the full nominative result of every mechanical check
`registry.md` §9 describes (never a single pass/fail badge — see §9's own rationale).

```json
{
  "definitions": [
    {
      "package": "shiny",
      "repository": "github:alice/typr-shiny",
      "definition_version": "0.3.0",
      "checked_at": "2026-09-21",
      "ok": true,
      "checks": [
        { "name": "format_version", "status": "ok", "detail": "1" },
        { "name": "exports vs formals()", "status": "ok", "detail": "142/142 found" }
      ]
    }
  ]
}
```

Do not hand-edit this file — it is overwritten on every workflow run, and the workflow diffs its
own previous contents (in git history) against the new run to tell a definition that has always
been shaky apart from one that just broke.
