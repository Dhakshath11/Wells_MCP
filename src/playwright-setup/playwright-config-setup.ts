import * as fs from "fs";
import * as path from "path";


/**
 * Look for a file in given directories (recursively).
 * @param startDir Directory to start searching from
 * @param fileName File to look for
 * @returns Full path if found, otherwise null
 */
function findFile(startDir: string, fileName: string): string | null {
    // Get the list of files/folders inside startDir
    const entries = fs.readdirSync(startDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(startDir, entry.name);
        if (entry.isFile() && entry.name.toLocaleLowerCase() === fileName.toLocaleLowerCase()) {
            return fullPath; // File found
        }
        if (entry.isDirectory()) {
            const result = findFile(fullPath, fileName);
            if (result) return result; // bubble up result if found
        }
    }
    return null; // Not found
}

/**
 * Load content from file
 */
function getFileContent(filePath: string): string {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write to file
 */
function writeFile(filePath: string, doc: string) {
    fs.writeFileSync(filePath, doc, 'utf-8');
}

const addCapabilities = (doc: string): string => {
    const capabilitiesBlock: string = `
        const capabilities = {
            browserName: "Chrome",
            "LT:Options": {
                user: process.env.LT_USERNAME,
                accessKey: process.env.LT_ACCESS_KEY,
                name: "PW-TEST"
            },
        };
    `;
    if (!doc.includes('const capabilities')) { doc = doc + '\n' + capabilitiesBlock; }// To Appending capabilities block to the doc
    else {
        // Else replace the full capabilities block
        const regex = /const capabilities\s*=\s*{[\s\S]*?};/;
        return doc.replace(regex, capabilitiesBlock.trim());
    }
    return doc;
}

/**
 * Comment out project block in the doc & Add new Content
 */
const replaceProjectBlock = (doc: string): string => {
    const projectBlock: string = `
    {
      use: {
        connectOptions: {
          wsEndpoint: \`wss://cdp.lambdatest.com/playwright?capabilities=\${encodeURIComponent(JSON.stringify(capabilities))}\`
        },
      viewport: { width: 1280, height: 720 }
      }
    },
  `;

    // TODO: Add condition to check if above string already present & not commented out
    doc = doc.replace(
        /(projects\s*:\s*\[)([\s\S]*?)(\])/,
        (match, start, middle, end) => {
            // Comment out the old block
            const commentedOld = middle
                .split("\n")
                .map(line => (line.trim() ? `// ${line}` : line))
                .join("\n");

            return `${start}\n${commentedOld}\n${projectBlock}\n${end}`;
        }
        // Single Regex grouped by 3 brackets, 
        // Group1 -> (projects\s*:\s*\[) says projects<OPTIONAL_SPACE>:<OPTIONAL_SPACE>:>[ so that 'project:[', 'project: [', 'project : [' all are matched => start
        // Group2 -> ([\s\S]*?) says any content in between the brackets => middle
        // Group3 -> (\]) says ] => end
        // Group -> 'Group1, Group2, Group3' combined => match
    );

    return doc;
};


// TODO: function for to find & change => reporter: [['html', { open: "never" }]],

/**
 * Main function to setup playwright config
 */
function playwrightConfigSetup(): string {
    try {
        const filePath = findFile('.', 'playwright.config.js');  // Look for the file in the root directory and all subdirectories
        if (!filePath) throw new Error('playwright.config.js not found');

        let doc = getFileContent(filePath);
        doc = addCapabilities(doc);  // Post Adding capabilities block to the doc
        doc = replaceProjectBlock(doc);  // Post Adding capabilities block to the doc

        writeFile(filePath, doc);
        return doc;
    }
    catch (error: any) {
        throw new Error(`Error in playwrightConfigSetup: ${error.message}`);
    }
}

export { playwrightConfigSetup };