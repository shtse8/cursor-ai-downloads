<!-- Version: 1.2 | Last Updated: 2025-06-04 -->

# Active Context

## 1. Current Focus

- Updating Memory Bank to reflect recent `README.md` changes and define next steps.

## 2. Recent Changes

- Initialized the Memory Bank system.
- Reviewed project structure, scripts (`src/*.ts`), data (`version-history.json`), and automation (`.github/workflows/update-cursor-links.yml`).
- **Rewrote `README.md`**:
    - Updated Buy Me a Coffee link to `https://buymeacoffee.com/shtse8`.
    - Limited the download table to display only the **last 10 versions**.
    - Added visual enhancements (emojis, badges, separators).
    - Corrected the GitHub Actions workflow badge URL to point to `shtse8/cursor-ai-downloads`.
    - Adjusted badge styles for consistency.

## 3. Next Steps

1.  **Update Scripts**: Modify `src/` scripts (especially `update-cursor-links.ts` and any others touching `README.md`) to correctly handle the new `README.md` format (e.g., only updating the table section for the last 10 versions).
2.  **Plan GitHub Pages Site**: Outline the features and structure for a static site allowing users to search all versions from `version-history.json` and download the latest version easily.
3.  **Implement GitHub Pages Site**: Create the HTML, CSS, and JavaScript for the static site and set up the deployment workflow.
4.  **Review Dependencies**: Examine `package.json` and `.devcontainer/devcontainer.json`.
5.  **Commit Changes**: Commit the updated `README.md` and Memory Bank files to Git.

## 4. Active Decisions

- Confirmed the primary update mechanism relies on `src/update-cursor-links.ts` and the GitHub Action.
- Other scripts in `src/` are likely for manual data maintenance/correction.
- Decided to limit `README.md` history display and create a separate static page for full history search.