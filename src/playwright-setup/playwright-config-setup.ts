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
import logger from "../commons/logger.js";

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
    logger.debug(`Playwright capabilities: ${capabilitiesBlock}`);
    if (!doc.includes('const capabilities')) {
        doc = capabilitiesBlock + '\n' + doc;
        logger.info('Appended LambdaTest capabilities block to Playwright config.');
    } else {
        // Else replace the full capabilities block
        const regex = /const capabilities\s*=\s*{[\s\S]*?};/;
        logger.info('Replaced existing capabilities block in Playwright config.');
        return doc.replace(regex, capabilitiesBlock.trim());
    }
    return doc;
}

/**
 * Replaces the existing `projects` array in a Playwright config file with a LambdaTest project block.
 * - Comments out the old projects.
 * - Adds a new LambdaTest project configuration.
 * - If the `projects` array does not exist, it will create it at the end.
 * - Safely handles:
 *    - Nested brackets inside objects or arrays
 *    - Strings containing brackets (single, double, or backticks)
 *    - Single-line (`//`) and multi-line (`* ... *`) comments
 * - Prevents duplicate insertion if the LambdaTest block already exists.
 * 
 * @param doc The content of the Playwright config file as a string
 * @returns The updated config content as a string
 */
const replaceProjectBlock = (doc: string): string => {
    const projectBlock = `
  {
    use: {
      connectOptions: {
        wsEndpoint: \`wss://cdp.lambdatest.com/playwright?capabilities=\${encodeURIComponent(JSON.stringify(capabilities))}\`
      },
      viewport: { width: 1280, height: 720 }
    }
  },
  `;

    logger.debug(`CDP endpoint: ${projectBlock}`);

    // Skip if the block is already present
    if (doc.includes(projectBlock)) {
        logger.debug('LambdaTest project block already present in Playwright config.');
        return doc;
    }

    const chars = doc.split("");
    let startIndex = -1;
    let bracketStack: string[] = [];
    let inString: string | null = null;
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let i = 0;

    // Find "projects" property start
    while (i < chars.length) {
        if (!inString && !inSingleLineComment && !inMultiLineComment) {
            const remaining = doc.slice(i);
            const match = remaining.match(/projects\s*:/i);
            if (match) {
                startIndex = i + match.index! + match[0].length;
                // Skip to first [
                while (chars[startIndex] !== "[" && startIndex < chars.length) startIndex++;
                bracketStack.push("[");
                i = startIndex + 1;
                break;
            }
        }
        i++;
    }

    if (startIndex === -1) {
        // Not found, append at end
        logger.info('Appended LambdaTest project block to end of Playwright config.');
        return doc + "\nprojects: [" + projectBlock + "],\n";
    }

    let endIndex = startIndex + 1;
    while (endIndex < chars.length && bracketStack.length > 0) {
        const c = chars[endIndex];

        // Handle string start/end
        if (!inString && !inSingleLineComment && !inMultiLineComment && (c === '"' || c === "'" || c === "`")) {
            inString = c;
        } else if (inString === c && chars[endIndex - 1] !== "\\") {
            inString = null;
        }
        // Handle comments
        else if (!inString && !inMultiLineComment && c === "/" && chars[endIndex + 1] === "/") {
            inSingleLineComment = true;
            endIndex++;
        } else if (!inString && !inSingleLineComment && c === "/" && chars[endIndex + 1] === "*") {
            inMultiLineComment = true;
            endIndex++;
        } else if (inSingleLineComment && c === "\n") {
            inSingleLineComment = false;
        } else if (inMultiLineComment && c === "*" && chars[endIndex + 1] === "/") {
            inMultiLineComment = false;
            endIndex++;
        }

        // Count brackets only if not inside string/comment
        if (!inString && !inSingleLineComment && !inMultiLineComment) {
            if (c === "[") bracketStack.push("[");
            else if (c === "]") bracketStack.pop();
        }

        endIndex++;
    }

    // Comment out old block
    const oldBlock = doc.slice(startIndex + 1, endIndex - 1);
    const commentedOld = oldBlock
        .split("\n")
        .map(line => (line.trim() ? "// " + line : line))
        .join("\n");

    const updatedDoc = doc.slice(0, startIndex + 1) + "\n" + commentedOld + "\n" + projectBlock + doc.slice(endIndex - 1);
    logger.info('Replaced existing projects block with LambdaTest project block in Playwright config.');
    return updatedDoc;
}

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
        logger.info(`Playwright config updated for LambdaTest integration: ${filePath}`);
        return doc;
    }
    catch (error: any) {
        logger.error('Error in playwrightConfigSetup', error);
        throw new Error(`Error in playwrightConfigSetup: ${error.message}`);
    }
}

export { playwrightConfigSetup };