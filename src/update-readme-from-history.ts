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
    const tableHeader = '| Version | Date | macOS Universal | macOS Intel | macOS Apple Silicon | Windows x64 | Windows ARM64 | Linux x64 | Linux ARM64 |\n|---|---|---|---|---|---|---|---|---|';
    const downloadTable = versionHistory.slice(0, 10).map((entry) => {
      const platforms = entry.platforms;
      return `| ${entry.version} | ${entry.date} | 
        [Download](${platforms['darwin-universal']}) | 
        [Download](${platforms['darwin-x64']}) | 
        [Download](${platforms['darwin-arm64']}) | 
        [Download](${platforms['win32-x64']}) | 
        [Download](${platforms['win32-arm64']}) | 
        [Download](${platforms['linux-x64']}) | 
        [Download](${platforms['linux-arm64']}) |`;
    }).join('\n');
    const newDownloadSection = `## Download Links for Previous Versions\n\n${tableHeader}\n${downloadTable}`;

// Update README content if changed
// Remove existing table content between TABLE_START and TABLE_END markers
readmeContent = readmeContent.replace(/<!-- TABLE_START -->[\s\S]*?<!-- TABLE_END -->/g, `<!-- TABLE_START -->\n${downloadTable}\n<!-- TABLE_END -->`);
const newReadmeContent = `${readmeContent.trim()}\n`;
await fs.writeFile(readmePath, newReadmeContent);
console.log('README updated with new download links');
} catch (error) {
console.error('Error updating README:', error);
process.exit(1);
}
}

updateReadme();
