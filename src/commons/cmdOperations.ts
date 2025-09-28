/**
 * cmdOperations.ts
 *
 * Utility functions for executing shell commands and discovering test files in Java/BDD frameworks.
 *
 * Author: Dhakshath Amin
 * Date: 27 September 2025
 * Description:
 * Provides wrappers around the `snooper` binary and shell commands to:
 *   - Discover feature files in Java projects
 *   - Filter feature files by tags
 *   - Find files or folders matching patterns
 *
 * Key Features:
 * - Uses child_process execSync for synchronous command execution
 * - Handles errors gracefully and returns clean output
 * - Escapes shell input for safety
 * - Designed for use in LambdaTest/HyperExecute automation tools
 */

import { exec, execSync } from "child_process";
import util from "util";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const execAsync = util.promisify(exec);

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to snooper inside node_modules/@dhakshath11/mcp-server/bin
const snooperPath = join(__dirname, "..", "..", "bin", "snooper");

export const getFeatureFiles = (): string => {
/**
 * Discover all feature files in the current directory for Java frameworks.
 * Uses the `snooper` binary to scan for `.feature` files.
 *
 * @returns {string} Newline-separated list of feature file paths.
 * @throws {Error} If the snooper binary fails or is missing.
 */
    try {
        const stdout = execSync(`${snooperPath} --featureFilePaths=. --frameWork=java`, {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"] // silence errors
        });
        return stdout;
    }
    catch (error: any) {
        throw new Error(`Error while executing snooper binary ${error.message}`)
    }
}

export const getFeatureFilesForTags = (tags: string): string => {
/**
 * Discover feature files matching specific tags in the current directory for Java frameworks.
 * Uses the `snooper` binary with the `--specificTags` option.
 *
 * @param {string} tags - Comma-separated list of tags to filter feature files.
 * @returns {string} Newline-separated list of matching feature file paths.
 * @throws {Error} If the snooper binary fails or is missing.
 */
    try {
        const stdout = execSync(`${snooperPath} --featureFilePaths=. --frameWork=java --specificTags=${tags}`, {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"] // silence errors
        });
        return stdout.trim();
    }
    catch (error: any) {
        throw new Error(`Error while executing snooper binary ${error.message}`)
    }
}

/**
 * Discover files based on a single input.
 * Input can be:
 * 1. A folder path
 * 2. A specific file path or file name
 * 3. A pattern (e.g., *.feature)
 */
export const findCommand = (INPUT: string): string => {
/**
 * Discover files or folders based on a single input.
 * Input can be:
 *   1. A folder path
 *   2. A specific file path or file name
 *   3. A pattern (e.g., *.feature)
 * Uses shell find command for flexible discovery.
 *
 * @param {string} INPUT - The folder, file, or pattern to search for.
 * @returns {string} Newline-separated list of matching file paths.
 * @throws {Error} If the find command fails or input is invalid.
 */
    try {
        // Escape double quotes for shell safety
        const escapedInput = INPUT.replace(/"/g, '\\"');

        // Build the command
        const cmd = `[ -d "${escapedInput}" ] && find "${escapedInput}" -type f || find . -type f \\( -path "${escapedInput}" -o -name "$(basename "${escapedInput}")" -o -name "${escapedInput}" \\)`;

        // Execute the command
        const stdout = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });

        // Split into array, remove empty lines, and trim
        return stdout.trim();
    } catch (error: any) {
        throw new Error(`Error while executing find command: ${error.message}`);
    }
};