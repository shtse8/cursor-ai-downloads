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
        const linkContent = url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Download</a>` : 'N/A';
        return `<td>${linkContent}</td>`;
    }

     /**
     * Generates a download link string for the latest version section.
     * @param {string|undefined} url - The download URL.
     * @param {string} label - The platform label.
     * @returns {string} HTML string for the link or 'N/A'.
     */
     function createLatestLink(url, label) {
        return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>` : `${label}: N/A`;
    }


    /**
     * Renders the latest version details with individual links arranged vertically per OS.
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

        // Create individual links
        const macUniLink = createLatestLink(platforms['darwin-universal'], 'macOS Universal');
        const macX64Link = createLatestLink(platforms['darwin-x64'], 'macOS Intel');
        const macArm64Link = createLatestLink(platforms['darwin-arm64'], 'macOS Apple Silicon');
        const winX64Link = createLatestLink(platforms['win32-x64'], 'Windows x64');
        const winArm64Link = createLatestLink(platforms['win32-arm64'], 'Windows ARM64');
        const linuxX64Link = createLatestLink(platforms['linux-x64'], 'Linux x64');
        const linuxArm64Link = createLatestLink(platforms['linux-arm64'], 'Linux ARM64');

        // Filter out N/A links
        const macLinksArr = [macUniLink, macX64Link, macArm64Link].filter(link => !link.includes(': N/A'));
        const winLinksArr = [winX64Link, winArm64Link].filter(link => !link.includes(': N/A'));
        const linuxLinksArr = [linuxX64Link, linuxArm64Link].filter(link => !link.includes(': N/A'));

        // Build details string using <br> for vertical layout within OS groups
        let details = `<p><strong>Version: ${version}</strong> (${displayDate})</p>`;
        if (macLinksArr.length > 0) {
            details += `<div><strong>macOS:</strong><br>${macLinksArr.join('<br>')}</div>`;
        }
        if (winLinksArr.length > 0) {
            details += `<div><strong>Windows:</strong><br>${winLinksArr.join('<br>')}</div>`;
        }
        if (linuxLinksArr.length > 0) {
            details += `<div><strong>Linux:</strong><br>${linuxLinksArr.join('<br>')}</div>`;
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