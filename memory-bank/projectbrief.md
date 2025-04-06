<!-- Version: 1.0 | Last Updated: 2025-06-04 -->

# Project Brief: Cursor AI Version Tracker

## 1. Project Goal

The primary goal of this project is to comprehensively track and document all official versions of the Cursor AI code editor. This includes:
- Maintaining an up-to-date list of official download links for all available versions (Mac, Windows, Linux).
- Recording the release history and key changes associated with different versions.
- Providing users with easy access to specific older or newer versions of Cursor AI.

## 2. Scope

- **Data Collection**: Automatically (via GitHub Actions) or manually gather download links and version information from official Cursor sources (website, update checks).
- **Data Storage**: Store version history and download links in a structured format (e.g., JSON).
- **Presentation**: Display the collected information clearly in the project's `README.md`.
- **Automation**: Utilize scripts (TypeScript) and GitHub Actions to automate the update process.
- **Memory Bank**: Maintain a Memory Bank system for project context persistence.

## 3. Key Deliverables

- A structured data file (e.g., `version-history.json`) containing version details and download links.
- An informative `README.md` file presenting the latest versions and a historical table of download links.
- Automated workflows/scripts for updating the data and README.
- A fully initialized and maintained Memory Bank.