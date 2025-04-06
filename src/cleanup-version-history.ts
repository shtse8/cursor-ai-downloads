import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for version history JSON
interface VersionHistoryEntry {
  version: string;
  date: string;
  platforms: {
    [platform: string]: string; // platform -> download URL
  };
}

interface VersionHistory {
  versions: VersionHistoryEntry[];
}

/**
 * Read version history from JSON file
 */
function readVersionHistory(): VersionHistory {
  const historyPath = path.join(process.cwd(), 'version-history.json');
  if (fs.existsSync(historyPath)) {
    try {
      const jsonData = fs.readFileSync(historyPath, 'utf8');
      return JSON.parse(jsonData) as VersionHistory;
    } catch (error) {
      console.error('Error reading version history:', error instanceof Error ? error.message : 'Unknown error');
      // Return empty structure on error to prevent crashing
      return { versions: [] };
    }
  } else {
    console.error('version-history.json not found!');
    return { versions: [] };
  }
}

/**
 * Save version history to JSON file
 */
function saveVersionHistory(history: VersionHistory): void {
  const historyPath = path.join(process.cwd(), 'version-history.json');

  // Create a backup before saving
  const backupPath = `${historyPath}.cleanup-backup`;
  try {
    if (fs.existsSync(historyPath)) {
      fs.copyFileSync(historyPath, backupPath);
      console.log(`Created backup at ${backupPath}`);
    }
  } catch (error) {
     console.error(`Failed to create backup at ${backupPath}:`, error instanceof Error ? error.message : 'Unknown error');
     // Do not proceed if backup fails to be safe
     return;
  }

  try {
    // Pretty print JSON with 2 spaces
    const jsonData = JSON.stringify(history, null, 2);
    fs.writeFileSync(historyPath, jsonData, 'utf8');
    console.log('Cleaned version history saved to version-history.json');
  } catch (error) {
    console.error('Error saving cleaned version history:', error instanceof Error ? error.message : 'Unknown error');
  }
}

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
    const entry = history.versions[i];
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
  cleanedVersions.sort((a, b) => {
    // Simple version comparison might fail for e.g. 0.10.0 vs 0.9.0
    // Use localeCompare with numeric option for better sorting
    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
  });

  console.log(`Cleanup summary: Found ${duplicateCount} duplicate version entries. Kept ${cleanedVersions.length} unique entries.`);

  // Create the final history object
  const cleanedHistory: VersionHistory = { versions: cleanedVersions };

  // Save the cleaned history
  saveVersionHistory(cleanedHistory);

  console.log('Cleanup process finished.');
}

// Run the cleanup process
cleanupDuplicates();