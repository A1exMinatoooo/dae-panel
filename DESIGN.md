# Design System

dae Panel uses a Visible Construction Grid: a compact operational interface where navigation, telemetry, controls, editors, and logs share one explicit ruled structure. The approved composition is Trace First, preserved at `.impeccable/mocks/visible-grid-b.png`.

## Principles

- Prioritize present state, traffic movement, and the next valid action.
- Keep the interface dense and truthful. Avoid floating dashboard cards and decorative analytics.
- Use labels that match the measurement: Link mode shows Receive/Transmit; WAN mode shows Download/Upload.
- Keep low-frequency environment facts available as a quiet appendix.
- Preserve the same information hierarchy in light and dark themes.

## Visual Language

- The page background is a fine graph field. Strong rules define structural regions; spacing does not imitate detached cards.
- Crouwel blue is the primary signal color. Amber distinguishes transmit traffic. Green, amber, and red are reserved for semantic state.
- Inconsolata is the display and metric face; Lekton is the compact interface face.
- Corners are square or minimally softened. Shadows are not part of the system.
- Controls use stable dimensions so labels, values, loading states, and hover states do not shift the grid.

## Layout

- Desktop uses a 120px navigation rail and a compact system register above the workspace.
- The desktop brand ends at the register spacer's right rule. All four navigation cells use the same 122px height, with no empty cell before theme controls. Service actions share the status row's vertical center, including the two-row intermediate desktop register.
- Dashboard order is service register, 60-second two-line traffic trace, five-cell metric ledger, then runtime environment.
- The traffic workspace fills remaining viewport height; its SVG width and height follow the plot independently, without intrinsic aspect-ratio sizing. The metric ledger and Environment close the viewport when content fits, and remain in normal document flow with scrolling on shorter windows.
- Environment facts use equal 52px desktop rows and equal 66px mobile rows.
- Config and Logs are desktop workspaces, not collections of cards. Settings uses ruled sections and native control shapes.
- Below 840px the rail becomes a 64px top bar with a drawer. Monitoring and service actions remain first; all workspaces remain usable.

## Interaction

- Traffic samples once per second and advances one chart interval without resizing the plot.
- Reload is always available. Suspend and Resume are mutually exclusive and follow current daemon state.
- The interface selector lives in Settings. Link/WAN semantics are an explicit user choice.
- Loading, unavailable, empty, dirty, success, and error states must remain distinguishable without relying on color alone.
- Configuration retains validation before save, backup behavior, and optional reload. Logs retain history, SSE reconnection, filtering, highlighting, and auto-scroll.

## Accessibility

- All actions and navigation are keyboard-operable and have visible focus treatment.
- Text and controls must meet readable contrast in both themes.
- Status includes text or icon meaning in addition to color.
- Responsive layouts must not overlap, clip control labels, or hide essential actions.

## Reference

The canonical implementation brief is `.impeccable/surfaces/web-src-pages-dashboard-tsx.md`. The selected comp is directional: production data, IEC units, persistent sidebar version, and explicit settings may intentionally differ from its demonstration content.
