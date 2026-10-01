# Handoff

## Current State

The Dashboard/UI redesign and Linux traffic telemetry work is implemented on `main`. The working tree was clean before this handoff file was added. The relevant atomic commits, newest first, are:

- `e320303 fix(ui): simplify notice borders`
- `b6927d4 docs(design): preserve visible grid direction`
- `74a271e docs(network): document dashboard telemetry`
- `b67affd fix(dashboard): harden live operational states`
- `03fc011 feat(ui): unify operational workspaces`
- `ad31957 feat(dashboard): add live traffic workspace`
- `f569395 feat(network): expose traffic counters`
- `ebf1b9e chore(design): set comp-first workflow`
- `e47cfac docs(design): capture product requirements`

Read these sources instead of reconstructing requirements from commit diffs:

- Product constraints: `PRODUCT.md`
- Visual system and responsive rules: `DESIGN.md`
- Canonical surface brief: `.impeccable/surfaces/web-src-pages-dashboard-tsx.md`
- Approved visual reference: `.impeccable/mocks/visible-grid-b.png`
- API and development documentation: `README.md`
- Repository workflow: `AGENT.md`

## Verification Completed

- `cd web && npm run build` passes.
- `git diff --check` passes.
- Browser checks covered Dashboard, Config, Logs, and Settings at desktop and 390px mobile sizes, plus dark mode.
- Dashboard was additionally checked at 900px: document width equals viewport width, the two-row system register is 160px tall, and traffic begins below it without overlap.
- The mobile drawer is visually above Dashboard content, exposes `aria-expanded`/`aria-controls`, and closed navigation links are removed from the interactive browser snapshot through `visibility: hidden`.
- A prior accessibility scan reported zero definite violations; the remaining incomplete result was contrast inference through the graph-paper CSS background.

## Local Runtime

- A Vite dev server was left running at `http://127.0.0.1:4173/` when this document was written.
- No Go backend is running. A normal browser tab will therefore show unavailable API states unless the backend is started separately.
- The current environment does not provide `go` or `gofmt`, so Go tests and formatting were not run. The next environment with Go installed should run `gofmt` on changed Go files and `go test ./...` before release.

## Important Follow-Up Risk

`internal/dae/daemon.go` tracks a successful panel-issued suspend with an in-process atomic PID marker and clears it after a successful reload or PID change. This matches the documented dae flow where reload resumes a suspended instance, but the marker is not persisted across a dae-panel restart and cannot observe suspend/reload commands issued outside the panel. Do not claim stronger synchronization without adding a reliable daemon-side signal or a carefully scoped persisted state design.

The Impeccable comparison workbench remains ignored by Git. Its local hero comparison reached 73 percent and remained open because production requirements intentionally differ from demo content in the comp: live IEC values, panel version in the persistent sidebar, interface semantics in Settings, and no decorative total sparklines. The selected comp, prompt/provenance, design manifest, and canonical brief are committed; rejected candidates and generated crops are intentionally ignored.

## Suggested Skills

- `impeccable:impeccable`: use for any further visual refinement or responsive work so changes remain consistent with the selected direction.
- `code-review`: use before merging or releasing, especially after Go tooling becomes available.
- `diagnosing-bugs`: use if live interface counters, conntrack availability, suspend state, or SSE behavior differs on the target Linux gateway.
- `vercel:agent-browser-verify`: use after starting both backend and frontend to verify the real end-to-end browser flow without mocked responses.

## Recommended Next Session

Start the real Go backend on a Linux host with dae available, then verify interface auto-selection, manual override, one-second rate calculation, counter reset handling, nullable conntrack, Suspend/Resume, and responsive navigation against actual API responses. Run the full Go suite and format checks, fix only confirmed failures, and preserve the existing design and product contracts referenced above.

## Responsive Layout Fix

- Dashboard now uses an elastic traffic workspace rather than a fixed 450px section. The metric ledger and Environment keep their natural heights and close the viewport when content fits; short windows scroll without overlap.
- The chart grid explicitly constrains its plot row and reserves 22px for time labels. SVG intrinsic aspect-ratio sizing no longer expands the plot when desktop width increases.
- Mobile Dashboard padding no longer inherits workspace padding, and Environment facts remain in one column across all four rows.
- Chromium resize checks passed at 1920×1080, 1440×1000, 1440×720, 1120×900, 1000×800, 900×700, 841×900, 840×900, and 390×844: no horizontal overflow, chart contained above metrics, and Environment at the document bottom. Desktop and mobile screenshots were inspected.
- `pnpm --config.verify-deps-before-run=false run build` passed. The initial plain `pnpm run build` triggered automatic dependency installation and stopped at pnpm's esbuild build-script approval; generated pnpm manifests were removed to preserve the repository's existing dependency files.
- Layout verification used the running frontend's API-unavailable state; live Linux telemetry was not verified.
