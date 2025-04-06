document.addEventListener('DOMContentLoaded', () => {
    const versionTableBody = document.getElementById('version-table-body');
    const versionTable = document.getElementById('version-table');
    const searchInput = document.getElementById('search-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results');

    // Define the path to the version history file in the GitHub repository
    // Assumes the site is deployed from the 'main' branch
    const historyUrl = 'https://raw.githubusercontent.com/shtse8/cursor-ai-downloads/main/version-history.json';

    let allVersions = []; // To store all fetched versions for filtering

    /**
     * Generates a table cell with a download link or 'N/A'.
     * @param {string|undefined} url - The download URL.
     * @returns {string} HTML string for a table cell (<td>).
     */
    function createLinkCell(url) {
        const linkContent = url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Download</a>` : 'N/A';
        return `<td>${linkContent}</td>`;
    }

    /**
     * Renders the version history table.
     * @param {Array} versions - Array of version objects to render.
     */
    function renderTable(versions) {
        if (!versionTableBody) return;

        versionTableBody.innerHTML = ''; // Clear existing rows

        if (versions.length === 0) {
            noResultsMessage.style.display = 'block';
            versionTable.style.display = 'none';
            return;
        }

        noResultsMessage.style.display = 'none';
        versionTable.style.display = ''; // Show table

        versions.forEach(entry => {
            const row = document.createElement('tr');
            const displayDate = entry.date || 'N/A'; // Handle potentially missing date

            row.innerHTML = `
                <td>${entry.version}</td>
                <td>${displayDate}</td>
                ${createLinkCell(entry.platforms['darwin-universal'])}
                ${createLinkCell(entry.platforms['darwin-x64'])}
                ${createLinkCell(entry.platforms['darwin-arm64'])}
                ${createLinkCell(entry.platforms['win32-x64'])}
                ${createLinkCell(entry.platforms['win32-arm64'])}
                ${createLinkCell(entry.platforms['linux-x64'])}
                ${createLinkCell(entry.platforms['linux-arm64'])}
            `;
            versionTableBody.appendChild(row);
        });
    }

    /**
     * Fetches and processes the version history data.
     */
    async function loadVersionHistory() {
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
                    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
                });
                renderTable(allVersions); // Initial render
            } else {
                console.error('Invalid data structure received:', data);
                throw new Error('Invalid data structure in version-history.json');
            }

        } catch (error) {
            console.error('Error fetching or processing version history:', error);
            if (versionTableBody) {
                versionTableBody.innerHTML = `<tr><td colspan="9">Error loading version history. Please try again later.</td></tr>`;
            }
            versionTable.style.display = ''; // Show table to display error
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
        }
    }

    /**
     * Filters the versions based on the search input.
     */
    function filterVersions() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredVersions = allVersions.filter(version =>
            version.version.toLowerCase().includes(searchTerm)
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