<!-- Version: 1.12 | Last Updated: 2025-06-06 -->

# Active Context

## 1. Current Focus

- **Review Dependencies**: Examine `package.json` and `.devcontainer/devcontainer.json` as per the next steps.

## 2. Recent Changes

- Initialized the Memory Bank system.
- Reviewed project structure, scripts, data, and automation.
- **Rewrote `README.md`**: Updated links, limited table to 10 versions, added enhancements and markers.
- **Refactored `src/update-readme-from-history.ts`**: Modified script to regenerate README table correctly.
- **Fixed Core Update Logic**: Modified `src/update-cursor-links.ts` and updated `.github/workflows/update-cursor-links.yml`.
- **Planned GitHub Pages Site**: Outlined features in `docs/gh-pages-plan.md`.
- **Implemented GitHub Pages Site**: Created initial HTML, CSS, and JS files in `docs/`.
- **Set up Deployment Workflow**: Created `.github/workflows/deploy-gh-pages.yml`.
- **Improved Layout & Content (Based on Feedback)**:
    - Updated README intro and added a dedicated 'Quick Download: Latest Version' section.
    - Updated GitHub Pages (`docs/index.html`, `docs/script.js`) to include a similar latest version section and Buy Me a Coffee link.
- **Reverted Table Layout Optimization (Based on Feedback)**:
    - Restored README and GitHub Pages tables to the original multi-column layout.
    - Reverted changes in related scripts and CSS.
- **Fixed README Formatting**: Removed a duplicate table header.
- **Fixed Pages Layout (Iteration 2, Based on Feedback)**:
    - Modified GitHub Pages 'Latest Version' section (`docs/script.js`, `docs/style.css`) again to use proper HTML lists (`ul`/`li`) for vertical link display, resolving layout issues.
- **Committed Changes**: Committed all updates, reverts, and fixes to Git.

## 3. Next Steps

1.  **Review Dependencies**: Examine `package.json` and `.devcontainer/devcontainer.json`. (Current Focus)
2.  **Data Cleanup (Optional/Future)**: Address potential duplicate entries and missing links in `version-history.json`.
3.  **Ongoing Maintenance**: Monitor workflow runs (both update and deployment) and address any future data inconsistencies or API changes from Cursor.
4.  **GitHub Pages Site Enhancements (Future)**: Consider adding platform filtering or other improvements based on usage.

## 4. Active Decisions

- Confirmed the primary update mechanism now correctly relies on `update-cursor-links.ts` followed by `update-readme-from-history.ts` executed via the GitHub Action.
- Confirmed the GitHub Pages site will be deployed automatically from the `docs/` directory via a separate GitHub Action.
- Other scripts in `src/` are likely for manual data maintenance/correction.
- Decided to limit `README.md` history display and create a separate static page for full history search, both featuring a prominent latest version download section (using list layout on Pages) and using the original multi-column table layout.