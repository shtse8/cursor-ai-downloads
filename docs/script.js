document.addEventListener('DOMContentLoaded', () => {
    const versionTableBody = document.getElementById('version-table-body');
    const versionTable = document.getElementById('version-table');
    const searchInput = document.getElementById('search-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results');
    const latestVersionDetailsDiv = document.getElementById('latest-version-details');

    // Define the path to the version history file in the GitHub repository
    const historyUrl = 'https://raw.githubusercontent.com/shtse8/cursor-ai-downloads/main/version-history.json';

    // Define symbols for platforms (consistent with the TS script)
    const SYMBOLS = {
        'darwin-universal': '🍎U',
        'darwin-x64': '🍎I',
        'darwin-arm64': '🍎A',
        'win32-x64': '🪟64',
        'win32-arm64': '🪟A',
        'linux-x64': '🐧64',
        'linux-arm64': '🐧A'
    };

    let allVersions = []; // To store all fetched versions for filtering

    /**
     * Generates an HTML link string using a symbol or an empty string if no URL.
     * @param {string|undefined} url - The download URL.
     * @param {string} platformKey - The key corresponding to the platform symbol.
     * @returns {string} HTML string for the link or empty string.
     */
    function createSymbolLink(url, platformKey) {
        const symbol = SYMBOLS[platformKey] || platformKey; // Fallback to key
        return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${platformKey}">${symbol}</a>` : '';
    }

    /**
     * Renders the latest version details using symbols.
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

        const macUniLink = createSymbolLink(platforms['darwin-universal'], 'darwin-universal');
        const macX64Link = createSymbolLink(platforms['darwin-x64'], 'darwin-x64');
        const macArm64Link = createSymbolLink(platforms['darwin-arm64'], 'darwin-arm64');
        const winX64Link = createSymbolLink(platforms['win32-x64'], 'win32-x64');
        const winArm64Link = createSymbolLink(platforms['win32-arm64'], 'win32-arm64');
        const linuxX64Link = createSymbolLink(platforms['linux-x64'], 'linux-x64');
        const linuxArm64Link = createSymbolLink(platforms['linux-arm64'], 'linux-arm64');

        // Filter out empty links for cleaner display and join with space
        const macLinksArr = [macUniLink, macX64Link, macArm64Link].filter(Boolean);
        const winLinksArr = [winX64Link, winArm64Link].filter(Boolean);
        const linuxLinksArr = [linuxX64Link, linuxArm64Link].filter(Boolean);

        let details = `<p><strong>Version: ${version}</strong> (${displayDate})</p><div class="latest-links">`; // Use a div for better styling control
        if (macLinksArr.length > 0) details += `<div class="os-group"><strong>macOS:</strong> ${macLinksArr.join(' ')}</div>`;
        if (winLinksArr.length > 0) details += `<div class="os-group"><strong>Windows:</strong> ${winLinksArr.join(' ')}</div>`;
        if (linuxLinksArr.length > 0) details += `<div class="os-group"><strong>Linux:</strong> ${linuxLinksArr.join(' ')}</div>`;
        details += `</div>`;

        latestVersionDetailsDiv.innerHTML = details;
    }


    /**
     * Renders the version history table with grouped OS columns and symbol links.
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

            // Group macOS links using symbols
            const macLinks = [
                createSymbolLink(platforms['darwin-universal'], 'darwin-universal'),
                createSymbolLink(platforms['darwin-x64'], 'darwin-x64'),
                createSymbolLink(platforms['darwin-arm64'], 'darwin-arm64')
            ].filter(Boolean).join(' '); // Filter out empty strings and join with space

            // Group Windows links using symbols
            const winLinks = [
                createSymbolLink(platforms['win32-x64'], 'win32-x64'),
                createSymbolLink(platforms['win32-arm64'], 'win32-arm64')
            ].filter(Boolean).join(' ');

            // Group Linux links using symbols
            const linuxLinks = [
                createSymbolLink(platforms['linux-x64'], 'linux-x64'),
                createSymbolLink(platforms['linux-arm64'], 'linux-arm64')
            ].filter(Boolean).join(' ');

            // Use 'N/A' if no links exist for an OS after filtering
            const macCellContent = macLinks || 'N/A';
            const winCellContent = winLinks || 'N/A';
            const linuxCellContent = linuxLinks || 'N/A';

            // Match the headers in index.html: Version, Date, macOS, Windows, Linux
            row.innerHTML = `
                <td>${version}</td>
                <td>${displayDate}</td>
                <td class="symbol-links">${macCellContent}</td>
                <td class="symbol-links">${winCellContent}</td>
                <td class="symbol-links">${linuxCellContent}</td>
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
                versionTableBody.innerHTML = `<tr><td colspan="5">Error loading version history. Please try again later.</td></tr>`; // Updated colspan
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