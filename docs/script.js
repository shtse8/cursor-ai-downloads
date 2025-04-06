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
     * Generates an HTML link string or the label with 'N/A'.
     * @param {string|undefined} url - The download URL.
     * @param {string} label - The platform/architecture label.
     * @returns {string} HTML string for the link or label with 'N/A'.
     */
    function createLink(url, label) {
        return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>` : `${label}: N/A`;
    }

    /**
     * Renders the latest version details.
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

        const macUniLink = createLink(platforms['darwin-universal'], 'Universal');
        const macX64Link = createLink(platforms['darwin-x64'], 'Intel');
        const macArm64Link = createLink(platforms['darwin-arm64'], 'Apple Silicon');
        const winX64Link = createLink(platforms['win32-x64'], 'Windows x64');
        const winArm64Link = createLink(platforms['win32-arm64'], 'Windows ARM64');
        const linuxX64Link = createLink(platforms['linux-x64'], 'Linux x64');
        const linuxArm64Link = createLink(platforms['linux-arm64'], 'Linux ARM64');

        // Filter out N/A links for cleaner display
        const macLinksArr = [macUniLink, macX64Link, macArm64Link].filter(link => !link.includes(': N/A'));
        const winLinksArr = [winX64Link, winArm64Link].filter(link => !link.includes(': N/A'));
        const linuxLinksArr = [linuxX64Link, linuxArm64Link].filter(link => !link.includes(': N/A'));

        let details = `<p><strong>Version: ${version}</strong> (${displayDate})</p><ul>`;
        if (macLinksArr.length > 0) details += `<li><strong>macOS:</strong> ${macLinksArr.join(' | ')}</li>`;
        if (winLinksArr.length > 0) details += `<li><strong>Windows:</strong> ${winLinksArr.join(' | ')}</li>`;
        if (linuxLinksArr.length > 0) details += `<li><strong>Linux:</strong> ${linuxLinksArr.join(' | ')}</li>`;
        details += `</ul>`;

        latestVersionDetailsDiv.innerHTML = details;
    }


    /**
     * Renders the version history table with grouped OS columns.
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

            // Group macOS links
            const macLinks = [
                createLink(platforms['darwin-universal'], 'Universal'),
                createLink(platforms['darwin-x64'], 'Intel'),
                createLink(platforms['darwin-arm64'], 'Apple Silicon')
            ].filter(link => !link.includes(': N/A')).join('<br>'); // Filter out N/A links

            // Group Windows links
            const winLinks = [
                createLink(platforms['win32-x64'], 'x64'),
                createLink(platforms['win32-arm64'], 'ARM64')
            ].filter(link => !link.includes(': N/A')).join('<br>');

            // Group Linux links
            const linuxLinks = [
                createLink(platforms['linux-x64'], 'x64'),
                createLink(platforms['linux-arm64'], 'ARM64')
            ].filter(link => !link.includes(': N/A')).join('<br>');

            // Use 'N/A' if no links exist for an OS after filtering
            const macCellContent = macLinks || 'N/A';
            const winCellContent = winLinks || 'N/A';
            const linuxCellContent = linuxLinks || 'N/A';

            // Match the headers in index.html: Version, Date, macOS, Windows, Linux
            row.innerHTML = `
                <td>${version}</td>
                <td>${displayDate}</td>
                <td>${macCellContent}</td>
                <td>${winCellContent}</td>
                <td>${linuxCellContent}</td>
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