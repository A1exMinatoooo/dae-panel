# dae Panel

Terms used where dae's journal output crosses into the panel's log API and user interface.

## Language

**Canonical log level**:
One of `error`, `warn`, `info`, `debug`, `trace`, or `unknown`, used consistently by the panel API and filters.
_Avoid_: Severity string, journal priority

**Raw log message**:
The exact message received from journald, including dae's formatter prefix.
_Avoid_: Display message, cleaned message

**Display log message**:
The readable body of a raw log message after a recognized dae timestamp and level prefix are removed.
_Avoid_: Raw message, journal message

**Unknown log level**:
The canonical level for a journal entry whose dae severity cannot be determined reliably.
_Avoid_: Default info, unclassified info
