---
version: 1
slug: "web-src-pages-dashboard-tsx"
primary_target: "web/src/pages/Dashboard.tsx"
related_targets: ["web/src/components/Layout.tsx","web/src/pages/ConfigEditor.tsx","web/src/pages/Logs.tsx","web/src/pages/Settings.tsx"]
---

# Dashboard Surface Brief

Mode: Operate. Scope: Dashboard and the shared application shell/design system that governs Config, Logs, and Settings.

Audience: technically proficient individual Linux gateway and side-router administrators. The job is to confirm service health, take the next valid action, and move into configuration or logs without losing context.

Constraints: preserve service state/actions, configuration safety, log streaming, theme behavior, and responsive workspace layouts. All traffic and active-connection measurements and their settings/API have been removed by explicit product decision.

## Direction contract

THESIS: A compact state-and-action-first operational console. Content-bearing construction rules align navigation, service controls, fields, editors, and logs; no floating metric cards or decorative engineering marks.

OWN-WORLD: Off-white or near-black graph fields carry fine construction rules, black or white workhorse type, and one Crouwel blue signal plane. Green, amber, and red appear only for semantic state. Controls, tables, editors, and logs snap to the same cell logic with square or minimally softened corners.

STORY: Confirm service state → take the valid action → check environment → enter configuration or logs. dae state and control remain exclusively on Dashboard.

FIRST VIEWPORT: A Dashboard header precedes a minimum 144px status-control grid: state spans two rows, uptime/PID sit above actions. Feedback and Environment immediately follow in normal flow. A 192px sidebar carries compact text navigation; mobile uses the existing 64px top bar and 240px disclosure drawer. Natural whitespace is allowed after content; no telemetry placeholders.

FORM: Real field and toolbar alignment constructs the grid. Page titles are 24px; page padding is 24px desktop and 16px mobile. Continuous FORM section headings share rules with 240px Monaco bodies; logs use a ruled time/level/message ledger. Preserve the historical Crouwel direction seed `8f171f2e`; the Trace First comp is provenance, not a spacing specification.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Historical visual-grid comp: `.impeccable/mocks/visible-grid-b.png`; its Trace First telemetry layout is superseded.
