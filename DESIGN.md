# Design System

dae Panel uses a Visible Construction Grid: a compact operational interface where navigation, service controls, editors, and logs share one explicit ruled structure. The former Trace First composition is historical; unsupported telemetry has been removed without replacing it with placeholders.

## Principles

- Prioritize present service state and the next valid action.
- Keep the interface dense and truthful. Avoid floating dashboard cards and decorative analytics.
- Keep low-frequency environment facts available as a quiet appendix.
- Preserve the same information hierarchy in light and dark themes.

## Visual Language

- The page background is a fine graph field. Strong rules define structural regions; spacing does not imitate detached cards.
- Crouwel blue is the primary signal color. Green, amber, and red are reserved for semantic state.
- Inconsolata is the display face; Lekton is the compact interface face.
- Corners are square or minimally softened. Shadows are not part of the system.
- Controls use stable dimensions so labels, values, loading states, and hover states do not shift the grid.

## Layout

- Desktop uses a 192px sidebar with a contained 64px brand, four horizontal icon-and-text navigation rows of at least 48px, and theme/build information anchored at the bottom.
- All pages share a 24px title and 13px description followed by an independent full-width toolbar. Page padding is 24px desktop and 16px mobile; no page-specific navigation offsets.
- Dashboard order is header, Service status, optional feedback, then Environment. The minimum 144px status grid has a two-row state cell beside uptime/PID and service actions. It remains in normal document flow, allowing natural whitespace after content.
- Environment uses two columns on desktop and one on mobile. Fact rows are at least 56px; values wrap fully, including multiline versions and long configured paths.
- Config and Logs use flex workspaces with internal editor/log scrolling. FORM sections share continuous title/editor rules and 240px Monaco bodies. Settings stacks continuous Connection and System service sections.
- At widths up to 840px the sidebar becomes a 64px top bar and 240px disclosure drawer. Route selection, scrim, and Escape close it; Escape restores menu-button focus.

## Interaction

- Service information refreshes every five seconds; there is no traffic sampling or interface selector.
- Reload is always available. Suspend and Resume are mutually exclusive and follow current daemon state.
- Loading, unavailable, empty, dirty, success, and error states must remain distinguishable without relying on color alone.
- Configuration retains validation before save, backup behavior, and optional reload. Logs retain history, SSE reconnection, filtering, highlighting, and auto-scroll.
- RAW and FORM share Monaco options and theme. Each FORM body has a stable editor with a 240px scrollable viewport; edits preserve source whitespace and update dirty state immediately.
- Configuration action loading icons remain stationary while buttons retain loading/disabled behavior; shared loading animation remains available elsewhere.
- Status and environment settle independently. Initial requests show Loading; failed resources show Unavailable without stale facts, and successful subsequent polls restore them.
- Action feedback uses explicit success/danger semantics. During a service operation all control buttons are disabled; stopped/unknown state disables Suspend and never exposes Resume.
- Shared buttons, segmented controls, and inputs are at least 40px high; icon buttons are 44px squares. The faint 10px graph field is a retained, deliberately low-priority identity exception, not the layout grid.

## Accessibility

- All actions and navigation are keyboard-operable and have visible focus treatment.
- Text and controls must meet readable contrast in both themes.
- Status includes text or icon meaning in addition to color.
- Responsive layouts must not overlap, clip control labels, or hide essential actions.

## Reference

The canonical implementation brief is `.impeccable/surfaces/web-src-pages-dashboard-tsx.md`. The historical Trace First comp retains visual-grid provenance, not a requirement to restore removed metrics.
