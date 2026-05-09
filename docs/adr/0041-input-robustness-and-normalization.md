# 0041 Input Robustness and Normalization Policy

## Status

Accepted

## Context

Student data comes from spreadsheets, phone sensor apps, classroom probes, and serial logs. These inputs disagree on delimiters, decimal separators, headers, comments, whitespace, and timestamps.

## Decision

Normalize text at the boundary: strip BOM, normalize CRLF to LF, collapse NBSP, trim control characters, and normalize smart quotes where safe. Sniff delimiter from comma, semicolon, tab, and pipe. Parse quoted CSV according to CSV rules. Recognize `sep=` dialect markers. Normalize decimal comma when the detected delimiter is not comma. Convert timestamps to elapsed seconds from the first parsed timestamp.

## Consequences

The app can ingest common exports without asking users to clean files first. Raw decisions are kept as provenance so normalization remains inspectable.

## Alternatives Considered

Leaving normalization to users was rejected because it is exactly the work the app should do.
