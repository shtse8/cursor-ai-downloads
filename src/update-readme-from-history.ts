import {
  VersionHistoryEntry,
  readVersionHistory,
  readFileContent,
  writeFileContent
} from './utils.js'; // Import from utils

const MAX_VERSIONS_IN_README = 10;

// Define symbols for platforms
const SYMBOLS = {
    'darwin-universal': '🍎U',
    'darwin-x64': '🍎I',
    'darwin-arm64': '🍎A',
    'win32-x64': '🪟64',
    'win32-arm64': '🪟A',
    'linux-x64': '🐧64',
    'linux-arm64': '🐧A'
};

/**
 * Generates a Markdown link using a symbol or 'N/A' text.
 * @param url - The URL for the download link.
 * @param platformKey - The key corresponding to the platform symbol.
 * @returns Markdown link string or empty string if no URL.
 */
function generateSymbolLink(url: string | undefined, platformKey: keyof typeof SYMBOLS): string {
  const symbol = SYMBOLS[platformKey] || platformKey; // Fallback to key if symbol not found
  return url ? `[${symbol}](${url})` : ''; // Return empty string if no URL
}

/**
 * Generates the Markdown table content with grouped OS columns and symbol links.
 * @param versions - Array of recent version history entries.
 * @returns The complete Markdown table as a string.
 */
function generateMarkdownTable(versions: VersionHistoryEntry[]): string {
  const header = '| Version | Date | macOS | Windows | Linux |';
  const separator = '|---|---|---|---|---|';

  const rows = versions.map(entry => {
    const { version, date, platforms } = entry;
    const displayDate = date || 'N/A';

    // Group macOS links using symbols
    const macLinks = [
      generateSymbolLink(platforms['darwin-universal'], 'darwin-universal'),
      generateSymbolLink(platforms['darwin-x64'], 'darwin-x64'),
      generateSymbolLink(platforms['darwin-arm64'], 'darwin-arm64')
    ].filter(Boolean).join(' '); // Filter out empty strings and join with space

    // Group Windows links using symbols
    const winLinks = [
      generateSymbolLink(platforms['win32-x64'], 'win32-x64'),
      generateSymbolLink(platforms['win32-arm64'], 'win32-arm64')
    ].filter(Boolean).join(' ');

    // Group Linux links using symbols
    const linuxLinks = [
      generateSymbolLink(platforms['linux-x64'], 'linux-x64'),
      generateSymbolLink(platforms['linux-arm64'], 'linux-arm64')
    ].filter(Boolean).join(' ');

    // Use 'N/A' if no links exist for an OS after filtering
    const macCell = macLinks || 'N/A';
    const winCell = winLinks || 'N/A';
    const linuxCell = linuxLinks || 'N/A';

    return `| ${version} | ${displayDate} | ${macCell} | ${winCell} | ${linuxCell} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Generates the Markdown content for the latest version details section using symbols.
 * @param latestVersion - The latest version history entry.
 * @returns Markdown string for the latest version details.
 */
function generateLatestVersionDetails(latestVersion: VersionHistoryEntry | undefined): string {
    if (!latestVersion) {
        return 'Could not determine the latest version.';
    }

    const { version, date, platforms } = latestVersion;
    const displayDate = date || 'N/A';

    // Create links with symbols
    const macUniLink = generateSymbolLink(platforms['darwin-universal'], 'darwin-universal');
    const macX64Link = generateSymbolLink(platforms['darwin-x64'], 'darwin-x64');
    const macArm64Link = generateSymbolLink(platforms['darwin-arm64'], 'darwin-arm64');
    const winX64Link = generateSymbolLink(platforms['win32-x64'], 'win32-x64');
    const winArm64Link = generateSymbolLink(platforms['win32-arm64'], 'win32-arm64');
    const linuxX64Link = generateSymbolLink(platforms['linux-x64'], 'linux-x64');
    const linuxArm64Link = generateSymbolLink(platforms['linux-arm64'], 'linux-arm64');

    // Filter out empty links for cleaner display
    const macLinksArr = [macUniLink, macX64Link, macArm64Link].filter(Boolean);
    const winLinksArr = [winX64Link, winArm64Link].filter(Boolean);
    const linuxLinksArr = [linuxX64Link, linuxArm64Link].filter(Boolean);

    let details = `**Version:** ${version} (${displayDate})\n\n`;
    if (macLinksArr.length > 0) details += `*   **macOS:** ${macLinksArr.join(' ')}\n`; // Join with space
    if (winLinksArr.length > 0) details += `*   **Windows:** ${winLinksArr.join(' ')}\n`;
    if (linuxLinksArr.length > 0) details += `*   **Linux:** ${linuxLinksArr.join(' ')}\n`;

    return details.trim(); // Trim trailing newline if any OS group was empty
}


/**
 * Updates the README.md file with latest version details and a table of recent versions.
 */
function updateReadmeFromHistory(): void {
  console.log(`Starting README update from history (latest details + last ${MAX_VERSIONS_IN_README} versions)...`);

  // Read version history
  const history = readVersionHistory();

  if (!history.versions || history.versions.length === 0) {
    console.log('No versions found in history file. Cannot update README.');
    return;
  }

  // Sort history just in case (newest first based on version string)
  history.versions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => {
    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Get the latest version and the recent N versions for the table
  const latestVersion = history.versions[0];
  const recentVersions = history.versions.slice(0, MAX_VERSIONS_IN_README);
  console.log(`Found ${history.versions.length} total versions. Latest: ${latestVersion?.version}. Processing latest ${recentVersions.length} for table.`);

  // Generate content for both sections
  const newLatestDetailsContent = generateLatestVersionDetails(latestVersion);
  const newTableContent = generateMarkdownTable(recentVersions);

  // Read README.md using utility function
  const readmePath = 'README.md';
  let readmeContent = readFileContent(readmePath);
  if (readmeContent === null) {
    console.error('Failed to read README.md. Aborting update.');
    return;
  }

  // Define regex for both sections
  const latestDetailsRegex = /(<!-- LATEST_VERSION_DETAILS_START -->\s*)[\s\S]*?(\s*<!-- LATEST_VERSION_DETAILS_END -->)/;
  const tableRegex = /(<!-- TABLE_START -->\s*)[\s\S]*?(\s*<!-- TABLE_END -->)/;

  // Replace latest version details section
  const latestDetailsMatch = readmeContent.match(latestDetailsRegex);
  if (latestDetailsMatch) {
      readmeContent = readmeContent.replace(
          latestDetailsRegex,
          `$1\n${newLatestDetailsContent}\n$2`
      );
      console.log('Updated latest version details section.');
  } else {
      console.warn('Could not find <!-- LATEST_VERSION_DETAILS_START --> and <!-- LATEST_VERSION_DETAILS_END --> markers. Skipping latest version update.');
  }

  // Replace table section
  const tableMatch = readmeContent.match(tableRegex);
  if (tableMatch) {
      readmeContent = readmeContent.replace(
          tableRegex,
          `$1\n${newTableContent}\n$2` // $1 is start marker, $2 is end marker
      );
      console.log(`Updated table with the latest ${recentVersions.length} versions.`);
  } else {
      console.warn('Could not find <!-- TABLE_START --> and <!-- TABLE_END --> markers. Skipping table update.');
  }

  // Save the updated README using utility function
  const readmeSaved = writeFileContent(readmePath, readmeContent, '.history-update-backup');
  if (readmeSaved) {
    console.log('README.md updated successfully.');
  } else {
    console.error('Failed to save updated README.md');
  }
}

// Run the update process
// Keep execution logic if this script is run directly
try {
    updateReadmeFromHistory();
    console.log('Process completed.');
} catch (error) {
    console.error("Error running updateReadmeFromHistory:", error);
    process.exit(1); // Exit with error code if the script fails
}


// Export for potential testing or reuse
// Note: generateLink is no longer used directly by the main function, but kept for potential utility
export { updateReadmeFromHistory, generateMarkdownTable, generateSymbolLink, generateLatestVersionDetails };