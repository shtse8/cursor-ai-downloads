import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface VersionHistory {
  version: string;
  date: string;
  platforms: {
    [key: string]: string;
  };
}

async function updateReadme() {
  try {
    // Read version history
    const historyContent = await fs.readFile(join(process.cwd(), 'version-history.json'), 'utf-8');
    const versionHistory: VersionHistory[] = JSON.parse(historyContent).versions;

    // Read README content
    const readmePath = join(process.cwd(), 'README.md');
    let readmeContent = await fs.readFile(readmePath, 'utf-8');

 // Create new download section
    // Center align columns 3-9 (download links)
    const tableHeader = '| Version | Date | macOS Universal | macOS Intel | macOS Apple Silicon | Windows x64 | Windows ARM64 | Linux x64 | Linux ARM64 |\n|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|';
    // Use new Base64 encoded SVG Data URI provided by user
    const iconBase64Uri = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBpZD0iZmlfMTU2NDQ3ODIiPjxwYXRoIGQ9Im0yMyAxMmMwIDYuMDc1MS00LjkyNDkgMTEtMTEgMTEtNi4wNzUxMyAwLTExLTQuOTI0OS0xMS0xMSAwLTYuMDc1MTMgNC45MjQ4Ny0xMSAxMS0xMSA2LjA3NTEgMCAxMSA0LjkyNDg3IDExIDExeiIgZmlsbD0iIzRhNzJmZiI+PC9wYXRoPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0ibTEyIDVjLjU1MjMgMCAxIC40NDc3MiAxIDF2NS41ODU4bDIuMjkyOS0yLjI5MjljMS4zOTA1LS4zOTA1MiAxLjAyMzctLjM5MDUyIDEuNDE0MiAwIC4zOTA1LjM5MDUzLjM5MDUgMS4wMjM3MSAwIDEuNDE0MjFsLTQgNGMtLjE4NzUuMTg3NS0uNDQxOS4yOTI5LS43MDcxLjI5MjkgMC0uNTE5Ni0uMTA1NC0uNzA3MS0uMjkyOWwtNC4wMDAwMS00Yy0uMzkwNTItLjM5MDUtLjM5MDUyLTEuMDIzNjggMC0xLjQxNDIxLjM5MDUzLS4zOTA1MiAxLjAyMzY5LS4zOTA1MiAxLjQxNDIyIDBsMi4yOTI4OSAyLjI5MjljMXYtNS41ODU4YzAtLjU1MjI4LjQ0NzctMSAxLTF6bS01IDEyYzAtLjU1MjMuNDQ3NzItMSAxLTFoOGMuNTUyMyAwIDEgLjQ0NzcgMSAxcy0uNDQ3NyAxLTEgMWgtOGMtLjU1MjI4IDAtMS0uNDQ3Ny0xLTF6IiBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjwvcGF0aD48L3N2Zz4=';
    const createDownloadLink = (url: string | undefined) => url ? `[![Download](${iconBase64Uri})](${url})` : '-';

    const downloadTable = versionHistory.slice(0, 20).map((entry) => {
      const platforms = entry.platforms;
      // Use image links, alignment is controlled by header separator
      return `| ${entry.version} | ${entry.date} | ${createDownloadLink(platforms['darwin-universal'])} | ${createDownloadLink(platforms['darwin-x64'])} | ${createDownloadLink(platforms['darwin-arm64'])} | ${createDownloadLink(platforms['win32-x64'])} | ${createDownloadLink(platforms['win32-arm64'])} | ${createDownloadLink(platforms['linux-x64'])} | ${createDownloadLink(platforms['linux-arm64'])} |`;
    }).join('\n');
    const newDownloadSection = `## Download Links for Previous Versions\n\n${tableHeader}\n${downloadTable}`;

// Update README content if changed
    const newTableContent = `${tableHeader}\n${downloadTable}`;
    
    // Update latest version details
    const latestVersion = versionHistory[0];
    const latestVersionContent = `
**Version:** ${latestVersion.version} (${latestVersion.date})

*   **macOS:** ${latestVersion.platforms['darwin-universal'] ? `[macOS Universal](${latestVersion.platforms['darwin-universal']})` : ''} | ${latestVersion.platforms['darwin-x64'] ? `[macOS Intel](${latestVersion.platforms['darwin-x64']})` : ''} | ${latestVersion.platforms['darwin-arm64'] ? `[macOS Apple Silicon](${latestVersion.platforms['darwin-arm64']})` : ''}
*   **Windows:** ${latestVersion.platforms['win32-x64'] ? `[Windows x64](${latestVersion.platforms['win32-x64']})` : ''} | ${latestVersion.platforms['win32-arm64'] ? `[Windows ARM64](${latestVersion.platforms['win32-arm64']})` : ''}
*   **Linux:** ${latestVersion.platforms['linux-x64'] ? `[Linux x64](${latestVersion.platforms['linux-x64']})` : ''} | ${latestVersion.platforms['linux-arm64'] ? `[Linux ARM64](${latestVersion.platforms['linux-arm64']})` : ''}
`;

    // Update both sections in README
    readmeContent = readmeContent.replace(/<!-- LATEST_VERSION_DETAILS_START -->[\s\S]*?<!-- LATEST_VERSION_DETAILS_END -->/g, `<!-- LATEST_VERSION_DETAILS_START -->\n${latestVersionContent}\n<!-- LATEST_VERSION_DETAILS_END -->`);
    readmeContent = readmeContent.replace(/<!-- TABLE_START -->[\s\S]*?<!-- TABLE_END -->/g, `<!-- TABLE_START -->\n${newTableContent}\n<!-- TABLE_END -->`);
    const newReadmeContent = `${readmeContent.trim()}\n`;
await fs.writeFile(readmePath, newReadmeContent);
console.log('README updated with new download links');
} catch (error) {
console.error('Error updating README:', error);
process.exit(1);
}
}

updateReadme();
