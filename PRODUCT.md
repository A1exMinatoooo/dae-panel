# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

dae-panel primarily serves technically proficient individual administrators who run dae on a Linux gateway or side-router. They use the panel to understand current service and network state, make operational changes, edit configuration safely, and investigate logs without leaving the browser.

## Product Purpose

dae-panel is a focused web control surface for a running dae instance. It succeeds when an administrator can quickly answer whether dae is healthy, whether traffic is moving, and what action is safe to take, while retaining full access to configuration and diagnostic workflows.

## Positioning

The product combines dae-specific service control, guarded configuration editing, live journal inspection, and Linux gateway telemetry in a single embedded web application distributed with the panel binary.

## Operating Context

- Runs alongside dae on Linux, commonly in gateway and side-router deployments.
- Must support dual-interface routing and single-arm side-router topologies without misrepresenting interface counters as internet upload or download.
- Desktop is the primary environment for configuration and log investigation.
- Mobile is primarily for monitoring and quick service actions; configuration and logs must remain usable.
- Administrators expect compact, truthful operational data rather than decorative analytics.

## Capabilities and Constraints

- Dashboard reports dae status, uptime, traffic activity, active connection count, environment details, and contextual service actions.
- Traffic sampling uses Linux interface counters at one-second intervals with a rolling 60-second client-side chart.
- The selected traffic interface defaults to the system route choice and can be overridden in Settings.
- Dual-interface deployments may label traffic as upload and download. Single-arm deployments must use receive and transmit terminology because interface counters cannot reliably infer internet direction.
- Cumulative traffic is the interface counter total since the interface started or reset and uses IEC byte units.
- Active connections use the current Linux conntrack entry count. An unavailable source is reported as unavailable, never as zero.
- Dashboard keeps Reload available and makes Suspend and Resume mutually exclusive according to service state.
- The dae-panel product version remains visible in navigation and is removed from Dashboard.
- dae version, platform, and config path remain available in a lower-priority runtime environment section.
- Configuration editing must preserve its validation-before-save safety chain, raw/form continuity, dirty state, theme-aware Monaco editor, and save/reload behavior.
- Log inspection must preserve initial history loading, SSE streaming and reconnection, filtering, search highlighting, bounded in-memory history, local timestamps, and auto-scroll behavior.
- Existing light, dark, and system theme preferences remain supported.
- Authentication credentials remain locally stored and are applied to subsequent API requests.

## Brand Commitments

- Product name: dae Panel.
- Interface language remains concise and technical.
- The visual system must not resemble a generic card-heavy SaaS dashboard or a glowing monitoring wall.
- Distinctiveness must not reduce information density, scanability, or operational efficiency.

## Evidence on Hand

- The repository contains the working React application, Go API, dae process controls, guarded configuration workflow, and journald-backed live log stream.
- Linux interface and conntrack telemetry are not yet implemented in the repository.
- dae does not currently expose a stable, released metrics endpoint that this product can depend on.
- No external product claims, benchmarks, customer evidence, or brand image assets are available and none should be fabricated.

## Product Principles

- Report what the system can actually know; change terminology when the measurement cannot support a stronger claim.
- Put current state and the next valid action ahead of low-frequency environment details.
- Preserve technical density while making hierarchy and failure states immediately legible.
- Keep high-frequency monitoring and control excellent on mobile without weakening desktop workspaces.
- Prefer reliable Linux-native telemetry and explicit unavailable states over inferred or invented data.

## Accessibility & Inclusion

The interface must remain keyboard-operable, readable in light and dark themes, responsive at mobile and desktop widths, and understandable without relying on color alone.
