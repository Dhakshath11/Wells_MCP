import { exec, execSync } from "child_process";
import { error } from "console";
import util from "util";

const execAsync = util.promisify(exec);

export const getFeatureFiles = (): string => {
    try {
        const stdout = execSync("./snooper --featureFilePaths=. --frameWork=java", {
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
    try {
        const stdout = execSync(`./snooper --featureFilePaths=. --frameWork=java --specificTags=${tags}`, {
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