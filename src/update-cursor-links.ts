import * as path from 'path';
import {
  VersionHistoryEntry,
  VersionHistory,
  readVersionHistory,
  saveVersionHistory,
  readFileContent,
  writeFileContent,
  formatDate,
  extractVersion
} from './utils.js'; // Add .js extension for ESM module resolution

// Global Response type is available via "dom" lib in tsconfig

interface PlatformInfo {
  platforms: string[];
  readableNames: string[];
  section: string;
}

interface PlatformMap {
  [key: string]: PlatformInfo;
}

interface VersionInfo {
  url: string;
  version: string;
}

interface ResultMap {
  [os: string]: {
    [platform: string]: VersionInfo;
  };
}

interface DownloadResponse {
  downloadUrl: string;
}

// Types are now imported from ./utils

const PLATFORMS: PlatformMap = {
  windows: {
    platforms: ['win32-x64', 'win32-arm64'],
    readableNames: ['win32-x64', 'win32-arm64'],
    section: 'Windows Installer'
  },
  mac: {
    platforms: ['darwin-universal', 'darwin-x64', 'darwin-arm64'],
    readableNames: ['darwin-universal', 'darwin-x64', 'darwin-arm64'],
    section: 'Mac Installer'
  },
  linux: {
    platforms: ['linux-x64', 'linux-arm64'],
    readableNames: ['linux-x64', 'linux-arm64'],
    section: 'Linux Installer'
  }
};

// extractVersion and formatDate are now imported from ./utils

/**
 * Fetch latest download URL for a platform
 */
async function fetchLatestDownloadUrl(platform: string): Promise<string | null> {
  try {
    // Use AbortController for timeout with standard fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(`https://www.cursor.com/api/download?platform=${platform}&releaseTrack=latest`, {
      headers: {
        'User-Agent': 'Cursor-Version-Checker',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal // Pass the abort signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as DownloadResponse;
    return data.downloadUrl;
  } catch (error) {
    console.error(`Error fetching download URL for platform ${platform}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// readVersionHistory and saveVersionHistory are now imported from ./utils

/**
 * Update the README.md file with latest Cursor links
 */
async function updateReadme(): Promise<boolean> {
  // console.log(`Starting update check at ${new Date().toISOString()}`); // Commented out for GH Action

  // Collect all URLs and versions
  const results: ResultMap = {};
  let latestVersion = '0.0.0';
  const currentDate = formatDate(new Date());

  // Fetch all platform download URLs
  for (const [osKey, osData] of Object.entries(PLATFORMS)) {
    results[osKey] = {};

    for (let i = 0; i < osData.platforms.length; i++) {
      const platform = osData.platforms[i];
      const url = await fetchLatestDownloadUrl(platform);

      if (url) {
        const version = extractVersion(url);
        results[osKey][platform] = { url, version };

        // Track the highest version number using localeCompare for proper sorting
        if (version !== 'Unknown' && version.localeCompare(latestVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0) {
          latestVersion = version;
        }
      }
    }
  }

  if (latestVersion === '0.0.0') {
    console.error('Failed to retrieve any valid version information');
    return false;
  }

  // console.log(`Latest version detected: ${latestVersion}`); // Commented out for GH Action

  // Use version-history.json as the single source of truth for version checking
  const history = readVersionHistory();

  // Check if this version already exists in the version history
  const existingVersionIndex = history.versions.findIndex((entry: VersionHistoryEntry) => entry.version === latestVersion);
  if (existingVersionIndex !== -1) {
    // console.log(`Version ${latestVersion} already exists in version history, no update needed`); // Commented out for GH Action
    // return false; // REMOVED: Allow function to complete to ensure final output is printed
  }

  // New version found, update both version-history.json and README.md
  // console.log(`Adding new version ${latestVersion} to both version-history.json and README.md`); // Commented out for GH Action

  // Read README using utility function
  const readmePath = 'README.md'; // Relative path for util function
  let readmeContent = readFileContent(readmePath);
  if (readmeContent === null) {
      console.error('Failed to read README.md');
      return false; // Stop if README cannot be read
  }

  // Create a new platforms object for the history entry
  const platforms: { [platform: string]: string } = {};

  // Add Mac platforms
  if (results.mac) {
    for (const [platform, info] of Object.entries(results.mac)) {
      platforms[platform] = info.url;
    }
  }

  // Add Windows platforms
  if (results.windows) {
    for (const [platform, info] of Object.entries(results.windows)) {
      platforms[platform] = info.url;
    }
  }

  // Add Linux platforms
  if (results.linux) {
    for (const [platform, info] of Object.entries(results.linux)) {
      platforms[platform] = info.url;
    }
  }

  // Create the new entry
  const newEntry: VersionHistoryEntry = {
    version: latestVersion,
    date: currentDate,
    platforms
  };

  // Add to history and sort by version (newest first)
  history.versions.push(newEntry);
  history.versions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => {
    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Limit history size to 100 entries to prevent unlimited growth
  if (history.versions.length > 100) {
    history.versions = history.versions.slice(0, 100);
    // console.log(`Truncated version history to 100 entries`); // Commented out for GH Action
  }

  // IMPORTANT: Save the updated history JSON BEFORE updating the README
  // Save history using utility function (suffix matches the one in updateReadme)
  const historySaved = saveVersionHistory(history, '.update-backup');
  if (historySaved) {
      // console.log(`Added version ${latestVersion} to version-history.json`); // Commented out for GH Action
  } else {
      console.error('Failed to save updated version history. Aborting README update.');
      // Decide if you want to proceed or stop if history save fails. Stopping is safer.
      return false;
  }

  // Update the date in the Cursor AI IDE section
  const ideUpdateRegex = /(Official Download Link for The latest version from `\[Cursor AI IDE\]'s \[Check for Updates\.\.\.\]` \(on `)([^`]+)(`\) is:)/;
  readmeContent = readmeContent.replace(ideUpdateRegex, `$1${currentDate}$3`);

  // Also update the date in the website section
  const websiteUpdateRegex = /(Official Download Link for The latest version from \[Cursor AI's Website\]\(https:\/\/www\.cursor\.com\/downloads\) \(on `)([^`]+)(`\) is:)/;
  readmeContent = readmeContent.replace(websiteUpdateRegex, `$1${currentDate}$3`);

  // Save the updated README using utility function
  const readmeSaved = writeFileContent(readmePath, readmeContent, '.update-backup');
  if (readmeSaved) {
      // console.log(`README.md updated with Cursor version ${latestVersion}`); // Commented out for GH Action
  } else {
      console.error('Failed to save updated README.md');
      // Consider what to do if README save fails after history was saved.
      // Maybe try to revert history? For now, just report error.
      return false;
  }

  return true;
}

// This function is deprecated and can be removed or kept as-is if needed for reference
function updateVersionHistory(version: string, date: string, results: ResultMap): void {
  // Keep console.warn as it's already stderr
  console.warn('updateVersionHistory is deprecated - version history is now updated directly in updateReadme');

  // For backward compatibility, create and save a version history entry
  if (!version || !date || !results) {
    console.error('Invalid parameters provided to updateVersionHistory');
    return;
  }

  try {
    // Read existing history
    const history = readVersionHistory();

    // Check if this version already exists
    if (history.versions.some((v: VersionHistoryEntry) => v.version === version)) {
      // console.log(`Version ${version} already exists in version history`); // Commented out for GH Action (inside deprecated function)
      return;
    }

    // Prepare platforms data from results
    const platforms: { [platform: string]: string } = {};

    // Extract platforms and URLs from results
    Object.entries(results).forEach(([osKey, osData]) => { // osKey is string, osData is { [platform: string]: VersionInfo }
      Object.entries(osData).forEach(([platform, info]: [string, VersionInfo]) => {
        platforms[platform] = info.url;
      }); // Add type annotation
    });

    // Create new entry
    const newEntry: VersionHistoryEntry = {
      version,
      date,
      platforms
    };

    // Add to history and sort
    history.versions.push(newEntry);
    history.versions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => {
      return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Save updated history
    saveVersionHistory(history);
    // console.log(`Added version ${version} to version-history.json via deprecated method`); // Commented out for GH Action (inside deprecated function)
  } catch (error) {
    console.error('Error in updateVersionHistory:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Main function to run the update with proper error handling
 */
async function main(): Promise<void> {
  try {
    const startTime = Date.now();
    // console.log(`Starting update process at ${new Date().toISOString()}`); // Commented out for GH Action

    // Run the update
    const updated = await updateReadme();
    const elapsedTime = Date.now() - startTime;

    // Informational completion logs commented out for GH Action
    // if (updated) {
    //   console.log(`Update completed successfully in ${elapsedTime}ms. Found new version.`);
    // } else {
    //   console.log(`Update completed in ${elapsedTime}ms. No new version found.`);
    // }

    // Double-check version history JSON file exists and is valid at the end
    const historyJson = readVersionHistory(); // Use util which handles existence and parsing errors
    if (historyJson.versions.length > 0) {
        // console.log('Verified version-history.json exists and contains version data.'); // Commented out for GH Action

        // Verify that the latest version from README is in version-history.json
        const readmeContent = readFileContent('README.md');
        if (readmeContent) { // Check if readme was read successfully
          // Extract the latest version from table - look for the first row after header
          const versionMatch = readmeContent.match(/\| (\d+\.\d+\.\d+) \| (\d{4}-\d{2}-\d{2}) \|/);
          if (versionMatch && versionMatch[1]) {
            const latestVersionInReadme = versionMatch[1];
            const latestDateInReadme = versionMatch[2];

            // console.log(`Latest version in README.md: ${latestVersionInReadme} (${latestDateInReadme})`); // Commented out for GH Action

            // Check if this version exists in history
            const versionExists = historyJson.versions.some((v: VersionHistoryEntry) => v.version === latestVersionInReadme);
            if (!versionExists) {
              console.warn(`WARNING: Version ${latestVersionInReadme} is in README.md but not in version-history.json.`); // Keep warning
              // console.log(`Attempting to extract data from README.md and update version-history.json...`); // Commented out for GH Action

              // Extract URLs for this version from README
              const sectionRegex = new RegExp(`\\| ${latestVersionInReadme} \\| ${latestDateInReadme} \\| (.*?) \\| (.*?) \\| (.*?) \\|`);
              const sectionMatch = readmeContent.match(sectionRegex);

              if (sectionMatch) {
                const macSection = sectionMatch[1];
                const windowsSection = sectionMatch[2];
                const linuxSection = sectionMatch[3];

                const platforms: { [platform: string]: string } = {};

                // Parse Mac links
                if (macSection) {
                  const macLinks = macSection.match(/\[([^\]]+)\]\(([^)]+)\)/g);
                  if (macLinks) {
                    macLinks.forEach((link: string) => { // Add type
                      const parts = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
                      if (parts && parts[1] && parts[2]) {
                        platforms[parts[1]] = parts[2];
                      }
                    });
                  }
                }

                // Parse Windows links
                if (windowsSection) {
                  const winLinks = windowsSection.match(/\[([^\]]+)\]\(([^)]+)\)/g);
                  if (winLinks) {
                    winLinks.forEach((link: string) => { // Add type
                      const parts = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
                      if (parts && parts[1] && parts[2]) {
                        platforms[parts[1]] = parts[2];
                      }
                    });
                  }
                }

                // Parse Linux links
                if (linuxSection && linuxSection !== 'Not Ready') {
                  const linuxLinks = linuxSection.match(/\[([^\]]+)\]\(([^)]+)\)/g);
                  if (linuxLinks) {
                    linuxLinks.forEach((link: string) => { // Add type
                      const parts = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
                      if (parts && parts[1] && parts[2]) {
                        platforms[parts[1]] = parts[2];
                      }
                    });
                  }
                }

                // Add the entry to version history
                if (Object.keys(platforms).length > 0) {
                  const newEntry: VersionHistoryEntry = {
                    version: latestVersionInReadme,
                    date: latestDateInReadme,
                    platforms
                  };

                  historyJson.versions.push(newEntry);

                  // Sort and save
                  historyJson.versions.sort((a: VersionHistoryEntry, b: VersionHistoryEntry) => {
                    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
                  });

                  // Save the updated history using util function
                  saveVersionHistory(historyJson, '.readme-sync-backup');
                  // console.log(`Successfully added version ${latestVersionInReadme} from README.md to version-history.json`); // Commented out for GH Action
                } else {
                  console.error(`Failed to extract platform links for version ${latestVersionInReadme}`);
                }
              } else {
                console.error(`Failed to find section for version ${latestVersionInReadme} in README.md`);
              }
            }
          }
        } // Closes if (readmeContent)
    } else { // Closes if (historyJson.versions.length > 0)
         console.warn('Warning: version-history.json check failed (file missing, invalid, or empty).');
    }
    // Output the result for GitHub Actions
    console.log(`update_result=${updated}`);

  } catch (error) {
    console.error('Critical error during update process:', error instanceof Error ? error.message : 'Unknown error');
    // Any GitHub Action will mark the workflow as failed if the process exits with non-zero
    process.exit(1);
  }
}

// Export functions for testing
export {
  fetchLatestDownloadUrl,
  updateReadme,
  // No longer exporting local functions: readVersionHistory, saveVersionHistory, updateVersionHistory, extractVersion, formatDate
  main
};

// Keep execution logic if this script is run directly
main().catch(error => {
  console.error('Unhandled error in main:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});