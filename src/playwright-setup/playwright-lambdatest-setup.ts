/**
 * playwright-lambdatest-setup.ts
 *
 * Utility functions to update import paths in Playwright test files for LambdaTest integration.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Replaces Playwright imports with LambdaTest setup imports and comments out conflicting imports.
 */

import * as fileOps from '../commons/fileOperations.js';

/**
 * Replaces Playwright import statements in a test file with LambdaTest setup imports.
 * Comments out existing Playwright imports if present and not commented.
 * @param fileContent The content of the test file
 * @param fileToImport The relative path to the LambdaTest setup file
 * @returns Updated file content with correct import
 */
function replaceImportPaths(fileContent: string, fileToImport: string): string {
    //const importString = `import { test, expect } from "${fileToImport}";`;  //TODO: Go for this line if Tests are TS files
    const importString = `const { test, expect } = require("${fileToImport}");`;  // Support JS test files

    // 1. Find if Import String is present in file & is not commented
    const lines = fileContent.split('\n');
    if (lines.some(line => line.includes(importString) && !line.trim().startsWith("//"))) {
        return fileContent; // Import String is present and not commented, no need to import again.
    }

    // 2. Find for any imports pointing to module @playwright/Test and comment it only if it is not commented out.
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (
            // Check for import of @playwright/test which is not commented out: Handles Named Import & ESM modules imports
            (!trimmed.startsWith("//") &&
                trimmed.startsWith("import") &&
                trimmed.includes('"@playwright/test"'))

            ||

            // Check for commonjs require of @playwright/test which is not commented out: Handles CommonJS modules imports
            // Example: const { test } = require('@playwright/test');
            (!trimmed.startsWith("//") &&
                trimmed.includes("require") &&
                (trimmed.toLowerCase().includes('test') || trimmed.toLowerCase().includes('expect')) &&
                (trimmed.toLowerCase().includes('lambdatest') || trimmed.includes('playwright')))

        ) {
            lines[i] = "// " + lines[i];
        }
    }

    // 3. Replace the import string with the new one in first line
    lines.unshift(importString);
    fileContent = lines.join('\n');
    return fileContent;
}


/**
 * Updates import paths in all provided test files to use LambdaTest setup.
 * Finds the setup file, computes relative import, and rewrites each test file.
 * @param testFiles Array of test file paths to update
 */
function updateImportPaths(testFiles: string[]): void {
    try {
        if (testFiles.length === 0) throw new Error('No test files provided');

        const fileToImport = fileOps.findFileRelativePath('.', 'lambdatest-setup.js'); // It is a JavaScript file : Wont have any Impact
        if (!fileToImport) throw new Error('lambdatest-setup.js file not found');

        for (const testFile of testFiles) {
            let fileContent = fileOps.getFileContent(testFile);
            const relativeImport = fileOps.getRelativeImport(testFile, fileToImport); // Get Relative path of import file with respect to test file
            if (fileContent) {
                fileContent = replaceImportPaths(fileContent, relativeImport);
                fileOps.writeFile(testFile, fileContent);
            }
        }
    }
    catch (error: any) {
        throw new Error(`Error in update Import Paths: ${error.message}`);
    }
}

export { updateImportPaths };