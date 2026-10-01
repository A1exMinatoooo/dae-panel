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
- Go is not installed on PATH. A temporary official Go 1.22.12 toolchain at `/tmp/dae-panel-go1.22.12/go` was used for the Linux/amd64 deployment build. No Go source changed in the UI fixes; Go tests and formatting were not run.

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

## Alignment Fix and Device Deployment

- Fixed the brand's stacking and right border, removed service-action vertical translation, made all four navigation cells 122px tall, removed the gap before theme controls, and made Environment rows uniformly 52px on desktop / 66px on mobile.
- At 841–1120px, service actions now remain in the status row; the interface moves to the second row. The brand matches the 80px first register row.
- Built the frontend with `VITE_APP_VERSION=ui-alignment-20261001 pnpm --config.verify-deps-before-run=false --dir web run build` and cross-compiled the embedded panel with Go 1.22.12, `GOOS=linux GOARCH=amd64 CGO_ENABLED=0`, and the same product version.
- Deployed to `root@10.39.39.39` as `/usr/local/bin/dae-panel`, then restarted only `dae-panel.service`. Original binary: `/usr/local/bin/dae-panel.backup-ui-alignment-20261001`.
- Device URL: `http://10.39.39.39:8080/dashboard`. Panel and dae services remained active; status reported dae PID 883. `/api/info` returned `panel_version: ui-alignment-20261001`; `/api/network/traffic` returned live default-route `eth0` counters and nullable conntrack.
- Chromium checks against the deployed, authenticated, unmocked UI passed at 1920×1080, 1440×1000, 1120×900, 900×800, 841×900, and 390×844: brand boundary aligned, desktop action/status center difference zero, navigation heights equal, theme gap zero, Environment rows equal, chart contained, no horizontal overflow, and Environment at the document bottom.
- Inspected desktop light/dark and mobile screenshots with actual traffic samples; browser error entries were empty. Reload/Suspend were not invoked to avoid changing the gateway's network state. Interface overrides and counter resets were not exercised.

## v2.0.0 Release and Production Deployment

- Tagged `v2.0.0` at commit `489da69` and pushed `main` and the tag. The CI release workflow built the official Linux amd64/arm64/armv7a packages and published the `dae-panel v2.0.0` GitHub release with `checksums-sha256.txt`.
- Deployed the official `dae-panel-linux-amd64.tar.gz` asset (sha256 `a971c6dc…`) to `root@10.39.39.39`, verifying the downloaded checksum before and the installed binary (`b54e8247…`) after.
- Replaced `/usr/local/bin/dae-panel` and restarted only `dae-panel.service`. Previous binary backed up as `/usr/local/bin/dae-panel.backup-before-v2.0.0`.
- Device `/api/info` now reports `panel_version: v2.0.0`; dae service stayed active (PID 883) with live `eth0` default-route counters. Reload/Suspend were not invoked.

## Unsupported Telemetry Removal and Editor Fix Deployment

- This entry supersedes earlier traffic/conntrack requirements and next-session recommendations: the complete telemetry UI/API/collector chain is removed, with no replacements or compatibility aliases.
- RAW and FORM now share Monaco. Lossless source-range extraction preserves whitespace/EOL, updates drafts immediately, and keeps stable section identities through temporarily invalid input.
- Six Node regression tests passed; TypeScript/Vite build and `go test ./...` passed using Go 1.22.12. The design detector's graph-field advisory is intentionally retained for the approved Visible Construction Grid.
- Isolated real-host smoke used a private copy of the configuration directory: exact edits across two sections, real dae validation/save/backup, failed-validation write prevention, stationary disabled loading icons, and retired endpoints returning 404 passed. Save & reload payload was checked then aborted; no daemon reload was allowed.
- Deployed `panel-fixes-20261002` to `root@10.39.39.39`, restarting only panel. Final binary SHA256: `26bc66b5dc960e0fc83893f3314067881d5fa35acca762d996d9c1fcb44d3baa`. Original binary backup: `/usr/local/bin/dae-panel.backup-panel-fixes-20261002`.
- Production desktop/mobile and dark Dashboard screenshots inspected; 1400×1000, 900×800, and 390×844 layout checks found no horizontal overflow or Environment/navigation overlap. One mobile uptime spacing correction was built and confirmed. Settings contains only Connection/System service; all six production FORM editors accepted edits/undo and preserved RAW exactly. Production configuration was never saved.
- Panel and dae remain active; dae PID remains `883`. Active configuration SHA256 remains `104d75990f8c23a9cacbc651fa9ad5fa03e0c6fbb5d52f1428673807efacb48d`. Panel journal scan found no error lines. Temporary smoke unit and private configuration copy were removed.
- No release tag or branch push was performed.

## Visible Construction Grid Panel Refactor

This entry supersedes the old 120px rail, 208px brand, 122px navigation cells, register spacer, and Config/Logs offset requirements. The historical Trace First comp is provenance only; the canonical surface brief and DESIGN.md now describe the content-bearing grid.

### Shipped behavior

- Desktop sidebar is 192px with a contained 64px brand and compact horizontal navigation; theme/build sit at the bottom. Mobile retains the 64px header and uses a 240px disclosure drawer. Route selection and Escape close it; Escape restores menu focus.
- All page titles are 24px, descriptions 13px, and actions occupy a separate toolbar. Desktop/mobile padding is 24px/16px.
- Dashboard uses a compact two-row status/control grid, explicit initial loading, independently settled status/environment failures, typed feedback, and mutually exclusive controls. No statistics or cross-page state polling were introduced.
- Environment facts wrap fully. Config FORM is continuous, preserving the existing parser and 240px Monaco body viewports. Logs retain their ledger and transport behavior; Settings removes decorative numbering and stacks continuous sections.

### Real-host evidence

- Final deployed version: `visible-grid-20261001T184450Z`; entry: `http://10.39.39.39:8080/dashboard` (HTTP 200).
- Final Linux/amd64 binary SHA256: `55c61d4da09338fb435eb240060c59e32db888f98a978562e3d8817fc7a5299a`.
- Production configuration SHA256 remains `104d75990f8c23a9cacbc651fa9ad5fa03e0c6fbb5d52f1428673807efacb48d`; dae remains running, not suspended, PID `883`. Only panel was restarted. Final panel PID was `14322`.
- Original binary rollback backup: `/usr/local/bin/dae-panel.backup-visible-grid-20261001T183358Z`, SHA256 `26bc66b5dc960e0fc83893f3314067881d5fa35acca762d996d9c1fcb44d3baa`. The first candidate is additionally backed up at `/usr/local/bin/dae-panel.backup-visible-grid-20261001T184450Z`.
- Isolated candidate read the real copied configuration (six sections). Real Validate succeeded; comments inserted into two FORM bodies preserved every other source byte after switching RAW. Validate→Save without reload wrote exactly the draft and created a backup inside the isolated directory; dirty cleared.
- An unmatched brace caused real validation failure without PUT. Save & reload subsequently reached validation then a full-draft `reload:true` PUT, blocked before transmission. This is not evidence of a real reload.
- Authenticated journal history returned 200 with 200 entries; SSE returned 200 on candidate and production. Clear emptied only local rows. No synthetic events were injected into daemon journal.
- Production FORM edit/undo preserved the body without saving. Password visibility and saving unchanged credentials were exercised in an isolated browser; subsequent authenticated API/SSE requests succeeded. Real light/dark/system toggles updated Monaco.
- Config/Logs/Settings each had zero status/info requests during a 5.2-second observation interval. Final panel journal error-priority scan had no entries.

### Controlled and visual evidence

- Six existing source-byte/EOL regression tests passed; TypeScript/Vite and Go 1.22.12 Linux/amd64 cross-builds passed. Frontend/backend used the same version. No dependencies or lockfiles were changed.
- Synthetic Dashboard scenarios exercised initial delayed Loading without warning, running/stopped/suspended states, operation-wide disabled buttons, successful controls, permission-denied danger feedback, independent and combined resource failures, stale-value removal, and recovery.
- Synthetic Config exercised two-section FORM/RAW exactness, validation-false prevention of PUT, and validation-before-full-draft `reload:true` success with dirty cleared. Synthetic logs exercised literal `[edge].*` filtering/highlighting, a 2000-event display bound, auto-scroll off/no-yank, re-enable, and Clear followed by a new event. Synthetic credential save reached API Authorization; theme persistence and Monaco mapping were checked.
- Real four-page light/dark captures at 1440×900 and 390×844 were reviewed as one batch. A single cleanup removed redundant Logs/Settings header labels, followed by one confirmation batch; all 16 final captures had 24px titles and no horizontal overflow.
- Intermediate checks at 1024px, 841px, and 840px confirmed aligned page edges and correct sidebar/header switching without overflow. Mobile route-close and Escape focus-return passed.
- Redacted captures/contact sheets are local, ignored evidence under `.impeccable/review/visible-grid-20261001T183358Z/`; `confirmation/` depicts the final version. Configuration, log contents, and credential fields are masked in screenshot files.
- Mechanical detector ran once. Its sole advisory was the retained low-contrast 10px graph field, an intentional approved-world exception. Finish verdict: approved structural direction and exercised operational workflows retained; no telemetry or health claims added.

No real Reload/Suspend/Resume or production configuration write was performed. Temporary candidate unit, private configuration directory, browser tabs, and SSH forwards were removed; rollback binaries remain. No release tag or branch push was performed.
