import * as fs from "fs";
import * as fileOps from '../../commons/fileOperations.js';
import { exec } from "child_process";

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

// 🔹 Generic wrapper to avoid repetition
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

// 🔹 Specific checks (just one line each now)
const isJobTriggered = () =>
    checkLogForMessage("cmd/bin", 10000, 1000);

const isInvalidCredentials = () =>
    checkLogForMessage("Invalid user/key credentials", 30000, 2000);

const isProjectNotFound = () =>
    checkLogForMessage("Project not found", 30000, 2000);

const isYAMLParseError = () =>
    checkLogForMessage("Unable to parse hyperexecute.yaml", 30000, 2000);

const isYAMLConfigError = () =>
    checkLogForMessage("Invalid yaml content", 30000, 2000);

const isUploadArchiveStarted = () =>
    checkLogForMessage("Creating archive", 30000, 2000);

const isUploadArchiveDone = () =>
    checkLogForMessage("Archive location", 300000, 10000);

const isServerConnectionStarted = () =>
    checkLogForMessage("Connection to hyperexecute server", 30000, 2000);

const isJobLinkGenerated = () =>
    checkLogForMessage("Job Link", 30000, 5000);

const isJobTrackStopped = () =>
    checkLogForMessage("goroutines have finished", 5000, 1000);

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

type LogCheck = { fn: () => Promise<boolean>; type: string };

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

async function runTest(username: string | undefined, accessKey: string | undefined): Promise<string> {
    try {
        // Start the CLI command asynchronously, but don't await it
        const childProcess = exec(`./hyperexecute --user ${username} --key ${accessKey} --config hyperexecute.yaml --no-track`);

        // Optional: capture stdout asynchronously
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