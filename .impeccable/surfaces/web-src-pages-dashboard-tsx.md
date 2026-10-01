---
version: 1
slug: "web-src-pages-dashboard-tsx"
primary_target: "web/src/pages/Dashboard.tsx"
related_targets: ["web/src/components/Layout.tsx","web/src/pages/ConfigEditor.tsx","web/src/pages/Logs.tsx","web/src/pages/Settings.tsx"]
---

# Dashboard Surface Brief

Mode: Operate. Scope: Dashboard and the shared application shell/design system that governs Config, Logs, and Settings.

Audience: technically proficient individual Linux gateway and side-router administrators. The job is to confirm service health, understand current traffic, take the next valid action, and move into configuration or logs without losing context.

Constraints: preserve truthful single-arm receive/transmit terminology, dual-interface upload/download terminology, one-second sampling, a sixty-second trace, IEC units, conntrack availability states, configuration safety, log streaming, theme behavior, and responsive workspace layouts.

## Direction contract

THESIS: dae Panel is a visible construction system: one disciplined grid turns live kernel measurements, service state, navigation, and controls into a single operational surface. It refuses the category-default pile of floating metric cards.

OWN-WORLD: Off-white or near-black graph fields carry fine construction rules, black or white workhorse type, and one Crouwel blue signal plane. Amber distinguishes transmit data; green, amber, and red appear only for semantic state. Controls, tables, editors, and logs snap to the same cell logic with square or minimally softened corners.

STORY: The administrator sees that dae is running, reads the sixty-second traffic shape and current values, checks active connections and cumulative totals, then reloads or suspends only when that action is valid. Environment facts remain available without competing with current state.

FIRST VIEWPORT: Use the approved Trace First comp at `.impeccable/mocks/visible-grid-b.png`. A compact system register spans the top; the two-line traffic trace owns roughly half the canvas; five metric cells form one ruled ledger below; runtime facts close the view as a quiet appendix. Mobile preserves this order and replaces the sidebar with a top bar and drawer.

FORM: Visible Construction Grid, selected from the Crouwel grid challenger in direction seed `8f171f2e`; composition `trace-first`. The signature interaction is the chart advancing one whole grid cell per second while values update without shifting layout. Do not literalize demo figures, invented host details, the comp's bit-rate labels, or blue sparklines on cumulative totals.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Approved comp: `.impeccable/mocks/visible-grid-b.png`.
