document.addEventListener('DOMContentLoaded', () => {
    const versionTableBody = document.getElementById('version-table-body');
    const versionTable = document.getElementById('version-table');
    const searchInput = document.getElementById('search-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results');
    const latestVersionDetailsDiv = document.getElementById('latest-version-details');

    // Define the path to the version history file in the GitHub repository
    const historyUrl = 'https://raw.githubusercontent.com/shtse8/cursor-ai-downloads/main/version-history.json';

    let allVersions = []; // To store all fetched versions for filtering

    /**
     * Generates an HTML link string or 'N/A'.
     * @param {string|undefined} url - The download URL.
     * @returns {string} HTML string for the link or 'N/A'.
     */
    function createLinkCell(url) {
        // Use VERIFIED Base64 encoded SVG Data URI
        const iconBase64Uri = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBpZD0iZmlfMTU2NDQ3ODIiPjxwYXRoIGQ9Im0yMyAxMmMwIDYuMDc1MS00LjkyNDkgMTEtMTEgMTEtNi4wNzUxMyAwLTExLTQuOTI0OS0xMS0xMSAwLTYuMDc1MTMgNC45MjQ4Ny0xMSAxMS0xMSA2LjA3NTEgMCAxMSA0LjkyNDg3IDExIDExeiIgZmlsbD0iIzRhNzJmZiI+PC9wYXRoPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0ibTEyIDVjLjU1MjMgMCAxIC40NDc3MiAxIDF2NS41ODU4bDIuMjkyOS0yLjI5MjkxYy4zOTA1LS4zOTA1MiAxLjAyMzctLjM5MDUyIDEuNDE0MiAwIC4zOTA1LjM5MDUzLjM5MDUgMS4wMjM3MSAwIDEuNDE0MjFsLTQgNGMtLjE4NzUuMTg3NS0uNDQxOS4yOTI5LS43MDcxLjI5MjlzLS41MTk2LS4xMDU0LS43MDcxLS4yOTI5bC00LjAwMDAxLTRjLS4zOTA1Mi0uMzkwNS0uMzkwNTItMS4wMjM2OCAwLTEuNDE0MjEuMzkwNTMtLjM5MDUyIDEuMDIzNjktLjM5MDUyIDEuNDE0MjIgMGwyLjI5Mjg5IDIuMjkyOTF2LTUuNTg1OGMwLS41NTIyOC40NDc3LTEgMS0xem0tNSAxMmMwLS41NTIzLjQ0NzcyLTEgMS0xaDhjLjU1MjMgMCAxIC40NDc3IDEgMXMtLjQ0NzcgMS0xIDFoLThjLS41NTIyOCAwLTEtLjQ0NzctMS0xeiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIj48L3BhdGg+PC9zdmc+';
        // Adjust width and height to match the new SVG dimensions
        const linkContent = url ? `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${iconBase64Uri}" alt="Download" width="24" height="24"></a>` : 'N/A';
        return `<td>${linkContent}</td>`;
    }

     /**
     * Generates a download link string for the latest version section.
     * @param {string|undefined} url - The download URL.
     * @param {string} label - The platform label.
     * @returns {string} HTML string for the link or null if no URL.
     */
     function createLatestLinkListItem(url, label) {
        // Return null if no URL, so we can filter later
        return url ? `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></li>` : null;
    }


    /**
     * Renders the latest version details using vertical lists (ul/li).
     * @param {object|undefined} latestVersion - The latest version entry object.
     */
    function renderLatestVersion(latestVersion) {
        if (!latestVersionDetailsDiv) return;

        if (!latestVersion) {
            latestVersionDetailsDiv.innerHTML = '<p>Could not determine the latest version.</p>';
            return;
        }

        const { version, date, platforms } = latestVersion;
        const displayDate = date || 'N/A';

        // Create list items, filter out nulls (where URL didn't exist)
        const macLinks = [
            createLatestLinkListItem(platforms['darwin-universal'], 'macOS Universal'),
            createLatestLinkListItem(platforms['darwin-x64'], 'macOS Intel'),
            createLatestLinkListItem(platforms['darwin-arm64'], 'macOS Apple Silicon')
        ].filter(Boolean); // Filter out null list items

        const winLinks = [
            createLatestLinkListItem(platforms['win32-x64'], 'Windows x64'),
            createLatestLinkListItem(platforms['win32-arm64'], 'Windows ARM64')
        ].filter(Boolean);

        const linuxLinks = [
            createLatestLinkListItem(platforms['linux-x64'], 'Linux x64'),
            createLatestLinkListItem(platforms['linux-arm64'], 'Linux ARM64')
        ].filter(Boolean);

        // Build details string using lists
        let details = `<p><strong>Version: ${version}</strong> (${displayDate})</p>`;
        if (macLinks.length > 0) {
            details += `<div><strong>macOS:</strong><ul>${macLinks.join('')}</ul></div>`;
        }
        if (winLinks.length > 0) {
            details += `<div><strong>Windows:</strong><ul>${winLinks.join('')}</ul></div>`;
        }
        if (linuxLinks.length > 0) {
            details += `<div><strong>Linux:</strong><ul>${linuxLinks.join('')}</ul></div>`;
        }

        latestVersionDetailsDiv.innerHTML = details;
    }


    /**
     * Renders the version history table with separate columns for each platform/arch.
     * @param {Array} versions - Array of version objects to render.
     */
    function renderTable(versions) {
        if (!versionTableBody || !versionTable) return;

        versionTableBody.innerHTML = ''; // Clear existing rows

        if (versions.length === 0) {
            noResultsMessage.style.display = 'block';
            versionTable.style.display = 'none'; // Hide table if no results
            return;
        }

        noResultsMessage.style.display = 'none';
        versionTable.style.display = ''; // Show table

        versions.forEach(entry => {
            const row = document.createElement('tr');
            const { version, date, platforms } = entry;
            const displayDate = date || 'N/A';

            // Revert to creating individual cells for each platform/arch
            row.innerHTML = `
                <td>${version}</td>
                <td>${displayDate}</td>
                ${createLinkCell(platforms['darwin-universal'])}
                ${createLinkCell(platforms['darwin-x64'])}
                ${createLinkCell(platforms['darwin-arm64'])}
                ${createLinkCell(platforms['win32-x64'])}
                ${createLinkCell(platforms['win32-arm64'])}
                ${createLinkCell(platforms['linux-x64'])}
                ${createLinkCell(platforms['linux-arm64'])}
            `;
            versionTableBody.appendChild(row);
        });
    }

    /**
     * Fetches and processes the version history data.
     */
    async function loadVersionHistory() {
        // Show loading indicators
        loadingIndicator.style.display = 'block';
        if (latestVersionDetailsDiv) latestVersionDetailsDiv.innerHTML = '<p aria-busy="true">Fetching latest version...</p>';


        try {
            const response = await fetch(historyUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Assuming the structure is { versions: [...] }
            if (data && Array.isArray(data.versions)) {
                // Sort versions descending by version number (most recent first)
                allVersions = data.versions.sort((a, b) => {
                    // Ensure version strings exist before comparing
                    const versionA = a.version || '0';
                    const versionB = b.version || '0';
                    return versionB.localeCompare(versionA, undefined, { numeric: true, sensitivity: 'base' });
                });

                // Render latest version details
                renderLatestVersion(allVersions[0]); // Render the top one

                // Render the full table
                renderTable(allVersions); // Initial render of the table
            } else {
                console.error('Invalid data structure received:', data);
                throw new Error('Invalid data structure in version-history.json');
            }

        } catch (error) {
            console.error('Error fetching or processing version history:', error);
            if (latestVersionDetailsDiv) latestVersionDetailsDiv.innerHTML = '<p>Error loading latest version details.</p>';
            if (versionTableBody) {
                // Update colspan to match the original number of columns (Version + Date + 7 platforms = 9)
                versionTableBody.innerHTML = `<tr><td colspan="9">Error loading version history. Please try again later.</td></tr>`;
                versionTable.style.display = ''; // Show table to display error
            }
        } finally {
            loadingIndicator.style.display = 'none'; // Hide table loading indicator
        }
    }

    /**
     * Filters the versions based on the search input.
     */
    function filterVersions() {
        if (!searchInput) return;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredVersions = allVersions.filter(version =>
            version.version && version.version.toLowerCase().includes(searchTerm) // Check if version exists
        );
        renderTable(filteredVersions);
    }

    // Add event listener for the search input
    if (searchInput) {
        searchInput.addEventListener('input', filterVersions);
    }

    // Initial load of the version history
    loadVersionHistory();
});
