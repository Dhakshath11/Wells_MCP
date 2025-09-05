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

/**
 * Load content from a file as a string.
 * Throws an error if the file does not exist.
 * @param filePath Path to the file
 * @returns File content as string
 */
function getFileContent(filePath: string): string {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write a string to a file, overwriting if it exists.
 * @param filePath Path to the file
 * @param doc Content to write
 */
function writeFile(filePath: string, doc: string) {
    fs.writeFileSync(filePath, doc, 'utf-8');
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
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(startDir, entry.name);
        if (entry.isFile() && entry.name.toLocaleLowerCase() === fileName.toLocaleLowerCase()) {
            return fullPath; // File found
        }
        if (entry.isDirectory()) {
            const result = findFileRelativePath(fullPath, fileName);
            if (result) return result; // bubble up result if found
        }
    }
    return null; // Not found
}

function deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

export {
    getFileContent,
    writeFile,
    findFileAbsolutePath,
    findFileRelativePath,
    deleteFile
};