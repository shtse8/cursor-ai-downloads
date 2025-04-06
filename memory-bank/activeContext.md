<!-- Version: 1.1 | Last Updated: 2025-06-04 -->

# Active Context

## 1. Current Focus

- Understanding the project structure, data flow, and automation mechanisms after initializing the Memory Bank.

## 2. Recent Changes

- Initialized the Memory Bank system.
- Reviewed `README.md`: Confirmed project goal is tracking Cursor versions and download links.
- Reviewed `version-history.json`: Understood the data structure (array of versions with dates and platform links).
- Reviewed `src/update-cursor-links.ts`: Identified as the core script for fetching the latest version, updating `version-history.json`, and adding the new version row to `README.md`.
- Reviewed `src/update-readme-from-history.ts`: Identified as a helper script to fix missing `linux-arm64` links in `README.md` based on `version-history.json`.
- Reviewed `src/backfill-linux-arm64.ts`: Identified as a script to backfill missing `linux-arm64` links in `version-history.json` using API calls or pattern matching.
- Reviewed `src/backfill-missing-linux-links.ts`: Identified as a script to backfill completely missing Linux links in `version-history.json` based on build IDs from other platforms (primarily for older S3 links).
- Reviewed `src/update-readme-with-linux-links.ts`: Identified as a script to update `README.md` rows marked 'Not Ready' with Linux links found in `version-history.json`.
- Reviewed `.github/workflows/update-cursor-links.yml`: Confirmed it runs `src/update-cursor-links.ts` hourly and commits changes if a new version is found.
- Verified data consistency: `README.md` and `version-history.json` both show 0.48.7 (2025-04-02) as the latest version.

## 3. Next Steps

1.  Review `package.json` to understand specific dependencies.
2.  Review `.devcontainer/devcontainer.json` for development environment details.
3.  Consider if any immediate improvements or cleanups are needed (e.g., handling duplicate entries in `version-history.json` noted during review).
4.  Commit the initialized Memory Bank files to Git.

## 4. Active Decisions

- Confirmed the primary update mechanism relies on `src/update-cursor-links.ts` and the GitHub Action.
- Other scripts in `src/` are likely for manual data maintenance/correction.