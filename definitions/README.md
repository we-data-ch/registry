# `definitions/`

Monorepo home for the "long tail" of Type Definitions: generated definitions, one-off
contributions, and packages too small to warrant their own repository. Indexed the same way as
an external Definition Repository — a `packages/<pkg>.json` entry points here with
`"repository": "we-data-ch/registry"` and a `rev` pinned within *this* repo, instead of pointing
at someone else's GitHub repository.

See `typR/registry.md` §8.2 in the `TypR` workspace (compiler repo: `we-data-ch/typr`) for why
both an external-repo path and this monorepo path exist side by side. Each definition here still
follows the layout and manifest described in §5 (a `typr-def.toml` with `format_version`, plus a
`ty/` directory), just nested under this directory instead of living at its own repository root:

```text
definitions/
└── <pkg>/
    ├── typr-def.toml
    ├── ty/
    └── tests/
        └── smoke.ty
```

Empty until the first long-tail definition lands (§13 J5: bootstrap coverage for the top R
packages).
