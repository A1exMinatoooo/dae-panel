# Normalize dae log severity from the message

dae-panel derives severity from dae's message format and normalizes it to `error`, `warn`, `info`, `debug`, `trace`, or `unknown`. journald `PRIORITY` is not a fallback because dae writes formatted logs through stdout and journald can mark every line as informational; unmatched lines therefore remain `unknown` instead of silently becoming `info`. The API preserves the raw `MESSAGE` for compatibility and diagnostics while adding `message` for cleaned display text, accepting the extra field to avoid destroying source evidence.
