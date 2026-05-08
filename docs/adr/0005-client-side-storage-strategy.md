# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

Notebook data should persist between browser sessions without auth, servers, or secrets. Experiments may include text, sensor tables, small image previews, and generated reports.

## Decision

Use IndexedDB through the `idb` library. Keep each experiment as one versioned document in an `experiments` object store. Store lightweight image previews and metadata in the document. Large raw media files are not retained by default in v1.

Use `localStorage` only for small UI preferences such as the last selected panel.

## Consequences

- Storage works offline and stays under the user's browser control.
- The app can provide import/export for portability.
- Browser storage quotas vary, so the UI should prefer generated reports and compact previews over raw recordings.

## Alternatives Considered

- OPFS was considered for large media but deferred because v1 avoids storing raw audio/video.
- `localStorage` alone was rejected because it is synchronous and too small for notebook data.
