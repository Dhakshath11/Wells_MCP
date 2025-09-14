/**
 * playwright-config-setup.ts
 *
 * Utility functions to update and configure Playwright test settings for LambdaTest HyperExecute integration.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Adds LambdaTest capabilities and updates the project block in playwright.config.js for cloud execution.
 */

import * as fileOps from '../commons/fileOperations.js';

/**
 * Adds or replaces the LambdaTest capabilities block in the Playwright config file.
 * @param doc The content of the Playwright config file
 * @returns Updated config file content with capabilities block
 */
const addCapabilities = (doc: string): string => {
    // const capabilitiesBlock: string = `
    //     const capabilities = {
    //         browserName: "Chrome",
    //         "LT:Options": {
    //             user: process.env.LT_USERNAME,
    //             accessKey: process.env.LT_ACCESS_KEY,
    //             name: "PW-TEST"
    //         },
    //     };
    // `;

    const capabilitiesBlock: string = `
    const capabilities = {
        browserName: "Chrome",
        browserVersion: "latest",
        "LT:Options": {
            platform: "MacOS Ventura", // specify platform
            user: process.env.LT_USERNAME,
            accessKey: process.env.LT_ACCESS_KEY,
            name: "PW-TEST",
            build: "Playwright Build 1"
        }
    };`;
    if (!doc.includes('const capabilities')) { doc = capabilitiesBlock + '\n' + doc; }// To Appending capabilities block to the doc
    else {
        // Else replace the full capabilities block
        const regex = /const capabilities\s*=\s*{[\s\S]*?};/;
        return doc.replace(regex, capabilitiesBlock.trim());
    }
    return doc;
}

/**
 * Comments out the existing project block and adds a new LambdaTest project block.
 * @param doc The content of the Playwright config file
 * @returns Updated config file content with new project block
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
    if (!doc.includes(projectBlock)) {
        // TODO: Add condition to check if above string already present & not commented out
        doc = doc.replace(
            /(projects\s*:\s*\[)([\s\S]*?)(\])/,
            (__match, start, middle, end) => {
                0
                // Comment out the old block
                const commentedOld = middle
                    .split("\n")
                    .map((line: string) => (line.trim() ? `// ${line}` : line))
                    .join("\n");

                return `${start}\n${commentedOld}\n${projectBlock}\n${end}`;
            }
            // Single Regex grouped by 3 brackets, 
            // Group1 -> (projects\s*:\s*\[) says projects<OPTIONAL_SPACE>:<OPTIONAL_SPACE>:>[ so that 'project:[', 'project: [', 'project : [' all are matched => start
            // Group2 -> ([\s\S]*?) says any content in between the brackets => middle
            // Group3 -> (\]) says ] => end
            // Group -> 'Group1, Group2, Group3' combined => match
        );
    }

    return doc;
};


// TODO: function for to find & change => reporter: [['html', { open: "never" }]],

/**
 * Main function to setup Playwright config for LambdaTest HyperExecute.
 * Finds the config file, updates capabilities and project block, and writes changes.
 * @returns The updated config file content
 */
function playwrightConfigSetup(): string {
    try {
        let filePath = fileOps.findFileRelativePath('.', 'playwright.config.js');  // Look for the file in the root directory and all subdirectories
        if (!filePath)
            filePath = fileOps.findFileRelativePath('.', 'playwright.config.ts'); // Look for the file in the root directory and all subdirectories
        if (!filePath) throw new Error('playwright.config.js or playwright.config.ts not found');

        let doc = fileOps.getFileContent(filePath);
        doc = addCapabilities(doc);  // Post Adding capabilities block to the doc
        doc = replaceProjectBlock(doc);  // Post Adding capabilities block to the doc

        fileOps.writeFile(filePath, doc);
        return doc;
    }
    catch (error: any) {
        throw new Error(`Error in playwrightConfigSetup: ${error.message}`);
    }
}

export { playwrightConfigSetup };