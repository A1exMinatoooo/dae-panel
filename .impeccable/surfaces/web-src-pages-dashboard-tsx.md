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

THESIS: dae Panel is a visible construction system: one disciplined grid turns service state, navigation, controls, and environment facts into a single operational surface. It refuses the category-default pile of floating metric cards.

OWN-WORLD: Off-white or near-black graph fields carry fine construction rules, black or white workhorse type, and one Crouwel blue signal plane. Green, amber, and red appear only for semantic state. Controls, tables, editors, and logs snap to the same cell logic with square or minimally softened corners.

STORY: The administrator sees whether dae is running, checks uptime, then reloads or suspends only when that action is valid. Environment facts remain directly below service state and feedback.

FIRST VIEWPORT: A compact system register spans the top, followed by optional action feedback and four Environment facts. Environment does not overlap navigation or attach to the viewport bottom. Mobile preserves this order and replaces the sidebar with a top bar and drawer. No chart or metric placeholders.

FORM: Visible Construction Grid, derived from the Crouwel grid challenger in direction seed `8f171f2e`. RAW and FORM share Monaco; stable section editors retain original indentation and update full-document drafts immediately.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Historical visual-grid comp: `.impeccable/mocks/visible-grid-b.png`; its Trace First telemetry layout is superseded.
