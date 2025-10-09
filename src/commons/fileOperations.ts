/**
 * fileOperations.ts
 *
 * Utility functions for file reading, writing, and recursive search operations.
 *
 * Author: Dhakshath Amin
 * Date: 5 September 2025
 * Description: Provides helpers to load, write, and locate files in a directory tree, supporting both absolute and relative path results.
 */

import * as fs from "fs";
import * as path from "path";
import logger from "./logger.js";

/**
 * Checks if a file exists.
 * @param filePath Path to the file
 * @returns True if file exists, false otherwise
 */
function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

/**
 * Load content from a file as a string.
 * Throws an error if the file does not exist.
 * @param filePath Path to the file
 * @returns File content as string
 */
function getFileContent(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        logger.error(`File ${filePath} does not exist`);
        throw new Error(`File ${filePath} does not exist`);
    }
    logger.info(`Read file: ${filePath}`);
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write a string to a file, overwriting if it exists. Also,before writting create the file or folder if it does not exists.
 * @param filePath Path to the file
 * @param doc Content to write
 */
function writeFile(filePath: string, doc: string) {
    const dir = path.dirname(filePath);
    if (!fileExists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
    fs.writeFileSync(filePath, doc, 'utf-8');
    logger.info(`Wrote file: ${filePath}`);
}

/**
 * Recursively search for a file by name in a directory tree.
 * Returns the absolute path of the first match found (case-insensitive).
 * @param startDir Directory to start searching from
 * @param fileName File to look for
 * @returns Absolute path if found, otherwise null
 */
function findFileAbsolutePath(startDir: string, fileName: string): string | null {
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.resolve(startDir, entry.name);  // resolve: Absolute path
        if (entry.isFile() && entry.name.toLocaleLowerCase() === fileName.toLocaleLowerCase()) {
            logger.info(`Found file (absolute): ${fullPath}`);
            return fullPath; // File found
        }
        if (entry.isDirectory()) {
            const result = findFileAbsolutePath(fullPath, fileName);
            if (result) return result; // bubble up result if found
        }
    }
    return null; // Not found
}

/**
 * Recursively search for a file by name in a directory tree.
 * Returns the relative path of the first match found (case-insensitive).
 * @param startDir Directory to start searching from
 * @param fileName File to look for
 * @returns Relative path if found, otherwise null
 */
function findFileRelativePath(startDir: string, fileName: string): string | null {
    logger.info(`Will skip searching in these files: node_modules, .git, dist, build}`);
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(startDir, entry.name);
        if (entry.isFile() && entry.name.toLocaleLowerCase() === fileName.toLocaleLowerCase()) {
            logger.info(`Found file (relative): ${fullPath}`);
            return fullPath; // File found
        }
        if (entry.isDirectory()) {
            // 🚫 Skip unwanted directories
            if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
                continue;
            }

            const result = findFileRelativePath(fullPath, fileName);
            if (result) return result; // bubble up result if found
        }
    }
    return null; // Not found
}

/**
 * Recursively search for a Folder by name in a directory tree.
 * Returns the relative path of the first match found (case-insensitive).
 * @param startDir Directory to start searching from
 * @param fileName File to look for
 * @returns Relative path if found, otherwise null
 */
function findFileRelativePathFolder(startDir: string, fileName: string): string | null {
    logger.info(`Will skip searching in these files: node_modules, .git, dist, build}`);
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(startDir, entry.name);
        if ((fullPath.toLocaleLowerCase().trim() === fileName.toLocaleLowerCase().trim())
            || (entry.name.toLocaleLowerCase().trim() === fileName.toLocaleLowerCase().trim())) {
            logger.info(`Found folder (relative): ${fullPath}`);
            return fullPath; // File found
        }
        if (entry.isDirectory()) {
            // 🚫 Skip unwanted directories
            if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
                continue;
            }

            const result = findFileRelativePathFolder(fullPath, fileName);
            if (result) return result; // bubble up result if found
        }
    }
    return null; // Not found
}

/**
 * Deletes a file if it exists.
 * @param filePath Path to the file to delete
 */
function deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted file: ${filePath}`);
    }
}

/**
 * Deletes a specific folder and all its contents if it exists.
 * @param folderPath Path to the folder to delete
 */
function deleteFolder(folderPath: string): void {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        logger.info(`Deleted folder: ${folderPath}`);
    }
}


/**
 * Computes the relative import path from a test file to a setup file.
 * Ensures the path is valid for both Unix and Windows environments.
 * @param testFile Path to the test file
 * @param setupFile Path to the setup file
 * @returns Relative import path as a string
 */
function getRelativeImport(testFile: string, setupFile: string): string {
    logger.debug(`Computing relative import from ${testFile} to ${setupFile}`);
    const testDir = path.dirname(testFile);
    let relPath = path.relative(testDir, setupFile);
    if (!relPath.startsWith(".")) {
        relPath = "./" + relPath;
    }
    logger.debug(`Computed relative import from ${testFile} to ${setupFile}: ${relPath.replace(/\\/g, "/")}`);
    return relPath.replace(/\\/g, "/"); // for Windows paths
}

export {
    fileExists,
    getFileContent,
    writeFile,
    findFileAbsolutePath,
    findFileRelativePath,
    deleteFile,
    deleteFolder,
    getRelativeImport,
    findFileRelativePathFolder
};