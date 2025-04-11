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
    // Use Base64 encoded SVG Data URI for potentially better compatibility
    const iconBase64Uri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMTYgMTYiPjxwYXRoIGQ9Ik0uNSA5LjlhLjUuNSAwIDAgMSAuNS41djIuNWExIDEgMCAwIDAgMSAxaDEyYTEgMSAwIDAgMCAxLTF2LTIuNWEuNS41IDAgMCAxIDEgMHYyLjVhMiAyIDAgMCAxLTIgMkgxYTIgMiAwIDAgMS0yLTJ2LTIuNWEuNS41IDAgMCAxIC41LS41eiIvPjxwYXRoIGQ9Ik03LjY0NiAxMS44NTRhLjUuNSAwIDAgMCAuNzA4IDBsMy0zYS41LjUgMCAwIDAtLjcwOC0uNzA4TDguNSAxMC4yOTNWMS41YS41LjUgMCAwIDAtMSAwdjguNzkzTDUuMzU0IDguMTQ2YS41LjUgMCAxIDAtLjcwOC43MDhsMyAzeiIvPjwvc3ZnPg==';
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
