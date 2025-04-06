import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  readFileContent,
  writeFileContent
} from './utils.js'; // Import from utils
// Types and readVersionHistory are imported from utils

/**
 * Update README.md file with linux-arm64 links from version history
 */
function updateReadmeFromHistory(): void {
  console.log('Starting README update process...');
  
  // Read version history
  const history = readVersionHistory();
  
  if (!history.versions || history.versions.length === 0) {
    console.log('No versions found in history file');
    return;
  }
  
  // Read README.md using utility function
  const readmePath = 'README.md'; // Relative path for util function
  let readmeContent = readFileContent(readmePath);
  if (readmeContent === null) {
    console.error('Failed to read README.md');
    return; // Stop if README cannot be read
  }
  
  // Backup is handled by writeFileContent
  
  let updatedCount = 0;
  
  // Process each version in history
  for (const entry of history.versions as VersionHistoryEntry[]) { // Add type assertion
    const version = entry.version;
    
    // Skip if no linux-arm64 URL
    if (!entry.platforms['linux-arm64']) {
      console.log(`Version ${version} has no linux-arm64 URL, skipping`);
      continue;
    }
    
    // Check if this version has only linux-x64 in README
    const linuxX64Only = new RegExp(
      `\\| ${version} \\| [\\d-]+ \\| .*? \\| .*? \\| \\[linux-x64\\]\\([^)]+\\) \\|`
    );
    
    // Check if this version already has linux-arm64 in README
    const linuxArm64Present = new RegExp(
      `\\| ${version} \\| [\\d-]+ \\| .*? \\| .*? \\| .*?\\[linux-arm64\\]\\([^)]+\\).*? \\|`
    );
    
    if (linuxArm64Present.test(readmeContent)) {
      console.log(`Version ${version} already has linux-arm64 in README, skipping`);
      continue;
    }
    
    if (linuxX64Only.test(readmeContent)) {
      // Replace the linux-x64 line with both linux-x64 and linux-arm64
      const oldLinuxSection = `[linux-x64](${entry.platforms['linux-x64']}) |`;
      const newLinuxSection = `[linux-x64](${entry.platforms['linux-x64']})<br>[linux-arm64](${entry.platforms['linux-arm64']}) |`;
      
      // Use string replacement to update the line for this version
      readmeContent = readmeContent.replace(
        new RegExp(`(\\| ${version} \\| [\\d-]+ \\| .*? \\| .*? \\| )\\[linux-x64\\]\\([^)]+\\) \\|`),
        `$1${newLinuxSection}`
      );
      
      console.log(`Updated README for version ${version} with linux-arm64 URL`);
      updatedCount++;
    } else {
      console.log(`Version ${version} doesn't match expected pattern in README, skipping`);
    }
  }
  
  console.log(`README update summary: Updated ${updatedCount} versions`);
  
  // Save the updated README
  // Save the updated README using utility function
  if (updatedCount > 0) {
    const readmeSaved = writeFileContent(readmePath, readmeContent, '.linux-arm64-update-backup');
    if (readmeSaved) {
        console.log('README.md updated successfully with linux-arm64 links');
    } else {
        console.error('Failed to save updated README.md');
    }
  } else {
    console.log('No updates made to README.md');
  }
}

// Run the update process
// Keep execution logic if this script is run directly
if (require.main === module) {
    updateReadmeFromHistory();
    console.log('Process completed');
}

// Export for potential testing or reuse
export { updateReadmeFromHistory };