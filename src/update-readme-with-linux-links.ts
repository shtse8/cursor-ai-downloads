import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  readFileContent,
  writeFileContent
} from './utils.js'; // Import from utils
// Types and readVersionHistory are imported from utils

/**
 * Update README.md with Linux links from version-history.json
 */
async function updateReadmeWithLinuxLinks(): Promise<void> {
  console.log('Starting README.md update with Linux links...');
  
  // Read version history
  const history = readVersionHistory();
  
  // Read README.md content using utility function
  const readmePath = 'README.md'; // Relative path for util function
  let readmeContent = readFileContent(readmePath);
  if (readmeContent === null) {
    console.error('Failed to read README.md');
    return; // Stop if README cannot be read
  }
  
  // Backup is handled by writeFileContent
  
  // First, fix duplicate entries for 0.46.10
  const duplicatePattern = /\| 0\.46\.10 \| 2025-03-06 \|.*?\| .*?linux-x64.*?\) \|\n/s;
  readmeContent = readmeContent.replace(duplicatePattern, '');
  
  // Update 'Not Ready' entries
  // The pattern looks for lines like:
  // | 0.46.8 | 2025-03-01 | [darwin-universal](...)... | [win32-x64](...)... | Not Ready |
  const notReadyPattern = /\| ([\d\.]+) \| ([\d-]+) \| (.*?) \| (.*?) \| Not Ready \|/g;
  
  let changesMade = false; // Track if any changes were made
  readmeContent = readmeContent.replace(notReadyPattern, (match, version, date, macLinks, winLinks) => {
    // Find this version in the history
    const versionEntry = history.versions.find((entry: VersionHistoryEntry) => entry.version === version); // Add type
    
    if (versionEntry && versionEntry.platforms['linux-x64'] && versionEntry.platforms['linux-arm64']) {
      // Create Linux links section
      const linuxLinks = `[linux-x64](${versionEntry.platforms['linux-x64']})<br>[linux-arm64](${versionEntry.platforms['linux-arm64']})`;
      
      console.log(`Updating Linux links for version ${version}`);
      changesMade = true; // Mark that a change was made
      return `| ${version} | ${date} | ${macLinks} | ${winLinks} | ${linuxLinks} |`;
    }
    
    // No Linux links found, keep the line as is
    console.log(`No Linux links found for version ${version}, keeping "Not Ready"`);
    return match;
  });
  
  // Write updated content back to README.md only if changes were made
  if (changesMade) {
    const readmeSaved = writeFileContent(readmePath, readmeContent, '.update-readme-linux-backup');
    if (readmeSaved) {
        console.log('README.md has been updated with Linux links');
    } else {
        console.error('Failed to save updated README.md');
    }
  } else {
    console.log('No "Not Ready" entries found needing update in README.md');
  }
}

// Run the update process
// Keep execution logic if this script is run directly
if (require.main === module) {
    updateReadmeWithLinuxLinks().catch(error => {
      console.error('Error updating README.md:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    });
}

// Export for potential testing or reuse
export { updateReadmeWithLinuxLinks };