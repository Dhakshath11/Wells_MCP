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