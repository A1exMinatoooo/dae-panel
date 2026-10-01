# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

dae-panel primarily serves technically proficient individual administrators who run dae on a Linux gateway or side-router. They use the panel to understand current service state, make operational changes, edit configuration safely, and investigate logs without leaving the browser.

## Product Purpose

dae-panel is a focused web control surface for a running dae instance. It succeeds when an administrator can quickly answer whether dae is healthy and what action is safe to take, while retaining full access to configuration and diagnostic workflows.

## Positioning

The product combines dae-specific service control, guarded configuration editing, and live journal inspection in a single embedded web application distributed with the panel binary.

## Operating Context

- Runs alongside dae on Linux, commonly in gateway and side-router deployments.
- Supports dual-interface routing and single-arm side-router deployments without claiming host-wide counters describe dae traffic.
- Desktop is the primary environment for configuration and log investigation.
- Mobile is primarily for monitoring and quick service actions; configuration and logs must remain usable.
- Administrators expect compact, truthful operational data rather than decorative analytics.

## Capabilities and Constraints

- Dashboard reports dae status, uptime, environment details, and contextual service actions.
- Traffic rates, cumulative traffic, active connections, interface selection, and associated API endpoints are absent: host counters cannot measure the independent dae process reliably.
- Dashboard keeps Reload available and makes Suspend and Resume mutually exclusive according to service state.
- The dae-panel product version remains visible in navigation and is removed from Dashboard.
- dae version, platform, and config path remain available in a lower-priority runtime environment section.
- Configuration editing must preserve its validation-before-save safety chain, raw/form continuity, dirty state, theme-aware Monaco editor, and save/reload behavior.
- RAW and FORM use Monaco. FORM preserves exact body whitespace and nested indentation, retains stable sections through incomplete drafts, and writes changes back immediately.
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
- The former sysfs/interface and global conntrack telemetry chain has been removed rather than presented as dae-specific measurements.
- dae does not currently expose a stable, released metrics endpoint that this product can depend on.
- No external product claims, benchmarks, customer evidence, or brand image assets are available and none should be fabricated.

## Product Principles

- Report what the system can actually know; change terminology when the measurement cannot support a stronger claim.
- Put current state and the next valid action ahead of low-frequency environment details.
- Preserve technical density while making hierarchy and failure states immediately legible.
- Keep service monitoring and control excellent on mobile without weakening desktop workspaces.
- Omit unsupported measurements rather than infer or invent data.

## Accessibility & Inclusion

The interface must remain keyboard-operable, readable in light and dark themes, responsive at mobile and desktop widths, and understandable without relying on color alone.
