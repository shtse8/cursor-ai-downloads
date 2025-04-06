<!-- Version: 1.0 | Last Updated: 2025-06-04 -->

# System Patterns & Architecture

## 1. Overview

This project functions as a data aggregation and presentation system focused on Cursor AI versions.

## 2. Core Components

- **Data Source**: Official Cursor AI download sources (website, update mechanism URLs).
- **Data Storage**: 
    - `version-history.json`: Primary structured data store for historical versions, release dates, and download links across platforms/architectures.
- **Processing Logic**: 
    - TypeScript scripts located in the `src/` directory.
    - `update-cursor-links.ts`: Likely fetches the latest version links.
    - `update-readme-from-history.ts`: Updates the `README.md` table based on `version-history.json`.
    - Other scripts (`backfill-*.ts`, `update-readme-with-linux-links.ts`) suggest specific data maintenance tasks.
- **Automation**: 
    - GitHub Actions workflow defined in `.github/workflows/update-cursor-links.yml`. This likely runs periodically to execute the update scripts.
- **Presentation**: 
    - `README.md`: The main user interface, displaying latest versions and a comprehensive table of historical download links.
- **Version Control**: Git repository hosted on GitHub.

## 3. Data Flow

1.  **Fetch**: Scripts/Workflow fetches latest download links from Cursor sources.
2.  **Update**: New version data is added to `version-history.json`.
3.  **Generate**: `update-readme-from-history.ts` script reads `version-history.json` and regenerates the download table in `README.md`.
4.  **Commit**: Changes to `version-history.json` and `README.md` are committed to the Git repository.

## 4. Key Technical Decisions

- **Language**: TypeScript for scripting (offers type safety).
- **Runtime**: Bun (indicated by `bun.lockb`) or Node.js.
- **Data Format**: JSON for structured data storage (`version-history.json`).
- **Documentation**: Markdown (`README.md`).
- **Automation**: GitHub Actions for scheduled updates.
- **Persistence**: Memory Bank system for AI agent context.