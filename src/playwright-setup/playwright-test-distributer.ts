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
import { FrameworkSpecAnalyzer } from '../server/tools/framework-spec.js';
import micromatch from 'micromatch';
import logger from "../commons/logger.js";

// Returns the test files that match the given test name or glob pattern.
//
// Example with:
//   const testFiles = ["tests/unit/login.spec.js", "tests/e2e/cart.test.ts"];
//
// Input (`testName`)        | Match? | Reason
// ------------------------- | ------ | -------------------------------
// "login.spec.js"           | ✅     | exact basename match
// "*.spec.js"               | ✅     | wildcard + matchBase works
// "*.test.ts"               | ✅     | matches second file
// "cart.*"                  | ✅     | matches cart.test.ts
// "*.py"                    | ❌     | no Python files
// "login"                   | ✅     | substring match in basename
// "tests/*/*"               | ✅     | matches both files
// "tests/*/*.spec.js"       | ✅     | matches login.spec.js
// "**/*.spec.js"            | ✅     | matches login.spec.js
/**
 * @param testName Pattern or Name of Test
 * @returns List of match test files
 * @throws Error if No tests found which match the pattern
 */
function does_TestExists(testName: string): string[] {
    try {
        const frameworkSpecAnalyzer: FrameworkSpecAnalyzer = new FrameworkSpecAnalyzer();
        const testFiles: string[] = frameworkSpecAnalyzer.getField("testFiles");

        // Using the mircomatch library to match the test name with the test files to handle patterns like *.spec.ts, test.*. 
        const matchedTestFiles: string[] = testFiles.filter(testFile =>
            micromatch.isMatch(testFile, testName, { matchBase: true, nocase: true, contains: true }));
        if (matchedTestFiles.length === 0) {
            logger.error(`No tests found which match the pattern "${testName}". Available tests: ${testFiles.join(", ")}`);
            throw new Error(`No tests found which match the pattern "${testName}". Available tests: ${testFiles.join(", ")}`);
        }
        logger.info(`Matched test files for pattern "${testName}": ${matchedTestFiles.join(", ")}`);
        return matchedTestFiles;
    }
    catch (error: any) {
        logger.error(`Error in does_TestExists: ${error.message}`);
        throw new Error(`${error.message}`);
    }
}

/**
 * Checks whether tests exist in the given directory & returns the relative path of the test directory.
 * 
 * - Throws an error if the directory does not exist.
 * - Throws an error if no test files are found under the directory.
 * - Returns relative path of the test directory if tests exist in the directory.
 * 
 * @param directory Directory path (relative to project root or absolute)
 * @returns true if tests exist in the given directory
 * @throws Error if directory not found or no tests in the directory
 */
function does_DirectoryHaveTests(directory: string): string {
    try {
        // Ensure directory exists on Repo
        const relativePathDir = fileOps.findFileRelativePathFolder('.', directory);
        if (!relativePathDir) {
            logger.error(`Directory "${directory}" does not exist. Please provide a valid directory.`);
            throw new Error(`Directory "${directory}" does not exist. Please provide a valid directory.`);
        }

        // Load test files from framework spec
        const frameworkSpecAnalyzer: FrameworkSpecAnalyzer = new FrameworkSpecAnalyzer();
        const testFiles: string[] = frameworkSpecAnalyzer.getField("testFiles");

        // Check if any test file is inside the given directory
        const found = testFiles.some(testFile => testFile.includes(directory));
        if (!found) {
            logger.error(`No tests found in directory "${directory}". Available tests: ${testFiles.join(", ")}`);
            throw new Error(
                `No tests found in directory "${directory}". Available tests: ${testFiles.join(", ")}`
            );
        }
        logger.info(`Found tests in directory "${directory}".`);
        return relativePathDir;
    } catch (error: any) {
        logger.error(`Error in does_DirectoryHaveTests: ${error.message}`);
        throw new Error(`${error.message}`);
    }
}

/**
 * Checks if any test file contains the given test tag inside `test.describe` or `test(...)`.
 *
 * @param testTag Tag string to search for in test descriptions
 * @returns true if at least one test contains the tag, throws an error otherwise
 */
function does_TestContainTag(testTag: string): boolean {
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
            logger.error(`No tests found which contain the tag "${testTag}". Available tests: ${testFiles.join(", ")}`);
            throw new Error(
                `No tests found which contain the tag "${testTag}". Available tests: ${testFiles.join(", ")}`
            );
        }
        logger.info(`Found tests containing tag "${testTag}".`);
        return true;
    } catch (error: any) {
        logger.error(`Error in does_TestContainTag: ${error.message}`);
        throw new Error(`Error checking test tags: ${error.message}`);
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
function playwrightTestDistributer_BySpecificTest(testFiles: string[]): string {
    const tests = testFiles.join(' ');
    logger.info(`Generated shell command for specific test distribution: ${tests}`);
    const finCommand = `echo ${tests} | tr ' ' '\\n'`
    logger.debug(`By SpecificTest: ${finCommand}`);
    return finCommand;
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
function playwrightTestDistributer_ByTest(testDir: string[]): string {
    logger.info(`Generated shell command for individual test distribution in directories: ${testDir.join(', ')}`);
    return `grep -nri 'test(' ${testDir.join(' ')} | sed -E 's/^([^:]+:[0-9]+):.*/\\1/' | sort -u`;
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
function playwrightTestDistributer_ByTestGroups(testDir: string[]): string {
    logger.info(`Generated shell command for test group distribution in directories: ${testDir.join(', ')}`);
    const finCommand = `grep -nri 'test.describe' ${testDir.join(' ')} | sed 's/:test.*//' | sort -u`;
    logger.debug(`By TestGroups: ${finCommand}`);
    return finCommand;
}

/**
 * Generates a shell command to run tests **filtered by tag or name**.
 * Uses Playwright’s `--grep` option.
 * Handles Multiple tags by adding '|' between them.
 * Example:
 *   npx playwright test --list --grep "@smoke" | awk '/:/{print $1}' | grep -vE 'Listing|Total' | sort -u 
 *   npx playwright test --list --grep "@smoke|@regression" | awk '/:/{print $1}' | grep -vE 'Listing|Total' | sort -u 
 * 
 * @param {string[]} tagName - Array of tags to filter tests.
 * @param {string} tagName - Tag or test name to filter tests.
 * @returns {string} - Shell command for filtered test execution.
 */
function playwrightTestDistributer_ByTagName(tagName: string[]): string {
    let testTag = tagName[0];
    // Add logic to handle multiple tags
    for (let i = 1; i < tagName.length; i++) {
        testTag = testTag + `|` + tagName[i];
    }
    testTag = `"${testTag}"`;
    logger.info(`Generated shell command for tag/name filtered test distribution: ${testTag}`);
    const finCommand = `npx playwright test --list --grep ${testTag} | awk '/:/{print $1}' | grep -vE 'Listing|Total' | sort -u`;
    logger.debug(`By TagName: ${finCommand}`);
    return finCommand;
}

export {
    does_TestExists,
    does_DirectoryHaveTests,
    does_TestContainTag,
    playwrightTestDistributer_BySpecificTest,
    playwrightTestDistributer_ByTest,
    playwrightTestDistributer_ByTestGroups,
    playwrightTestDistributer_ByTagName
};
