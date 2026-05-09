# Phase 2 State Taxonomy

## Notebook States

- `loading`: IndexedDB is being opened and the latest notebook is being loaded.
- `loaded-empty`: no saved notebook was found; a new default notebook is available.
- `loaded-some`: notebook has text but no readings.
- `loaded-many`: notebook has readings, notes, metadata, or generated report content.
- `saving`: a debounced local save is in progress.
- `saved`: the latest reachable state is persisted locally.
- `storage-recoverable-error`: local persistence failed, but the in-memory notebook remains usable and exportable.
- `fatal-error`: React error boundary caught an unexpected app-level failure.

## Sensor Import States

- `idle`: no import is running.
- `parsing`: worker is parsing or inferring sensor data. Exit: success, recoverable error, cancel, or superseded by newer import.
- `imported`: worker returned readings and import summary; app appended readings and provenance.
- `empty`: worker parsed the input but found no usable readings. Prior readings are preserved.
- `recoverable-error`: import failed in domain terms; prior readings are preserved.
- `cancelled`: user cancelled the worker; prior readings are preserved.

## Long Operation Rules

- A newer import supersedes an older import by request id.
- Cancelling terminates the worker and does not mutate notebook readings.
- Recoverable errors keep the user's prior notebook state intact.
- Every state has an exit: retry, cancel, clear readings, export notebook, or create a new notebook.

## Report States

- `preview-current`: report preview reflects the current notebook state.
- `export-html`: HTML export is generated from current state and includes provenance.
- `print-pdf`: print window opens from deterministic report HTML; if blocked, HTML export is offered.

## Debug State

When `?debug=1` is present, the debug overlay shows experiment id, reading count, import summary, anomalies, skipped rows, activity log, and timing metadata.
