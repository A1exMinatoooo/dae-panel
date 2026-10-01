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

- Desktop uses a 120px navigation rail and a compact system register above the workspace.
- The desktop brand ends at the register spacer's right rule. All four navigation cells use the same 122px height, with no empty cell before theme controls. Service actions share the status row's vertical center; the intermediate desktop register remains one 80px row.
- Dashboard order is service register, optional action feedback, then Environment. Environment stays in normal document flow within the content width and never covers navigation.
- Environment facts use equal 52px desktop rows and equal 66px mobile rows.
- Config and Logs are desktop workspaces, not collections of cards. Settings stacks authentication and system-service sections in one column.
- Below 840px the rail becomes a 64px top bar with a drawer. Monitoring and service actions remain first; all workspaces remain usable.

## Interaction

- Service information refreshes every five seconds; there is no traffic sampling or interface selector.
- Reload is always available. Suspend and Resume are mutually exclusive and follow current daemon state.
- Loading, unavailable, empty, dirty, success, and error states must remain distinguishable without relying on color alone.
- Configuration retains validation before save, backup behavior, and optional reload. Logs retain history, SSE reconnection, filtering, highlighting, and auto-scroll.
- RAW and FORM share Monaco options and theme. Each FORM body has a stable editor with a 240px scrollable viewport; edits preserve source whitespace and update dirty state immediately.
- Configuration action loading icons remain stationary while buttons retain loading/disabled behavior; shared loading animation remains available elsewhere.

## Accessibility

- All actions and navigation are keyboard-operable and have visible focus treatment.
- Text and controls must meet readable contrast in both themes.
- Status includes text or icon meaning in addition to color.
- Responsive layouts must not overlap, clip control labels, or hide essential actions.

## Reference

The canonical implementation brief is `.impeccable/surfaces/web-src-pages-dashboard-tsx.md`. The historical Trace First comp retains visual-grid provenance, not a requirement to restore removed metrics.
