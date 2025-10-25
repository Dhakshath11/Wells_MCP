/**
 * ignoreFileUpdater.ts
 *
 * Ensures that `.gitignore` or `.hyperexecuteignore` exists and contains
 * required ignore patterns for a clean project setup.
 *
 * Author: Dhakshath Amin
 * Date: 25 September 2025
 * Description: 
 * This utility checks for the presence of `.gitignore` or `.hyperexecuteignore`
 * in the current project. If neither exists, it creates `.hyperexecuteignore`.
 * It then validates that required entries (`node_modules/`, `.m2/`, `.gradle/`) 
 * are present. Missing entries are appended safely without duplications.
 * 
 * Key Features:
 * - Creates `.hyperexecuteignore` if no ignore file exists.
 * - Deduplicates ignore patterns (case-insensitive).
 * - Preserves existing file content and formatting.
 * - Writes back only when changes are required, avoiding redundant updates.
 */

/**
 * Ensure .gitignore or .hyperexecuteignore exists and contains required entries.
 */

import * as fileOps from "./fileOperations.js";
import logger from "./logger.js";
let ignoreFileSet = false; // module-level flag

const ignore = (): void => {
    const candidateFiles = [".gitignore", ".hyperexecuteignore"];
    let ignoreFilePath: string | null = null;
    let ignoreFile = "";

    // Step 1: find which ignore file exists
    for (const f of candidateFiles) {
        if (fileOps.fileExists(f)) {
            ignoreFilePath = f;
            ignoreFile = fileOps.getFileContent(f);
            break;
        }
    }

    logger.debug(`Ignore file selected: ${ignoreFilePath || ".hyperexecuteignore"}`);

    // Step 2: if none exists, create a .hyperexecuteignore
    if (!ignoreFilePath) {
        ignoreFilePath = ".hyperexecuteignore";
        fileOps.writeFile(ignoreFilePath, "");
        ignoreFile = "";
        logger.info("Created .hyperexecuteignore file");
    }

    // Step 3: normalize existing content into lines
    const existingLines = new Set(
        ignoreFile
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
    );

    // Step 4: required entries
    const requiredEntries = [
        "node_modules/",
        ".m2/",
        ".gradle/",
        "target"
    ];

    let updated = false;

    for (const entry of requiredEntries) {
        if (![...existingLines].some(line => line.toLowerCase() === entry.toLowerCase())) {
            existingLines.add(`**/${entry}`);
            updated = true;
            logger.debug(`Added ignore entry: **/${entry}`);
        }
    }

    // Step 5: write back only if updated
    if (updated) {
        const newContent = [...existingLines].join("\n") + "\n";
        fileOps.writeFile(ignoreFilePath, newContent);
        logger.info(`Updated ignore file: ${ignoreFilePath}`);
    }
};

export const UpdateIgnoreFile = (): void => {
    if (!ignoreFileSet) {
        logger.debug("Updating ignore file...");
        ignore();
        ignoreFileSet = true;
    }
}

export const resetIgnoreFlag = (): void => {
    ignoreFileSet = false;
    logger.debug("Ignore file flag reset.");
};