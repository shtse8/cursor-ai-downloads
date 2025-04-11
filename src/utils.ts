import * as fs from 'fs';
import * as path from 'path';

// --- Type Definitions ---

export interface VersionHistoryEntry {
  version: string;
  date: string;
  platforms: {
    [platform: string]: string; // platform -> download URL
  };
}

export interface VersionHistory {
  versions: VersionHistoryEntry[];
}

// --- Filesystem Utilities ---

/**
 * Reads version history from JSON file.
 * Returns an empty history object if the file doesn't exist or is invalid.
 */
export function readVersionHistory(): VersionHistory {
  const historyPath = path.join(process.cwd(), 'version-history.json');
  if (fs.existsSync(historyPath)) {
    try {
      const jsonData = fs.readFileSync(historyPath, 'utf8');
      // Basic validation
      const parsedData = JSON.parse(jsonData);
      if (parsedData && Array.isArray(parsedData.versions)) {
        return parsedData as VersionHistory;
      } else {
        console.error('Invalid format in version-history.json');
        return { versions: [] };
      }
    } catch (error) {
      console.error('Error reading or parsing version-history.json:', error instanceof Error ? error.message : 'Unknown error');
      return { versions: [] };
    }
  } else {
    console.warn('version-history.json not found.');
    return { versions: [] };
  }
}

/**
 * Saves version history to JSON file with backup.
 * Returns true on success, false on failure.
 */
export function saveVersionHistory(history: VersionHistory, backupSuffix: string = '.backup'): boolean {
  if (!history || !Array.isArray(history.versions)) {
    console.error('Invalid version history object provided to saveVersionHistory');
    return false;
  }

  const historyPath = path.join(process.cwd(), 'version-history.json');
  const backupPath = `${historyPath}${backupSuffix}`;

  // Create a backup before saving
  try {
    if (fs.existsSync(historyPath)) {
      fs.copyFileSync(historyPath, backupPath);
      // console.log(`Created backup at ${backupPath}`); // Commented out for GH Action
    }
  } catch (error) {
     console.error(`Failed to create backup at ${backupPath}:`, error instanceof Error ? error.message : 'Unknown error');
     // Optionally, decide if you want to proceed without backup
     // For now, we'll stop if backup fails to be safe.
     return false;
  }

  try {
    // Pretty print JSON with 2 spaces
    const jsonData = JSON.stringify(history, null, 2);
    // Write to a temporary file first, then rename
    const tempPath = `${historyPath}.tmp`;
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, historyPath);
    // console.log(`Version history saved successfully to ${historyPath}`); // Commented out for GH Action
    return true;
  } catch (error) {
    console.error('Error saving version history:', error instanceof Error ? error.message : 'Unknown error');
    // Attempt to restore from backup if save failed
    try {
        if (fs.existsSync(backupPath)) {
            fs.renameSync(backupPath, historyPath);
            // console.log(`Restored ${historyPath} from backup.`); // Commented out for GH Action
        }
    } catch (restoreError) {
        console.error(`Failed to restore from backup ${backupPath}:`, restoreError instanceof Error ? restoreError.message : 'Unknown error');
    }
    return false;
  }
}

/**
 * Reads content from a file.
 * Returns null if the file doesn't exist or reading fails.
 */
export function readFileContent(filePath: string): string | null {
    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        return null;
    }
    try {
        return fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${absolutePath}:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

/**
 * Writes content to a file with backup.
 * Returns true on success, false on failure.
 */
export function writeFileContent(filePath: string, content: string, backupSuffix: string = '.backup'): boolean {
    const absolutePath = path.join(process.cwd(), filePath);
    const backupPath = `${absolutePath}${backupSuffix}`;

    // Create backup
    try {
        if (fs.existsSync(absolutePath)) {
            fs.copyFileSync(absolutePath, backupPath);
            // console.log(`Created backup at ${backupPath}`); // Commented out for GH Action
        }
    } catch (error) {
        console.error(`Failed to create backup at ${backupPath}:`, error instanceof Error ? error.message : 'Unknown error');
        return false; // Stop if backup fails
    }

    try {
        // Write to temp file then rename
        const tempPath = `${absolutePath}.tmp`;
        fs.writeFileSync(tempPath, content, 'utf8');
        fs.renameSync(tempPath, absolutePath);
        // console.log(`Content successfully written to ${absolutePath}`); // Commented out for GH Action
        return true;
    } catch (error) {
        console.error(`Error writing file ${absolutePath}:`, error instanceof Error ? error.message : 'Unknown error');
        // Attempt to restore from backup
        try {
            if (fs.existsSync(backupPath)) {
                fs.renameSync(backupPath, absolutePath);
                // console.log(`Restored ${absolutePath} from backup.`); // Commented out for GH Action
            }
        } catch (restoreError) {
            console.error(`Failed to restore from backup ${backupPath}:`, restoreError instanceof Error ? restoreError.message : 'Unknown error');
        }
        return false;
    }
}

// --- Date Utilities ---

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Other Utilities ---

/**
 * Extract version from URL or filename
 */
export function extractVersion(url: string): string {
  // For Windows
  const winMatch = url.match(/CursorUserSetup-[^-]+-([0-9.]+)\.exe/);
  if (winMatch && winMatch[1]) return winMatch[1];

  // For AppImage
  const appImageMatch = url.match(/Cursor-([0-9.]+)-[^-]+\.(AppImage|dmg)/);
   if (appImageMatch && appImageMatch[1]) return appImageMatch[1];

  // Generic version pattern (fallback)
  const versionMatch = url.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
  return versionMatch ? versionMatch[0] : 'Unknown';
}