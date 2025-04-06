import {
  VersionHistoryEntry,
  readVersionHistory,
  readFileContent,
  writeFileContent
} from './utils.js'; // Import from utils

const MAX_VERSIONS_IN_README = 10;

/**
 * Generates a Markdown link or 'N/A' text.
 * @param url - The URL for the download link.
 * @param label - Optional label for the link, defaults to the platform name if available.
 * @returns Markdown link string or 'N/A'.
 */
function generateLink(url: string | undefined, label: string): string {
  return url ? `[${label}](${url})` : `${label}: N/A`;
}

/**
 * Generates the Markdown table content with grouped OS columns.
 * @param versions - Array of recent version history entries.
 * @returns The complete Markdown table as a string.
 */
function generateMarkdownTable(versions: VersionHistoryEntry[]): string {
  const header = '| Version | Date | macOS | Windows | Linux |';
  const separator = '|---|---|---|---|---|';

  const rows = versions.map(entry => {
    const { version, date, platforms } = entry;
    const displayDate = date || 'N/A';

    // Group macOS links
    const macLinks = [
      generateLink(platforms['darwin-universal'], 'Universal'),
      generateLink(platforms['darwin-x64'], 'Intel'),
      generateLink(platforms['darwin-arm64'], 'Apple Silicon')
    ].filter(link => !link.endsWith(': N/A')).join('<br>'); // Filter out N/A links before joining

    // Group Windows links
    const winLinks = [
      generateLink(platforms['win32-x64'], 'x64'),
      generateLink(platforms['win32-arm64'], 'ARM64')
    ].filter(link => !link.endsWith(': N/A')).join('<br>');

    // Group Linux links
    const linuxLinks = [
      generateLink(platforms['linux-x64'], 'x64'),
      generateLink(platforms['linux-arm64'], 'ARM64')
    ].filter(link => !link.endsWith(': N/A')).join('<br>');

    // Use 'N/A' if no links exist for an OS after filtering
    const macCell = macLinks || 'N/A';
    const winCell = winLinks || 'N/A';
    const linuxCell = linuxLinks || 'N/A';


    return `| ${version} | ${displayDate} | ${macCell} | ${winCell} | ${linuxCell} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Generates the Markdown content for the latest version details section.
 * @param latestVersion - The latest version history entry.
 * @returns Markdown string for the latest version details.
 */
function generateLatestVersionDetails(latestVersion: VersionHistoryEntry | undefined): string {
    if (!latestVersion) {
        return 'Could not determine the latest version.';
    }

    const { version, date, platforms } = latestVersion;
    const displayDate = date || 'N/A';

    // Create links with platform names as labels
    const macUniLink = generateLink(platforms['darwin-universal'], 'Universal');
    const macX64Link = generateLink(platforms['darwin-x64'], 'Intel');
    const macArm64Link = generateLink(platforms['darwin-arm64'], 'Apple Silicon');
    const winX64Link = generateLink(platforms['win32-x64'], 'Windows x64');
    const winArm64Link = generateLink(platforms['win32-arm64'], 'Windows ARM64');
    const linuxX64Link = generateLink(platforms['linux-x64'], 'Linux x64');
    const linuxArm64Link = generateLink(platforms['linux-arm64'], 'Linux ARM64');

    // Filter out N/A links for cleaner display
    const macLinksArr = [macUniLink, macX64Link, macArm64Link].filter(link => !link.endsWith(': N/A'));
    const winLinksArr = [winX64Link, winArm64Link].filter(link => !link.endsWith(': N/A'));
    const linuxLinksArr = [linuxX64Link, linuxArm64Link].filter(link => !link.endsWith(': N/A'));


    let details = `**Version:** ${version} (${displayDate})\n\n`;
    if (macLinksArr.length > 0) details += `*   **macOS:** ${macLinksArr.join(' | ')}\n`;
    if (winLinksArr.length > 0) details += `*   **Windows:** ${winLinksArr.join(' | ')}\n`;
    if (linuxLinksArr.length > 0) details += `*   **Linux:** ${linuxLinksArr.join(' | ')}\n`;

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
export { updateReadmeFromHistory, generateMarkdownTable, generateLink, generateLatestVersionDetails };