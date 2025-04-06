# GitHub Pages Static Site Plan

## 1. Goal

Create a simple, user-friendly static website hosted on GitHub Pages to:
1.  Display the **complete** Cursor version history from `version-history.json`.
2.  Allow users to **search or filter** for specific versions.
3.  Provide easy access to **download links** for each version and platform.

## 2. Core Features

*   **Full History Table:** Display all data from `version-history.json` in a table format (Version, Date, Mac Universal/x64/arm64, Win x64/arm64, Linux x64/arm64 links).
*   **Latest Version Highlight:** Clearly indicate the latest version number and release date at the top.
*   **Version Search:** Include a search input for users to filter the table by version number (e.g., "0.48.7").
*   **Platform Filtering (Optional):** Consider adding buttons or a dropdown to filter versions that include download links for specific platforms (e.g., "Linux arm64").
*   **Responsive Design:** Ensure the site displays well on various screen sizes.

## 3. Site Structure & Technology

```mermaid
graph TD
    subgraph User Interface (index.html)
        A[Header: Title, GitHub Repo Link] --> B(Search Box & Filters);
        B --> C[Version History Table];
        C --> D[Footer: Copyright, Buy Me a Coffee Link];
    end

    subgraph JavaScript Logic (script.js)
        E[Fetch version-history.json] --> F{Parse JSON};
        F --> G[Render Full Table];
        B -- User Input --> H{Filter/Search Data};
        H --> I[Re-render Filtered Table];
        G --> C;
        I --> C;
    end

    subgraph Data Source
        J[GitHub version-history.json (main branch)] --> E;
    end

    subgraph Deployment (GitHub Actions)
        K[Push to main branch] --> L{Trigger Deployment Workflow};
        L --> M[Checkout Code];
        M --> N[Deploy Static Files to GitHub Pages];
    end

    style User Interface fill:#f9f,stroke:#333,stroke-width:2px
    style JavaScript Logic fill:#ccf,stroke:#333,stroke-width:2px
    style DataSource fill:#cfc,stroke:#333,stroke-width:2px
    style Deployment fill:#ffc,stroke:#333,stroke-width:2px
```

*   **Technology Stack:**
    *   **HTML:** Page structure.
    *   **CSS:** Styling (Consider Pico.css or native CSS).
    *   **JavaScript (Vanilla):** Fetch data from `version-history.json` via `fetch` API, dynamically generate/update the table, handle search/filtering. No large frameworks needed.
*   **Data Source:** JavaScript will fetch `version-history.json` directly from the `main` branch of the GitHub repository.
*   **File Structure:** Store site files (`index.html`, `style.css`, `script.js`) within the `docs/` directory at the repository root.
*   **Deployment:**
    *   Use GitHub Actions for automated deployment.
    *   Create a workflow (e.g., `.github/workflows/deploy-gh-pages.yml`) triggered on pushes to `main`.
    *   Utilize a standard GitHub Pages deployment action (e.g., `actions/deploy-pages`).
    *   Configure GitHub Pages repository settings to deploy from the `main` branch and the `/docs` folder.