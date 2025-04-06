<!-- Version: 1.0 | Last Updated: 2025-06-04 -->

# Technology Context

## 1. Core Technologies

- **Programming Language**: TypeScript (`tsconfig.json`, `src/*.ts`)
- **Runtime Environment**: Bun (`bun.lockb`) / Node.js
- **Package Manager**: Bun (implied by `bun.lockb`), potentially npm/yarn (`package.json`)
- **Data Storage**: JSON (`version-history.json`)
- **Documentation**: Markdown (`README.md`)
- **Version Control**: Git / GitHub
- **Automation**: GitHub Actions (`.github/workflows/`)

## 2. Development Setup

- A `tsconfig.json` file suggests a standard TypeScript compilation setup.
- `package.json` defines project metadata and dependencies.
- `.devcontainer/devcontainer.json` indicates support for development containers, likely specifying tools and environment settings for consistent development.
- `.gitignore` lists files/directories excluded from Git tracking.

## 3. Dependencies

- Specific Node.js/Bun package dependencies are listed in `package.json` and `bun.lockb`. (Requires inspection of these files for details).

## 4. Constraints

- Relies on the availability and consistency of Cursor's official download link patterns and sources.
- GitHub Actions execution limits (time, frequency).

## 5. Operating System

- Scripts and workflows should be OS-agnostic, but development/testing primarily occurs on Windows (as per agent's environment).