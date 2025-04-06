<!-- Version: 1.4 | Last Updated: 2025-06-06 -->

# Active Context

## 1. Current Focus

- **Planning the GitHub Pages Site**: Outlining the features, structure, and technical approach for a static site to display the full version history and provide easy download access.

## 2. Recent Changes

- Initialized the Memory Bank system.
- Reviewed project structure, scripts, data, and automation.
- **Rewrote `README.md`**: Updated links, limited table to 10 versions, added enhancements and markers (`<!-- TABLE_START -->`, `<!-- TABLE_END -->`).
- **Refactored `src/update-readme-from-history.ts`**: Modified script to regenerate README table using latest 10 versions from JSON and markers.
- **Fixed Core Update Logic**:
    - Modified `src/update-cursor-links.ts` to only update `version-history.json` and README date markers, removing direct table manipulation.
    - Updated `.github/workflows/update-cursor-links.yml` to execute `update-readme-from-history.ts` *after* `update-cursor-links.ts`, ensuring the README table is correctly regenerated based on the latest JSON data.
- **Committed Changes**: Committed all script, README, and workflow updates to Git.

## 3. Next Steps

1.  **Plan GitHub Pages Site**: Outline the features and structure for a static site allowing users to search all versions from `version-history.json` and download the latest version easily. (Current Focus)
2.  **Implement GitHub Pages Site**: Create the HTML, CSS, and JavaScript for the static site and set up the deployment workflow.
3.  **Review Dependencies**: Examine `package.json` and `.devcontainer/devcontainer.json`.
4.  **Data Cleanup (Optional/Future)**: Address potential duplicate entries and missing links in `version-history.json`.
5.  **Ongoing Maintenance**: Monitor workflow runs and address any future data inconsistencies or API changes from Cursor.

## 4. Active Decisions

- Confirmed the primary update mechanism now correctly relies on `update-cursor-links.ts` (updates JSON/dates) followed by `update-readme-from-history.ts` (regenerates table) executed via the GitHub Action.
- Other scripts in `src/` are likely for manual data maintenance/correction.
- Decided to limit `README.md` history display and create a separate static page for full history search.