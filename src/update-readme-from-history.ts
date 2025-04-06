import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  readFileContent,
  writeFileContent
} from './utils.js'; // Import from utils

const MAX_VERSIONS_IN_README = 10;

/**
 * Generates a Markdown link or 'N/A' text.
 * @param url - The URL for the download link.
 * @returns Markdown link string or 'N/A'.
 */
function generateLink(url: string | undefined): string {
  return url ? `[Download](${url})` : 'N/A';
}

/**
 * Generates the Markdown table content for the recent versions.
 * @param versions - Array of recent version history entries.
 * @returns The complete Markdown table as a string.
 */
function generateMarkdownTable(versions: VersionHistoryEntry[]): string {
  const header = '| Version | Date | 🍎 macOS (Universal) | 🍎 macOS (Intel) | 🍎 macOS (Apple Silicon) | 🪟 Windows (x64) | 🪟 Windows (ARM64) | 🐧 Linux (x64) | 🐧 Linux (ARM64) |';
  const separator = '|---|---|---|---|---|---|---|---|---|';

  const rows = versions.map(entry => {
    const macUniLink = generateLink(entry.platforms['darwin-universal']);
    const macX64Link = generateLink(entry.platforms['darwin-x64']);
    const macArm64Link = generateLink(entry.platforms['darwin-arm64']);
    const winX64Link = generateLink(entry.platforms['win32-x64']);
    const winArm64Link = generateLink(entry.platforms['win32-arm64']);
    const linuxX64Link = generateLink(entry.platforms['linux-x64']);
    const linuxArm64Link = generateLink(entry.platforms['linux-arm64']);

    // Ensure date is present, default to 'N/A' if missing
    const displayDate = entry.date || 'N/A';

    return `| ${entry.version} | ${displayDate} | ${macUniLink} | ${macX64Link} | ${macArm64Link} | ${winX64Link} | ${winArm64Link} | ${linuxX64Link} | ${linuxArm64Link} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Updates the README.md file with a table of the latest N versions from version history.
 */
function updateReadmeFromHistory(): void {
  console.log(`Starting README update from history (showing last ${MAX_VERSIONS_IN_README} versions)...`);

  // Read version history
  const history = readVersionHistory();

  if (!history.versions || history.versions.length === 0) {
    console.log('No versions found in history file. Cannot update README table.');
    return;
  }

  // Sort history just in case (newest first based on version string)
  history.versions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => {
    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Get the latest N versions
  const recentVersions = history.versions.slice(0, MAX_VERSIONS_IN_README);
  console.log(`Found ${history.versions.length} total versions. Processing latest ${recentVersions.length}.`);

  // Generate the new Markdown table content
  const newTableContent = generateMarkdownTable(recentVersions);

  // Read README.md using utility function
  const readmePath = 'README.md';
  let readmeContent = readFileContent(readmePath);
  if (readmeContent === null) {
    console.error('Failed to read README.md. Aborting update.');
    return;
  }

  // Define the regex to find the table section including the markers
  // It captures the content *between* the markers.
  const tableRegex = /(<!-- TABLE_START -->\s*)[\s\S]*?(\s*<!-- TABLE_END -->)/;
  const match = readmeContent.match(tableRegex);

  if (!match) {
    console.error('Could not find <!-- TABLE_START --> and <!-- TABLE_END --> markers in README.md. Cannot update table.');
    return;
  }

  // Replace the old table content (between the markers) with the new table content
  const updatedReadmeContent = readmeContent.replace(
    tableRegex,
    `$1\n${newTableContent}\n$2` // $1 is start marker, $2 is end marker
  );

  // Save the updated README using utility function
  const readmeSaved = writeFileContent(readmePath, updatedReadmeContent, '.history-update-backup');
  if (readmeSaved) {
    console.log(`README.md table updated successfully with the latest ${recentVersions.length} versions.`);
  } else {
    console.error('Failed to save updated README.md');
  }
}

// Run the update process
// Keep execution logic if this script is run directly
// Note: require.main check might not work reliably with all module systems/bundlers.
// Consider using a different entry point mechanism if needed.
try {
    updateReadmeFromHistory();
    console.log('Process completed.');
} catch (error) {
    console.error("Error running updateReadmeFromHistory:", error);
    process.exit(1); // Exit with error code if the script fails
}


// Export for potential testing or reuse
export { updateReadmeFromHistory, generateMarkdownTable, generateLink };