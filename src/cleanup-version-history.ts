import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  saveVersionHistory
} from './utils.js'; // Import from utils
// Types, readVersionHistory, and saveVersionHistory are imported from utils

/**
 * Main function to clean up duplicate versions
 */
function cleanupDuplicates(): void {
  console.log('Starting version history cleanup...');

  const history = readVersionHistory();

  if (!history.versions || history.versions.length === 0) {
    console.log('No versions found in history file. Nothing to clean.');
    return;
  }

  const uniqueVersionsMap = new Map<string, VersionHistoryEntry>();
  let duplicateCount = 0;

  // Iterate backwards to keep the first encountered entry (usually the latest added)
  // when platform counts are equal.
  for (let i = history.versions.length - 1; i >= 0; i--) {
    const entry = history.versions[i] as VersionHistoryEntry; // Add type assertion
    const existingEntry = uniqueVersionsMap.get(entry.version);

    if (existingEntry) {
      duplicateCount++;
      // Compare platform counts, keep the one with more platforms
      const currentPlatformCount = Object.keys(entry.platforms).length;
      const existingPlatformCount = Object.keys(existingEntry.platforms).length;

      if (currentPlatformCount > existingPlatformCount) {
        // Replace the existing entry with the current one (more platforms)
        uniqueVersionsMap.set(entry.version, entry);
         console.log(`Duplicate found for ${entry.version}. Keeping entry from index ${i} (more platforms: ${currentPlatformCount} vs ${existingPlatformCount}).`);
      } else {
         console.log(`Duplicate found for ${entry.version}. Keeping previous entry (platforms: ${existingPlatformCount} vs ${currentPlatformCount}).`);
         // Keep the existing entry (encountered first or equal platforms)
      }
    } else {
      // First time seeing this version, add it to the map
      uniqueVersionsMap.set(entry.version, entry);
    }
  }

  // Convert map values back to an array
  const cleanedVersions = Array.from(uniqueVersionsMap.values());

  // Sort the cleaned versions array by version number (descending)
  cleanedVersions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => { // Add types
    // Use localeCompare with numeric option for better sorting
    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
  });

  console.log(`Cleanup summary: Found ${duplicateCount} duplicate version entries. Kept ${cleanedVersions.length} unique entries.`);

  // Create the final history object
  const cleanedHistory: VersionHistory = { versions: cleanedVersions };

  // Save the cleaned history
  // Use util function with specific backup suffix
  saveVersionHistory(cleanedHistory, '.cleanup-backup');

  console.log('Cleanup process finished.');
}

// Run the cleanup process
// Keep execution logic if this script is run directly
if (require.main === module) {
    cleanupDuplicates();
}

// Export for potential testing or reuse
export { cleanupDuplicates };