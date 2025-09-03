/**
 * analyzer.ts
 * 
 * Parses and normalizes analysis output from hyperexecute-analyze.log.
 *
 * Author: Dhakshath Amin
 * Date: 2 September 2025
 * Description: Provides utilities to extract language, runtime, package manager, test frameworks, and other metadata from analysis logs.
 */

import * as fs from "fs";

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
 * Reads the last line from a file.
 * Throws an error if the file does not exist.
 * @param filePath Path to the file
 * @returns Last line of the file as a string
 */
function getLastLine(filePath: string): string {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);

    const data = fs.readFileSync(filePath, "utf-8");
    const lines = data.trim().split("\n");
    return lines[lines.length - 1];
}

/**
 * Normalizes the runtime version string.
 * Extracts version number for Java, otherwise trims the string.
 * @param runtimeStr Raw runtime version string
 * @param language Programming language
 * @returns Normalized runtime version
 */
function normalizeRuntimeVersion(runtimeStr: string, language: string): string {
    const match = runtimeStr.match(/v?(\d+(?:\.\d+){0,2})/);
    return match ? match[1].trim() : runtimeStr.trim();
}

/**
 * Extracts framework names from the frameworks string.
 * Handles both Java (name before '->') and JS/TS (package@version).
 * @param frameworksStr Raw frameworks string
 * @returns Array of framework names
 */
function normalizeFrameworks(frameworksStr: string): string[] {
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
function extractList(msg: string, field: string): string[] {
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
function extractTestFiles(msg: string): string[] {
    const regex = /TestFiles:\[([^\]]*)\]/;
    const match = msg.match(regex);
    if (!match) return [];

    const files = match[1].split(" ").map(f => f.trim()).filter(Boolean);
    return files;
}

/**
 * Parses the last line of the analysis log file and returns structured output.
 * Throws an error if parsing fails.
 * @returns Parsed analysis output
 */
function parseAnalysisLog(): AnalysisOutput {
    try {
        const filePath = "hyperexecute-analyze.log";
        const lastLine = getLastLine(filePath);
        // Parse the last line as JSON
        const logObj = JSON.parse(lastLine);
        // Extract the message string from the log object
        const msg: string = logObj.msg;
        // Extract various fields using regex
        const languageMatch = msg.match(/Language:([^\s]+)/);
        const runtimeMatch = msg.match(/RuntimeVersion:([^\n]+)/);
        const packageManagerMatch = msg.match(/PackageManager:(\w+)/);
        const packageManagerVersionMatch = msg.match(/PackageManagerVersion:([^\n]+)/);
        const testFrameworksMatch = msg.match(/TestFrameworks:\[([^\]]*)\]/);

        const language = languageMatch ? languageMatch[1].trim() : "";
        const runtimeVersion = runtimeMatch
            ? normalizeRuntimeVersion(runtimeMatch[1], language)
            : "";
        const packageManager = packageManagerMatch ? packageManagerMatch[1].trim() : null;
        const packageManagerVersion = packageManagerVersionMatch
            ? packageManagerVersionMatch[1].trim()
            : null;
        const testFrameworks = testFrameworksMatch
            ? normalizeFrameworks(testFrameworksMatch[1])
            : [];
        const testFiles = extractTestFiles(msg);

        // Return the structured analysis output
        return {
            language,
            runtimeVersion,
            packageManager,
            packageManagerVersion,
            testFrameworks,
            privateRegistry: extractList(msg, "PrivateRegistry"),
            privateEndpoints: extractList(msg, "PrivateEndpoints"),
            inaccessibleURLs: extractList(msg, "InaccessibleURLs"),
            externalReporters: extractList(msg, "ExternalReporters"),
            testFiles,
        };
    }
    catch (error: any) {
        throw new Error(`Error parsing analysis log: ${error.message}`);
    }
}

// Export main function and output type
export { parseAnalysisLog, AnalysisOutput };
