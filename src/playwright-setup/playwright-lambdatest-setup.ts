import * as fs from "fs";
import * as path from "path";

/**
 * Look for a file in given directories (recursively).
 * @param startDir Directory to start searching from
 * @param fileName File to look for
 * @returns Full path if found, otherwise null
 */
function findFileAbsolutePath(startDir: string, fileName: string): string | null {
    // Get the list of files/folders inside startDir
    const entries = fs.readdirSync(startDir, { withFileTypes: true });

    for (const entry of entries) {
        // const fullPath = path.join(startDir, entry.name);
        const fullPath = path.resolve(startDir, entry.name);  // resolve: Absolute path
        if (entry.isFile() && entry.name.toLocaleLowerCase() === fileName.toLocaleLowerCase()) {
            console.log("File found: " + fullPath);
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

function replaceImportPaths(fileContent: string, fileToImport: string): string {
    const importString = `import { test, expect } from "${fileToImport}";`;

    // 1. Find if Import String is present in file & is not commented
    const lines = fileContent.split('\n');
    if (lines.some(line => line.includes(importString) && !line.trim().startsWith("//"))) {
        return fileContent; // Import String is present and not commented, no need to import again.
    }

    // 2. Find for any imports pointing to module @playwright/Test and comment it only if it is not commented out.
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (
            !trimmed.startsWith("//") &&
            trimmed.startsWith("import") &&
            trimmed.includes('"@playwright/test"')
        ) {
            lines[i] = "// " + lines[i];
        }
    }

    // 3. Replace the import string with the new one in first line
    lines.unshift(importString);
    fileContent = lines.join('\n');
    return fileContent;

}


function updateImportPaths(testFiles: string[]): void {
    try {
        if (testFiles.length === 0) throw new Error('No test files provided');

        const fileToImport = findFileAbsolutePath('.', 'lambdatest-setup.js'); // It is a JavaScript file : Wont have any Impact
        if (!fileToImport) throw new Error('lambdatest-setup.js file not found');

        for (const testFile of testFiles) {
            let fileContent = getFileContent(testFile);
            if (fileContent) {
                fileContent = replaceImportPaths(fileContent, fileToImport);
                writeFile(testFile, fileContent);
            }
        }
    }
    catch (error: any) {
        throw new Error(`Error in updateImportPaths: ${error.message}`);
    }
}

export { updateImportPaths };