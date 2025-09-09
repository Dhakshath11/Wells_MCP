/**
 * cli-log.ts
 *
 * Utility functions for monitoring and parsing LambdaTest HyperExecute CLI logs.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Provides async helpers to check CLI log events, extract job links, and run CLI commands for test automation.
 */

import * as fs from "fs";
import * as fileOps from '../../commons/fileOperations.js';
import { exec } from "child_process";

/**
 * Type for log check event.
 */
type LogCheck = { fn: () => Promise<boolean>; type: string };

/**
 * Waits for a specific message to appear in the CLI log file within a timeout.
 * @param searchString Message to search for
 * @param timeoutMs Maximum time to wait (ms)
 * @param intervalMs Polling interval (ms)
 * @returns Promise resolving to true if found, false if not
 */
async function waitForLogMessage(
    searchString: string,
    timeoutMs = 30000,
    intervalMs = 1000
): Promise<boolean> {
    const filePath = fileOps.findFileAbsolutePath('.', 'hyperexecute-cli.log');
    if (!filePath) {
        return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
            try {
                // Always check timeout first
                if (Date.now() - start > timeoutMs) {
                    clearInterval(timer);
                    return resolve(false); // timeout
                }

                if (fs.existsSync(filePath)) {
                    const contents = fs.readFileSync(filePath, "utf-8");
                    if (contents.toLowerCase().includes(searchString.toLowerCase())) {
                        clearInterval(timer);
                        return resolve(true); // found string
                    }
                }
            } catch (err) {
                clearInterval(timer);
                reject(err);
            }
        }, intervalMs);
    });
}

/**
 * Wrapper for waitForLogMessage to handle errors gracefully.
 */
async function checkLogForMessage(
    searchString: string,
    timeoutMs: number,
    intervalMs: number
): Promise<boolean> {
    try {
        return await waitForLogMessage(searchString, timeoutMs, intervalMs);
    } catch {
        return false;
    }
}

// ----------- Specific log checks for CLI events -----------
/** Checks if CLI job is triggered. */
const isJobTriggered = () =>
    checkLogForMessage("cmd/bin", 10000, 1000);
/** Checks for invalid credentials error. */
const isInvalidCredentials = () =>
    checkLogForMessage("Invalid user/key credentials", 30000, 2000);
/** Checks for project not found error. */
const isProjectNotFound = () =>
    checkLogForMessage("Project not found", 30000, 2000);
/** Checks for YAML parse error. */
const isYAMLParseError = () =>
    checkLogForMessage("Unable to parse hyperexecute.yaml", 30000, 2000);
/** Checks for YAML config error. */
const isYAMLConfigError = () =>
    checkLogForMessage("Invalid yaml content", 30000, 2000);
/** Checks if archive upload started. */
const isUploadArchiveStarted = () =>
    checkLogForMessage("Creating archive", 30000, 2000);
/** Checks if archive upload finished. */
const isUploadArchiveDone = () =>
    checkLogForMessage("Archive location", 300000, 10000);
/** Checks if server connection started. */
const isServerConnectionStarted = () =>
    checkLogForMessage("Connection to hyperexecute server", 30000, 2000);
/** Checks if job link is generated. */
const isJobLinkGenerated = () =>
    checkLogForMessage("Job Link", 30000, 5000);
/** Checks if job tracking stopped. */
const isJobTrackStopped = () =>
    checkLogForMessage("goroutines have finished", 5000, 1000);

/**
 * Extracts the job link from the CLI log file.
 * @returns Job link string or error message
 */
async function getJobLink(): Promise<string> {
    try {
        const filePath = fileOps.findFileAbsolutePath('.', 'hyperexecute-cli.log');
        if (!filePath) throw new Error('hyperexecute-cli.log not found');

        const content = fileOps.getFileContent(filePath);
        // Remove ANSI escape sequences (color codes, underline, etc.)
        const cleanContent = content.replace(/\u001b\[[0-9;]*m/g, "");
        // Extract the job link
        const jobLink = cleanContent.match(/Job Link:\s*(https?:\/\/\S+)/)?.[1];
        return jobLink || "Job link not found or not yet generated";
    }
    catch (error: any) {
        return "Job link not found or not yet generated";
    }
}

/**
 * Runs all log checks in parallel and returns the first detected event type.
 * @returns Event type string or null
 */
async function detectFirstCLIEvent(): Promise<string | null> {
    const logChecks: LogCheck[] = [
        { fn: isInvalidCredentials, type: "InvalidCredentials" },
        { fn: isProjectNotFound, type: "ProjectNotFound" },
        { fn: isYAMLParseError, type: "YAMLParseError" },
        { fn: isYAMLConfigError, type: "YAMLConfigError" },
    ];

    const firstResult = await Promise.race(
        logChecks.map(async ({ fn, type }) => (await fn() ? type : null))
    );

    return firstResult || null;
}

/**
 * Runs the HyperExecute CLI command asynchronously and captures output.
 * @param username LambdaTest username
 * @param accessKey LambdaTest access key
 * @returns CLI output string
 */
async function runTest(username: string | undefined, accessKey: string | undefined): Promise<string> {
    try {
        // Start the CLI command asynchronously, but don't await it
        const childProcess = exec(`./hyperexecute --user ${username} --key ${accessKey} --config hyperexecute.yaml --no-track`);

        // Optional: capture stdout asynchronously -> Log for MCP Inspector
        let cliOutput = "";
        childProcess.stdout?.on("data", (chunk) => {
            cliOutput += chunk.toString();
            console.error(chunk.toString());
        });
        childProcess.stderr?.on("data", (chunk) => {
            console.error(chunk.toString());
        });

        // Delay for 5 seconds to form log file
        await new Promise(resolve => setTimeout(resolve, 5000));
        return cliOutput;
    }
    catch (error: any) {
        throw new Error(`Error occurred while running tests: ${error.message}`);
    }
}

export {
    isJobTriggered,
    getJobLink,
    isInvalidCredentials,
    isProjectNotFound,
    isUploadArchiveStarted,
    isUploadArchiveDone,
    isServerConnectionStarted,
    isYAMLParseError,
    isYAMLConfigError,
    isJobLinkGenerated,
    isJobTrackStopped,
    detectFirstCLIEvent,
    runTest
}