/**
 * framework-spec.ts
 * 
 * Parses and normalizes analysis output from hyperexecute-analyze.log.
 *
 * Author: Dhakshath Amin
 * Date: 2 September 2025
 * Description: Provides utilities to extract language, runtime, package manager, test frameworks, and other metadata from analysis logs.
 */

import * as fs from "fs";
import { framework_comp } from "../../commons/framework_comp.js";
import * as cmd from "../../commons/cmdOperations.js";
import logger from "../../commons/logger.js";

/**
 * Describes the structure of the parsed analysis output.
 */
interface AnalysisOutput {
    language: string;
    runtimeVersion: string;
    packageManager: string | null;
    packageManagerVersion: string | null;
    testFrameworks: string[];
    privateRegistry: string[];
    privateEndpoints: string[];
    inaccessibleURLs: string[];
    externalReporters: string[];
    testFiles: string[];
}

/**
 * Framework Specification Analyzer Class
 * Provides reusable methods for parsing and analyzing framework specifications
 */
class FrameworkSpecAnalyzer {
    private logFilePath: string;
    private cachedOutput: AnalysisOutput | null = null;

    constructor(logFilePath: string = "hyperexecute-analyze.log") {
        this.logFilePath = logFilePath;
    }

    /**
     * Reads the last line from a file.
     * Throws an error if the file does not exist.
     * @param filePath Path to the file
     * @returns Last line of the file as a string
     */
    private getLastLine(filePath: string): string {
        if (!fs.existsSync(filePath)) {
            logger.error(`File ${filePath} does not exist`);
            throw new Error(`File ${filePath} does not exist`);
        }
        const data = fs.readFileSync(filePath, "utf-8");
        const lines = data.trim().split("\n");
        logger.info(`Read last line from ${filePath}`);
        logger.debug(`As per hyper_log file: ${lines[lines.length - 1]}`);
        return lines[lines.length - 1];
    }

    /**
     * Normalizes the runtime version string.
     * Extracts version number for Java, otherwise trims the string.
     * @param runtimeStr Raw runtime version string
     * @returns Normalized runtime version
     */
    private normalizeRuntimeVersion(runtimeStr: string): string {
        const match = runtimeStr.match(/v?(\d+(?:\.\d+){0,2})/);
        return match ? match[1].trim() : runtimeStr.trim();
    }

    /**
     * Extracts framework names from the frameworks string.
     * Handles both Java (name before '->') and JS/TS (package@version).
     * @param frameworksStr Raw frameworks string
     * @returns Array of framework names
     */
    private normalizeFrameworks(frameworksStr: string): string[] {
        const frameworks: string[] = [];
        const regex = /(\w+)\s*->|([\w-]+@[\d\w\.\^\-]+)/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(frameworksStr)) !== null) {
            if (match[1]) {
                // Java: before "->"
                frameworks.push(match[1]);
            } else if (match[2]) {
                // JS/TS: full package@version
                frameworks.push(match[2]);
            }
        }
        return frameworks;
    }

    /**
     * Extracts a list of values from a log message for a given field.
     * Example: PrivateRegistry:[url1 url2]
     * @param msg Log message string
     * @param field Field name to extract
     * @returns Array of values for the field
     */
    private extractList(msg: string, field: string): string[] {
        const regex = new RegExp(`${field}:\\[([^\\]]*)\\]`);
        const match = msg.match(regex);
        if (!match) return [];
        return match[1].split(" ").map(f => f.trim()).filter(Boolean);
    }

    /**
     * Extracts test file paths from the log message.
     * @param msg Log message string
     * @returns Array of test file paths
     */
    private extractTestFiles(msg: string): string[] {
        const regex = /TestFiles:\[([^\]]*)\]/;
        const match = msg.match(regex);
        if (!match) return [];

        const files = match[1].split(" ").map(f => f.trim()).filter(Boolean);
        return files;
    }

    /**
     * Retrieves a list of test frameworks based on the provided package manager and log match results.
     *
     * This method first normalizes any frameworks found in the log match. If the package manager is Maven or Gradle,
     * or if no frameworks were found in the log, it extracts frameworks based on the package manager.
     * The final result is a deduplicated array combining both sources.
     *
     * @param packageManager - The name of the package manager (e.g., "maven", "gradle").
     * @param testFrameworksMatch - The RegExp match array containing framework information from logs, or null if not available.
     * @returns An array of unique test framework names relevant to the project.
     */
    private getTestFrameworks(packageManager: string, testFrameworksMatch: RegExpMatchArray | null): string[] {
        logger.debug(`Getting test frameworks for ${packageManager} & ${testFrameworksMatch}`);
        const safePM = packageManager?.trim().toLowerCase() ?? "";
        let testFrameworks: string[] = [];

        // Extract frameworks from log if present
        const normalized = testFrameworksMatch ? this.normalizeFrameworks(testFrameworksMatch[1]) : [];
        logger.debug(`Normalized frameworks: ${normalized}`);

        // Always extract frameworks from the package manager if known
        const pmFrameworks = framework_comp(safePM);
        logger.debug(`Frameworks from package manager: ${pmFrameworks}`);

        // Merge & dedupe if both exist
        testFrameworks = Array.from(new Set([...normalized, ...pmFrameworks]));
        logger.debug(`Test frameworks: ${testFrameworks}`);
        return testFrameworks;
    }

    /**
     * Retrieves a list of test files for the project, with special handling for Karate frameworks.
     *
     * This method first extracts test files from the provided log message. If the detected frameworks include "karate",
     * it executes the `snooper` command synchronously to collect `.feature` file paths associated with Karate tests.
     * The results from both sources (log extraction and snooper) are merged and deduplicated to ensure a clean list
     * of unique test files.
     *
     * @param msg - The raw log message string containing test execution details.
     * @param testFrameworks - An array of detected test frameworks (e.g., ["junit", "karate"]).
     * @returns A unique array of test file paths relevant to the project.
     */
    private getTestFiles(msg: string, testFrameworks: string[]): string[] {
        let testFiles = this.extractTestFiles(msg);
        if (testFrameworks.some(f => f.toLowerCase().includes("karate"))) {
            try {
                logger.info(`Detected Karate framework, running snooper for .feature files.`);
                const stdout = cmd.getFeatureFiles();
                const karateFiles = stdout.split("\n").map(f => f.trim()).filter(Boolean);
                testFiles = Array.from(new Set([...testFiles, ...karateFiles]));
            } catch (error) {
                logger.error(`Error running snooper for Karate files: ${error}`);
            }
        }
        logger.info(`Extracted test files: ${testFiles.join(", ")}`);
        return testFiles;
    }

    /**
     * Parses the last line of the analysis log file and returns structured output.
     * Uses caching to avoid re-parsing the same file.
     * @param forceRefresh Force refresh the cache
     * @returns Parsed analysis output
     */
    public parseAnalysisLog(forceRefresh: boolean = false): AnalysisOutput {
        // Return cached result if available and not forcing refresh
        if (this.cachedOutput && !forceRefresh) {
            logger.info(`Returning cached analysis output.`);
            return this.cachedOutput;
        }
        try {
            const lastLine = this.getLastLine(this.logFilePath);
            // Parse the last line as JSON
            const logObj = JSON.parse(lastLine);
            // Extract the message string from the log object
            const msg: string = logObj.msg;
            // Extract various fields using regex
            const languageMatch = msg.match(/Language:([^\s]+)/);
            const runtimeMatch = msg.match(/RuntimeVersion:([^\n]+)/);
            const packageManagerMatch = msg.match(/PackageManager:(\w+)/);
            const packageManagerVersionMatch = msg.match(/PackageManagerVersion:([\w .()-]*?\d+(?:\.\d+)*)(?=\s)/);
            const testFrameworksMatch = msg.match(/TestFrameworks:\[([^\]]*)\]/);

            const language = languageMatch ? languageMatch[1].trim() : "";
            const runtimeVersion = runtimeMatch
                ? this.normalizeRuntimeVersion(runtimeMatch[1])
                : "";
            const packageManager = packageManagerMatch ? packageManagerMatch[1].trim() : null;
            const packageManagerVersion = packageManagerVersionMatch
                ? packageManagerVersionMatch[1].trim()
                : null;
            const testFrameworks: string[] = this.getTestFrameworks(packageManager ?? "", testFrameworksMatch);
            const testFiles: string[] = this.getTestFiles(msg, testFrameworks);

            // Cache the result
            this.cachedOutput = {
                language,
                runtimeVersion,
                packageManager,
                packageManagerVersion,
                testFrameworks,
                privateRegistry: this.extractList(msg, "PrivateRegistry"),
                privateEndpoints: this.extractList(msg, "PrivateEndpoints"),
                inaccessibleURLs: this.extractList(msg, "InaccessibleURLs"),
                externalReporters: this.extractList(msg, "ExternalReporters"),
                testFiles,
            };
            logger.info(`Parsed analysis log successfully.`);
            return this.cachedOutput;
        }
        catch (error: any) {
            logger.error(`Error parsing analysis log: ${error.message}`);
            throw new Error(`Error parsing analysis log: ${error.message}`);
        }
    }

    /**
     * Get specific field from the analysis output
     * @param field Field name to extract
     * @returns Field value or null if not found
     */
    public getField(field: keyof AnalysisOutput): any { // -> Looking for a specific field in the analysis output
        const output = this.parseAnalysisLog();
        return output[field] || null;
    }

    /**
     * Check if the log file exists
     * @returns True if file exists, false otherwise
     */
    public hasLogFile(): boolean {
        return fs.existsSync(this.logFilePath);
    }

    /**
     * Clear the cached output (useful when log file is updated)
     */
    public clearCache(): void {
        this.cachedOutput = null;
    }

    /**
     * Update the log file path
     * @param newPath New log file path
     */
    public setLogFilePath(newPath: string): void {
        this.logFilePath = newPath;
        this.clearCache(); // Clear cache when path changes
    }

    /**
     * Get the current log file path
     * @returns Current log file path
     */
    public getLogFilePath(): string {
        return this.logFilePath;
    }

    /**
     * Static method for quick analysis (backward compatibility)
     * @param logFilePath Optional log file path
     * @returns Parsed analysis output
     */
    public static testFrameworkSpec(logFilePath: string = "hyperexecute-analyze.log"): AnalysisOutput {
        const analyzer = new FrameworkSpecAnalyzer(logFilePath);
        return analyzer.parseAnalysisLog();
    }
}

// Export class and interface
export { FrameworkSpecAnalyzer, AnalysisOutput };
