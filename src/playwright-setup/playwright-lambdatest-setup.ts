import * as fileOps from '../commons/fileOperations.js';

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

        const fileToImport = fileOps.findFileAbsolutePath('.', 'lambdatest-setup.js'); // It is a JavaScript file : Wont have any Impact
        if (!fileToImport) throw new Error('lambdatest-setup.js file not found');

        for (const testFile of testFiles) {
            let fileContent = fileOps.getFileContent(testFile);
            if (fileContent) {
                fileContent = replaceImportPaths(fileContent, fileToImport);
                fileOps.writeFile(testFile, fileContent);
            }
        }
    }
    catch (error: any) {
        throw new Error(`Error in updateImportPaths: ${error.message}`);
    }
}

export { updateImportPaths };