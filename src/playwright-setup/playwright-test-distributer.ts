/**
 * playwright-test-distributor.ts
 *
 * Utility functions to discover and distribute Playwright tests in a project.
 *
 * Author: Dhakshath Amin
 * Date: 10 September 2025
 * Description:
 * Provides helpers to determine the test directory, generate shell commands for
 * test discovery by individual tests, test groups, or tags/names. These commands
 * can be used in MCP server tools or local scripts to efficiently locate and run tests.
 */

import * as fileOps from '../commons/fileOperations.js';
import { FrameworkSpecAnalyzer } from '../server/tools/framework-spec';

/**
 * Checks whether tests exist in the given directory & return the relative path of the test directory.
 * 
 * - Throws an error if the directory does not exist.
 * - Throws an error if no test files are found under the directory.
 * - Returns relative path of the test directory if tests exist in the directory.
 * 
 * @param directory Directory path (relative to project root or absolute)
 * @returns true if tests exist in the given directory
 * @throws Error if directory not found or no tests in the directory
 */
function testExistsInDirectory(directory: string): string {
    try {
        // Ensure directory exists on Repo
        const relativePathDir = fileOps.findFileRelativePathFolder('.', directory);
        if (!relativePathDir) {
            throw new Error(`Directory "${directory}" does not exist. Please provide a valid directory.`);
        }

        // Load test files from framework spec
        const frameworkSpecAnalyzer: FrameworkSpecAnalyzer = new FrameworkSpecAnalyzer();
        const testFiles: string[] = frameworkSpecAnalyzer.getField("testFiles");

        // Check if any test file is inside the given directory
        const found = testFiles.some(testFile => testFile.includes(directory));
        if (!found) {
            throw new Error(
                `No tests found in directory "${directory}". Available tests: ${testFiles.join(", ")}`
            );
        }
        return relativePathDir;
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

/**
 * Generates a shell command to discover **individual test cases** in the test directory.
 * - Uses `grep` to find lines containing `test(`.
 * - Extracts `file:line` locations.
 * - Sorts and removes duplicates.
 *
 * @returns {string} - Shell command for test discovery.
 * @throws {Error} If test discovery fails.
 */
function playwrightTestDistributer_ByTest(testDir: string): string {
    return `grep -nri 'test(' ${testDir} | sed -E 's/^([^:]+:[0-9]+):.*/\\1/' | sort -u`;
}

/**
 * Generates a shell command to discover **test groups** in the test directory.
 * - Looks for lines containing `test.describe`.
 * - Extracts file paths, removing test lines.
 * - Sorts and removes duplicates.
 *
 * @returns {string} - Shell command for test group discovery.
 * @throws {Error} If test group discovery fails.
 */
function playwrightTestDistributer_ByTestGroups(testDir: string): string {
    return `grep -nri 'test.describe' ${testDir} | sed 's/:test.*//' | sort -u`;
}

/**
 * Checks if any test file contains the given test tag inside `test.describe` or `test(...)`.
 *
 * @param testTag Tag string to search for in test descriptions
 * @returns true if at least one test contains the tag, throws an error otherwise
 */
function tagsExistsInTest(testTag: string): boolean {
    try {
        const frameworkSpecAnalyzer: FrameworkSpecAnalyzer = new FrameworkSpecAnalyzer();
        const testFiles: string[] = frameworkSpecAnalyzer.getField("testFiles");

        const found = testFiles.some(testFile => {
            const testFileContent = fileOps.getFileContent(testFile);
            const regex = /test(?:\.describe)?\(\s*(['"`])(.+?)\1/gi; // case-insensitive & global
            let match;

            while ((match = regex.exec(testFileContent)) !== null) {
                const description = match[2]; // string inside test(...) or test.describe(...)
                if (description.toLowerCase().includes(testTag.toLowerCase())) {
                    return true;
                }
            }
            return false;
        });

        if (!found) {
            throw new Error(
                `No tests found which contain the tag "${testTag}". Available tests: ${testFiles.join(", ")}`
            );
        }

        return true;
    } catch (error: any) {
        throw new Error(`Error checking test tags: ${error.message}`);
    }
}


/**
 * Generates a shell command to run tests **filtered by tag or name**.
 * Uses Playwright’s `--grep` option.
 *
 * @param {string} tagName - Tag or test name to filter tests.
 * @returns {string} - Shell command for filtered test execution.
 */
function playwrightTestDistributer_ByTagName(tagName: string): string {
    return `npx playwright test --list --grep ${tagName} | awk '/:/{print $1}' | grep -vE 'Listing|Total' | sort -u`
}

export {
    testExistsInDirectory,
    tagsExistsInTest,
    playwrightTestDistributer_ByTest,
    playwrightTestDistributer_ByTestGroups,
    playwrightTestDistributer_ByTagName
};
