# 2026-02-17 – Obsidian Emulator Test Timeout

## Summary
- Increased the Obsidian emulator test timeouts to allow AI gateway calls to complete under load.
- Polling window extended from 10s to 60s to reduce false negatives when the gateway or worker is slow.

## Changes
- Test harness: [testing/testing-backend/testing-emulator/test-obsidian.py](testing/testing-backend/testing-emulator/test-obsidian.py)
  - POST and GET request timeouts raised from 10s to 60s.
  - Poll loop expanded from 10 iterations to 60 (1s cadence) for a full-minute window.

## Rationale
- aiGateway now uses Gemini single-prompt topology; responses can exceed 10s, causing premature test failures. Extending timeouts aligns with expected latency under emulator and network variability.

## Testing
- Pending: re-run `python testing/testing-backend/testing-emulator/test-obsidian.py` after starting emulators with valid GOOGLE_API_KEY to confirm end-to-end success.
