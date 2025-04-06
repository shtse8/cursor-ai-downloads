import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  saveVersionHistory
} from './utils.js'; // Import from utils
// Types are imported from utils

interface DownloadResponse {
  downloadUrl: string;
}

/**
 * Fetch specific version download URL for a platform
 */
async function fetchVersionDownloadUrl(platform: string, version: string): Promise<string | null> {
  try {
    console.log(`Fetching ${platform} URL for version ${version}...`);
    // Use AbortController for timeout with standard fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(`https://www.cursor.com/api/download?platform=${platform}&releaseTrack=${version}`, {
      headers: {
        'User-Agent': 'Cursor-Version-Checker',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal // Pass the abort signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes
    
    if (!response.ok) {
      console.warn(`HTTP error fetching ${platform} for ${version}: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as DownloadResponse;
    return data.downloadUrl;
  } catch (error) {
    console.error(`Error fetching ${platform} URL for version ${version}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Try to generate linux-arm64 URL from linux-x64 URL using pattern matching
 */
function generateArm64UrlFromX64(x64Url: string): string | null {
  // Pattern 1: Recent builds with glibc in the URL
  const glibcPattern = /\/linux\/x64\/appimage\/Cursor-([^-]+)-([^.]+)\.deb\.glibc([^-]+)-x86_64\.AppImage/;
  const glibcMatch = x64Url.match(glibcPattern);
  
  if (glibcMatch) {
    // For these URLs, we just need to change x64 to arm64 and x86_64 to aarch64
    // The glibc version might be different (2.25 for x64, 2.28 for arm64)
    return x64Url
      .replace('/linux/x64/', '/linux/arm64/')
      .replace('x86_64', 'aarch64')
      .replace('glibc2.25', 'glibc2.28');
  }
  
  // Pattern 2: Downloader.cursor.sh URLs (newer format)
  const downloaderPattern = /(https:\/\/downloader\.cursor\.sh\/builds\/[^\/]+)\/linux\/appImage\/x64/;
  const downloaderMatch = x64Url.match(downloaderPattern);
  
  if (downloaderMatch) {
    // For these URLs, we just need to change the end part
    return `${downloaderMatch[1]}/linux/appImage/arm64`;
  }
  
  // No pattern matched
  return null;
}

// readVersionHistory and saveVersionHistory are imported from utils

/**
 * Main function to backfill linux-arm64 URLs
 */
async function backfillLinuxARM64(): Promise<void> {
  console.log('Starting linux-arm64 backfill process...');
  
  // Read the version history
  const history = readVersionHistory();
  
  if (!history.versions || history.versions.length === 0) {
    console.log('No versions found in history file');
    return;
  }
  
  console.log(`Found ${history.versions.length} versions in history`);
  
  // Process all versions that need updating (have linux-x64 but not linux-arm64)
  let versionsToProcess = history.versions
    .filter((entry: VersionHistoryEntry) => !entry.platforms['linux-arm64'] && entry.platforms['linux-x64']); // Add type
  
  console.log(`Will process ${versionsToProcess.length} versions in this run`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Process each version
  for (let i = 0; i < history.versions.length; i++) {
    const entry = history.versions[i] as VersionHistoryEntry; // Add type assertion
    const version = entry.version;
    
    // Skip if linux-arm64 already exists
    if (entry.platforms['linux-arm64']) {
      //console.log(`Version ${version} already has linux-arm64 URL, skipping`);
      skippedCount++;
      continue;
    }
    
    // Skip if no linux-x64 URL
    if (!entry.platforms['linux-x64']) {
      //console.log(`Version ${version} has no linux-x64 URL, skipping`);
      skippedCount++;
      continue;
    }
    
    // Skip if not in our list to process
    if (!versionsToProcess.some((v: VersionHistoryEntry) => v.version === version)) { // Add type
      console.log(`Version ${version} not in process list, skipping`);
      continue;
    }
    
    const x64Url = entry.platforms['linux-x64'];
    console.log(`Processing version ${version} with linux-x64 URL: ${x64Url}`);
    
    // Try different methods to get linux-arm64 URL
    
    // Method 1: Try to fetch from API
    let arm64Url = await fetchVersionDownloadUrl('linux-arm64', version);
    
    // Method 2: If API fetch failed, try pattern matching
    if (!arm64Url) {
      console.log(`Falling back to pattern matching for version ${version}`);
      arm64Url = generateArm64UrlFromX64(x64Url);
    }
    
    // Update the entry if we found a URL
    if (arm64Url) {
      console.log(`Found linux-arm64 URL for version ${version}: ${arm64Url}`);
      entry.platforms['linux-arm64'] = arm64Url;
      updatedCount++;
      
      // Save after each successful update to avoid losing progress
      if (updatedCount % 10 === 0) {
        console.log(`Saving intermediate progress after ${updatedCount} updates...`);
        // Use util function with specific backup suffix
        saveVersionHistory(history, '.backfill-arm64-backup');
      }
    } else {
      console.error(`Could not determine linux-arm64 URL for version ${version}`);
      errorCount++;
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Backfill summary: Updated ${updatedCount}, Skipped ${skippedCount}, Errors ${errorCount}`);
  
  // Save the updated history
  if (updatedCount > 0) {
    console.log('Saving updated history with new linux-arm64 URLs...');
    console.log(`Example updated entry: ${JSON.stringify(history.versions[0], null, 2)}`);
    // Use util function with specific backup suffix
    saveVersionHistory(history, '.backfill-arm64-backup');
    console.log('Backfill process completed and saved');
  } else {
    console.log('No updates made, skipping save');
  }
}

// Run the backfill process
// Keep execution logic if this script is run directly
if (require.main === module) {
    backfillLinuxARM64().catch(error => {
      console.error('Error in backfill process:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    });
}

// Export for potential testing or reuse
export { backfillLinuxARM64, fetchVersionDownloadUrl, generateArm64UrlFromX64 };