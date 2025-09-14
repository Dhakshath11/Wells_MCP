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
import * as downloadFile from '../resources/download-file.js';

/**
 * Replaces Playwright import statements in a test file with LambdaTest setup imports.
 * Comments out existing Playwright imports if present and not commented.
 * @param fileContent The content of the test file
 * @param fileToImport The relative path to the LambdaTest setup file
 * @returns Updated file content with correct import
 */
function replaceImportPaths(fileContent: string, fileToImport: string, language: string = 'javascript'): string {
    const importString = language === 'javascript' ? `const { test, expect } = require("${fileToImport}");` : `import { test, expect } from "${fileToImport}";`;

    // 1. Find if Import String is present in file & is not commented
    const lines = fileContent.split('\n');
    if (lines.some(line => line.includes(importString) && !line.trim().startsWith("//"))) {
        return fileContent; // Import String is present and not commented, no need to import again.
    }

    // 2. Find for any imports pointing to module @playwright/Test and comment it only if it is not commented out.
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (
            // Check for import of @playwright/test which is not commented out: Handles Named Import & ESM modules imports : Best For Typescript Files
            // Handles:
            // import { test, expect } from "@playwright/test";
            // import { test } from "@playwright/test";
            // import { test } from "@baseTest"; -> Custom files
            // import * as test, expect from "@playwright/test"; -> Named Import & ESM modules imports
            // import * as test, expect from "@baseTest"; -> Custom files

            (!trimmed.startsWith("//") &&
                trimmed.startsWith("import") &&
                trimmed.includes("from") &&
                /\b(test|expect)\b/.test(
                    trimmed.substring(
                        trimmed.indexOf("import"),
                        trimmed.indexOf("from"))))

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
 * Updates import paths in all provided test files to use LambdaTest setup for Javascript project
 * Finds the setup file, computes relative import, and rewrites each test file.
 * @param testFiles Array of test file paths to update
 */
async function updateImportPaths(testFiles: string[], language: string = 'javascript'): Promise<void> {
    try {
        if (testFiles.length === 0) throw new Error('No test files provided');

        let fileToImport: string | null = null;
        if (language === 'javascript') {
            await downloadFile.download_Lambdatest_Setup_File_JavaScript();
            fileToImport = fileOps.findFileRelativePath('.', 'lambdatest-setup.js'); // It is a JavaScript file : Wont have any Impact
            if (!fileToImport) throw new Error('lambdatest-setup.js file not found');
        }
        else {
            await downloadFile.download_Lambdatest_Setup_File_TypeScript();
            fileToImport = fileOps.findFileRelativePath('.', 'lambdatest-setup.ts'); // It is a TypeScript file : Wont have any Impact
            if (!fileToImport) throw new Error('lambdatest-setup.ts file not found');
        }

        for (const testFile of testFiles) {
            let fileContent = fileOps.getFileContent(testFile);
            const relativeImport = fileOps.getRelativeImport(testFile, fileToImport); // Get Relative path of import file with respect to test file
            if (fileContent) {
                fileContent = replaceImportPaths(fileContent, relativeImport.split('.ts')[0], language);
                fileOps.writeFile(testFile, fileContent);
            }
        }
    }
    catch (error: any) {
        throw new Error(`Error in update Import Paths: ${error.message}`);
    }
}

export { updateImportPaths };