# Privacy

Citizen Lab Notebook is private by default because it runs as a static browser app.

## What Is Stored

Experiment text, sensor readings, voice-note transcripts, image metadata summaries, and generated report content are stored in the browser's IndexedDB on the user's device.

Raw microphone recordings are not saved into the notebook by default. They are held temporarily in memory so the user can run local Whisper transcription.

Uploaded images are reduced to a preview data URL and metadata summary. The original image file is not uploaded to a server by this app.

## What Leaves the Browser

No notebook content is sent to a project backend because there is no backend.

The app may download public static assets after user action:

- Pyodide from a public CDN
- local model runtime files and model weights for Whisper/text drafting
- public GitHub commit metadata for the displayed commit link

These requests are for code/model assets or public repository metadata, not experiment content.

## Analytics

No analytics are included in v1.

## User Controls

Users can export notebook JSON and report HTML. Users can clear browser storage through their browser settings or create a new notebook inside the app.
