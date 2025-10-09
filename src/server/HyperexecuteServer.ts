import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import util from "util";

import { FrameworkSpecAnalyzer, AnalysisOutput } from "./tools/framework-spec.js";
import { HyperexecuteYaml } from "./tools/yaml-creator.js";
import { playwrightConfigSetup } from "../playwright-setup/playwright-config-setup.js";
import { updateImportPaths } from "../playwright-setup/playwright-lambdatest-setup.js";
import * as fileOps from "../commons/fileOperations.js";
import * as cliLog from "./tools/cli-log.js";
import * as playwrightTestDistributer from "../playwright-setup/playwright-test-distributer.js";
import { KarateTestDistributor } from "../karate-setup/karate-test-distributer.js";
import { UpdateIgnoreFile } from "../commons/ignore.js"
import logger from "../commons/logger.js";

const execAsync = util.promisify(exec);

/**
 * HyperexecuteServer
 *
 * Main server class for Wells MCP HyperExecute integration.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Implements MCP server tools for LambdaTest HyperExecute, including CLI management, YAML creation, credentials setup, and test orchestration.
 */
export class HyperexecuteServer {
    private server: McpServer;

    // State
    private frameworkSpecObject: FrameworkSpecAnalyzer | null = null;
    private username: string | undefined;
    private accessKey: string | undefined;
    private jobStarted: boolean = false;
    private noError: boolean = false;
    private uploadStarted: boolean = false;
    private uploadDone: boolean = false;
    private serverConnected: boolean = false;
    private jobLink: boolean = false;
    private jobDone: boolean = false;
    private jobExecutionLink: string = ``;

    constructor() {
        this.server = new McpServer({
            name: "Hyperexecute-Wells Tool",
            version: "1.0.0",
        });
        this.username = process.env.LT_USERNAME;
        this.accessKey = process.env.LT_ACCESS_KEY;
        this.registerTools();
        logger.debug(`--- Tool is set ---`);
    }

    /**
     * Register all MCP tools
     */
    private registerTools() {
        this.registerCheckCliPresent();
        this.registerGetCli();
        this.registerRunAnalyzer();
        this.registerMakeCompatible();
        this.registerCreateYaml();
        this.registerSetupCredentials();
        this.registerRunTests();
        this.registerAnalyzeCliRun();
        this.registerPlaywrightTestDistributer();
        this.registerKarateTestDistributer();
    }

    // -------- Tool Definitions --------

    /**
     * Helper to format a plain text response for MCP server tools.
     *
     * @param message The message string to be returned to the client.
     * @returns An object with a `content` property containing an array of text response objects,
     *          in the format required by the MCP server tool callback.
     *          Each object in the array has `type: "text"` and a `text` property.
     *
     * Example return value:
     * {
     *   content: [
     *     { type: "text", text: "Your message here" }
     *   ]
     * }
     */
    private rt(message: string): { content: { type: "text"; text: string }[] } {
        return {
            content: [{
                type: "text",
                text: message
            }]
        };
    }

    private registerCheckCliPresent() {
        /**
         * Registers the tool to check if the hyperexecute CLI exists in the framework repo.
         * Should be called before running analyze or downloading CLI.
         * Returns a text response indicating presence or absence of the CLI.
         */
        this.server.tool(
            "check-hyperexecute-cli-present",
            "Check if hyperexecute CLI exists in the framework repo. Should be called before running analyze or downloading CLI.",
            {},
            async () => {
                try {
                    logger.info("Checking for hyperexecute CLI presence...");
                    const { stdout, stderr } = await execAsync("find . -name 'hyperexecute'");
                    let message: string;
                    if (stderr) {
                        logger.error(`stderr while checking for hyperexecute CLI: ${stderr}`);
                        message = `stderr while checking for hyperexecute CLI: ${stderr}`;
                    } else if (stdout.trim()) {
                        logger.info(`hyperexecute CLI found: ${stdout}`);
                        message = `Yes, hyperexecute CLI is present. Suspected files: ${stdout}`;
                    } else {
                        logger.warn("hyperexecute CLI not present in the framework repo.");
                        message = `Oops, hyperexecute CLI is not present in the framework repo. Please download it.`;
                    }
                    return this.rt(message);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error occurred while checking for hyperexecute CLI: ${error.message}`);
                    return this.rt(`Error occurred while checking for hyperexecute CLI: ${error.message}`);
                }
            }
        );
    }

    private registerGetCli() {
        /**
         * Registers the tool to download the hyperexecute CLI and check if credentials are set.
         * Should only be called if 'check-hyperexecute-cli-present' reports missing CLI.
         * Returns a text response about download status and credential presence.
         */
        this.server.tool(
            "get-hyperexecute-cli",
            `Download hyperexecute CLI & check if Hyperexecute Credentials are set in environment variables. 
             Should only be called if 'hyperexecute-cli-present?' reports missing CLI.
             Always run 'run-hyperexecute-analyzer' after downloading the CLI.`,
            {},
            async () => {
                try {
                    logger.info("Downloading hyperexecute CLI...");
                    const { stderr } = await execAsync(
                        "curl -s -O https://downloads.lambdatest.com/hyperexecute/darwin/hyperexecute"
                    );
                    const isCredSet = this.username != null && this.accessKey != null;
                    logger.info(`Downloaded hyperexecute CLI. Credentials set: ${isCredSet}`);
                    return this.rt(`Downloaded the file ${stderr} & Hyperexecute Credentials are ${isCredSet ? `set` : 'NOT set'}`);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error in downloading hyperexecute CLI: ${error.message}`);
                    return this.rt(`Error in downloading, here is Response: ${error.message}`);
                }
            }
        );
    }

    private registerRunAnalyzer() {
        /**
         * Registers the tool to run the hyperexecute analyzer and return the framework spec.
         * Requires CLI. If CLI not present, first call 'get-hyperexecute-cli'.
         * Returns a text response with the framework spec or error details.
         */
        this.server.tool(
            "run-hyperexecute-analyzer",
            "Run hyperexecute analyzer, returns framework spec. Requires CLI. If CLI not present, first call 'get-hyperexecute-cli'.",
            {},
            async () => {
                try {
                    logger.info("Running chmod and analyze commands for hyperexecute CLI...");
                    const { stderr } = await execAsync(
                        "chmod 777 hyperexecute | ls -la hyperexecute "
                    );
                    if (stderr) {
                        logger.error(`Error while running chmod command: ${stderr}`);
                        return this.rt(`Error while running chmod command: ${stderr}`);
                    } else {
                        const { stderr } = await execAsync(
                            "./hyperexecute analyze"
                        );
                        if (stderr) {
                            logger.error(`Error while running hyperexecute command: ${stderr}`);
                            return this.rt(`Error while running hyperexecute command: ${stderr}`);
                        }
                        this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                        const frameworkSpec: AnalysisOutput = this.frameworkSpecObject.parseAnalysisLog();
                        logger.info(`Framework spec parsed: ${JSON.stringify(frameworkSpec)}`);
                        return this.rt(JSON.stringify(frameworkSpec, null, 2));
                    }
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error trying to run hyperexecute analyze: ${error.message}`);
                    return this.rt(`Error trying to run hyperexecute analyze: ${error.message}`);
                }
            }
        );
    }

    private registerMakeCompatible() {
        /**
         * Registers the tool to make the framework compatible with Hyperexecute CLI.
         * Updates Playwright config and test imports if applicable.
         * Returns a text response about compatibility actions taken.
         */
        this.server.tool(
            "make-hyperexecute-compatible",
            `Make the framework compatible with Hyperexecute CLI.`,
            {},
            async ({ }) => {
                try {
                    logger.info("Making framework compatible with Hyperexecute CLI...");
                    if (!this.frameworkSpecObject) this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                    const packageManager: string = this.frameworkSpecObject.getField('packageManager');
                    const testFrameworks: string[] = this.frameworkSpecObject.getField('testFrameworks');
                    const testFiles: string[] = this.frameworkSpecObject.getField('testFiles');
                    if (["npm", "yarn", "pnpm"].includes(packageManager) && testFrameworks.some(fw => fw.includes("playwright"))) {
                        const language: string = this.frameworkSpecObject.getField('language').toLowerCase();
                        logger.info("Updating Playwright config and import paths...");
                        playwrightConfigSetup();
                        await updateImportPaths(testFiles, language);
                    }
                    logger.info("Framework compatibility update complete.");
                    return this.rt(`Made the framework compatible with Hyperexecute CLI by updating playwright.config.js and replacing imports in test files with lambdatest-test.`);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error in making the framework compatible with Hyperexecute CLI: ${error.message}`);
                    return this.rt(`Error in making the framework compatible with Hyperexecute CLI: ${error.message}`);
                }
            }
        );
    }

    private registerCreateYaml() {
        /**
         * Registers the tool to create a hyperexecute YAML file for the framework.
         * Prompts for project name and ID. Handles Playwright and Karate frameworks.
         * Returns a text response with YAML creation result or error details.
         */
        this.server.tool(
            "create-hyperexecute-yaml-file",
            `Create a hyperexecute yaml file for the this framework prompting user to give project name & ID (must be entered manually, cannot be inferred)`,
            {
                projectName: z.string().describe("Provide your  project name found in https://hyperexecute.lambdatest.com/hyperexecute/projects"),
                projectID: z.string().describe("Provide your project ID"),
            },
            async ({ projectName, projectID }) => {
                try {
                    logger.info(`Creating hyperexecute.yaml for project: ${projectName}, ID: ${projectID}`);
                    if (!this.frameworkSpecObject) this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                    const packageManager: string = this.frameworkSpecObject.getField('packageManager');
                    const testFrameworks: string[] = this.frameworkSpecObject.getField('testFrameworks');
                    const testFiles: string[] = this.frameworkSpecObject.getField('testFiles');
                    const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
                    let playwrightVersion: string = '', result: string = '';
                    if (packageManager === 'npm' || packageManager === 'yarn' || packageManager === 'pnpm') {
                        for (const testFramework of testFrameworks) {
                            if (testFramework.includes('playwright')) {
                                playwrightVersion = testFramework;
                            }
                        }
                        logger.info(`Detected Playwright version: ${playwrightVersion}, test file: ${testFiles[0]}`);
                        result = await yamlcreater.createYamlForPlaywright(projectName, projectID, playwrightVersion, testFiles[0]);
                    }
                    else if (testFrameworks.some(fw => fw.includes("karate"))) {
                        logger.info(`Detected Karate framework, using package manager: ${packageManager}`);
                        result = await yamlcreater.createYamlForKarate(projectName, projectID, packageManager);
                    }
                    logger.info(`hyperexecute.yaml creation result: ${JSON.stringify(result)}`);
                    return this.rt(`Created hyperexecute.yaml file\n ${JSON.stringify(result, null, 2)}`);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error in creating hyperexecute.yaml file: ${error.message}`);
                    return this.rt(`Error in creating hyperexecute.yaml file: ${error.message}`);
                }
            }
        );
    }

    private registerSetupCredentials() {
        /**
         * Registers the tool to collect LambdaTest credentials if not set by environment variables.
         * Prompts for username and access key. Updates internal state.
         * Returns a text response about credential configuration status.
         */
        this.server.tool(
            "setup-lambdatest-credentials",
            "Collect LambdaTest credentials if NOT set by environment variables (must be entered manually, cannot be inferred).",
            {
                LT_USERNAME: z.string()
                    .describe("Provide your LambdaTest username Manually (Copy if from link: https://hyperexecute.lambdatest.com/hyperexecute)"),
                LT_ACCESS_KEY: z.string()
                    .describe("Provide your LambdaTest access key Manually"),
            },
            async ({ LT_USERNAME, LT_ACCESS_KEY }) => {
                if (LT_USERNAME) this.username = LT_USERNAME;
                if (LT_ACCESS_KEY) this.accessKey = LT_ACCESS_KEY;
                logger.info(`LambdaTest credentials updated. Username: ${this.username}, AccessKey: ${this.accessKey}`);
                const msg = (!this.username || !this.accessKey)
                    ? `Please provide LambdaTest credentials to run tests on HyperExecute.\nCan be found in the link: https://hyperexecute.lambdatest.com/hyperexecute`
                    : `LambdaTest credentials configured successfully for user: ${this.username}`;
                logger.debug(`Message: ${msg}`)
                return this.rt(msg);
            }
        );
    }

    private registerRunTests() {
        /**
         * Registers the tool to run tests on Hyperexecute LambdaTest platform.
         * Requires CLI, credentials, YAML file, and compatible framework.
         * Returns a text response about job trigger status or errors.
         */
        this.server.tool(
            "run-tests-on-hyperexecute",
            `Run the tests present in the framework on Hyperexecute lambdatest test tool platform, requires hyperexecute cli, lambdatest-credentials, hyperexecute yaml file and framework compatible with Hyperexecute CLI.`,
            {},
            async () => {
                [this.jobStarted, this.noError, this.uploadStarted, this.uploadDone, this.serverConnected, this.jobLink, this.jobDone] = Array(7).fill(false);
                try {
                    logger.info("Starting test run on Hyperexecute LambdaTest platform...");
                    let lastCliOutput = "";
                    const filePath = fileOps.findFileAbsolutePath(process.cwd(), 'hyperexecute-cli.log');
                    if (filePath) fileOps.deleteFile('hyperexecute-cli.log');
                    UpdateIgnoreFile();
                    lastCliOutput = await cliLog.runTest(this.username, this.accessKey);
                    this.jobStarted = await cliLog.isJobTriggered();
                    const message = this.jobStarted ? "CLI Job triggered successfully" : `Failed to trigger CLI Job. CLI said: ${lastCliOutput || "no output yet"}`;
                    logger.info(`Test run status: ${message}`);
                    return this.rt(message);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error('Error running test in hyperexecute CLI: ' + error.message);
                    return this.rt(`Error running test in hyperexecute CLI: ${error.message}`);
                }
            }
        );
    }

    private registerAnalyzeCliRun() {
        /**
         * Registers the tool to analyze hyperexecute CLI run and extract the job link.
         * Checks CLI logs for job progression and errors. Returns job link or status updates.
         * Returns a text response with job link, status, or error details.
         */
        this.server.tool(
            "analyze-hyperexecute-cli-run",
            `Post test runs in hyperexecute CLI, analyze the hyperexecute-cli.logs file to get the Job Link. 
             Keep on checking for the Job Link until it is found in logs or job is terminated.`,
            {},
            async () => {
                try {
                    logger.info("Analyzing hyperexecute CLI run for job link...");
                    let message = "";
                    if (!this.jobStarted) {
                        this.jobStarted = await cliLog.isJobTriggered();
                        if (this.jobStarted) {
                            logger.info("CLI Job triggered successfully, checking for job link.");
                            message = `CLI Job triggered successfully, lets check for the job link.`;
                        } else {
                            logger.warn("Tests not started - Please run the tests in hyperexecute CLI.");
                            throw new Error("Tests not started - Please run the tests in hyperexecute CLI.");
                        }
                        return this.rt(message);
                    }
                    if (this.jobStarted && !this.noError) {
                        const firstResult = await cliLog.detectFirstCLIEvent();
                        logger.debug(`First CLI event detected: ${firstResult}`);
                        switch (firstResult) {
                            case "InvalidCredentials":
                                message = "Invalid credentials. Please input the valid hyperexecute credentials and run tests again.";
                                break;
                            case "ProjectNotFound":
                                message = "Project not found. Please input the valid hyperexecute project name, ID into yaml and run tests again.";
                                break;
                            case "YAMLParseError":
                                message = "Unable to parse hyperexecute.yaml. Please create a new valid hyperexecute.yaml and run tests again.";
                                break;
                            case "YAMLConfigError":
                                message = "Invalid yaml content. Please create a new valid hyperexecute.yaml and run tests again.";
                                break;
                            case "YAMLNotFound":
                                message = "YAML config file not found. Please create a new hyperexecute.yaml file and run tests again.";
                                break;
                            default:
                                message = "None of the errors are found, can proceed looking for the job link in cli logs.";
                                this.noError = true;
                        }
                        logger.info(`Analysis result message: ${message}`);
                        return this.rt(message);
                    }

                    // ----> Steps of job progression <-----
                    const jobSteps = [
                        {
                            condition: () => !this.uploadStarted,
                            check: async () => (this.uploadStarted = await cliLog.isUploadArchiveStarted()),
                            message: "Uploading archives started. Please wait for the archives to be uploaded."
                        },
                        {
                            condition: () => this.uploadStarted && !this.uploadDone,
                            check: async () => (this.uploadDone = await cliLog.isUploadArchiveDone()),
                            message: "Uploading archives done. Let's wait for the server connection to be established."
                        },
                        {
                            condition: () => this.uploadDone && !this.serverConnected,
                            check: async () => (this.serverConnected = await cliLog.isServerConnectionStarted()),
                            message: "Server connection established. Please wait for the job link or at least test to terminate."
                        },
                        {
                            condition: () => this.serverConnected && !this.jobLink,
                            check: async () => (this.jobLink = await cliLog.isJobLinkGenerated()),
                            message: (link: string) => `Job link is generated. Here is the job link: ${link}`,
                            onSuccess: async () => await cliLog.getJobLink()
                        }
                    ];

                    if (this.jobStarted && !this.jobDone) {
                        for (const step of jobSteps) {
                            if (step.condition()) {
                                const result = await step.check();
                                if (result) {
                                    if (step.onSuccess) {
                                        this.jobExecutionLink = await step.onSuccess();
                                        logger.info(`Job link generated: ${this.jobExecutionLink}`);
                                        return this.rt(step.message(this.jobExecutionLink));
                                    }
                                    logger.info(`Job progression message: ${step.message}`);
                                    return this.rt(step.message as string);
                                }
                            }
                        }
                    }

                    if (!this.jobLink) {
                        this.jobDone = await cliLog.isJobTrackStopped();
                        if (this.jobDone) {
                            logger.warn("Job link is not generated, but test has been terminated.");
                            throw new Error("Job link is not generated, but test has been terminated.");
                        }
                        logger.info("Job is still running, waiting for job link...");
                        return this.rt("Job is still running, waiting for job link...");
                    }
                    logger.info(`Job link is generated: ${this.jobExecutionLink}`);
                    return this.rt(`Job link is generated. Here is the job link: ${this.jobExecutionLink}`);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Error getting the job link: ${error.message}`);
                    return this.rt(`Error getting the job link: ${error.message}. \n Exiting the user request. Kindly analyze your project manually & try again later!`);
                }
            });
    }

    private registerPlaywrightTestDistributer() {
        /**
         * Registers the tool to distribute Playwright tests across parallel machines.
         * Supports distribution by specific test, parallel test, group test, tags, or names.
         * Updates hyperexecute.yaml with distribution commands. Returns status or error as text.
         */
        this.server.tool(
            "test-distributer-playwright",
            `Distribute Playwright tests across parallel machines. Supported distribution modes: specific test, individual tests, test groups, tags, or test names.
            (must be entered manually, cannot be inferred)
            Distributed Inputs are updated into hyperexecute.yaml file by this tool & 'run-tests-on-hyperexecute' tool needs to be called after this tool`,
            {
                testDistributor: z.enum([
                    "specific-test",
                    "parallel-test",
                    "group-test",
                    "tags",
                    "names"
                ])
                    .transform(val => val.toLowerCase() as typeof val)
                    .describe(
                        `Select distribution mode (case-insensitive):
                   • specific-test → Run a specific test on a separate machine.
                   • parallel-test → Run each individual test on a separate machine.
                   • group-test → Run groups of tests (test.describe blocks) on separate machines.
                   • tags → Run tests with a specific @tag on separate machines.
                   • names → Run tests with a specific description string on separate machines.`
                    ),

                testDistributorValue: z.string().describe(
                    `Additional filter value depending on distribution mode:
                 • For specific-test → provide the test name (e.g. "test.spec.ts or *.spec.ts").
                 • For tags → provide the tag name (e.g. "@smoke").
                 • For names → provide the test description keyword (e.g. "login").
                 • For parallel-test or group-test → provide the test directory (e.g. "tests").
                   (must be entered manually, cannot be inferred)`
                ),
            },
            async ({ testDistributor, testDistributorValue }) => {
                try {
                    logger.info(`Distributing Playwright tests. Mode: ${testDistributor}, Value: ${testDistributorValue}`);
                    const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
                    if (!this.frameworkSpecObject) {
                        this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                    }
                    const testFiles: string[] = this.frameworkSpecObject.getField("testFiles");
                    if (testFiles.length <= 0) {
                        logger.warn("No test files found in the framework.");
                        return this.rt("No test files found in the framework. Please add test files to the framework and try again.");
                    }
                    const packageManager: string = this.frameworkSpecObject.getField("packageManager") || "";
                    let command = "", values: string[] = [];
                    if (["npm", "yarn", "pnpm"].includes(packageManager)) {
                        await yamlcreater.ensureYamlFile_Playwright();
                        switch (testDistributor) {
                            case "specific-test":
                                const testFilesSet: Set<string> = new Set();
                                values = testDistributorValue.split(/[ ,;]+/);
                                for (const value of values) {
                                    playwrightTestDistributer.does_TestExists(value).forEach(testFile => testFilesSet.add(testFile));
                                }
                                command = playwrightTestDistributer.playwrightTestDistributer_BySpecificTest(Array.from(testFilesSet));
                                break;
                            case "parallel-test":
                                let testFolders: Set<string> = new Set();
                                values = testDistributorValue.split(/[ ,;]+/);
                                for (const value of values) {
                                    testFolders.add(playwrightTestDistributer.does_DirectoryHaveTests(value));
                                }
                                command = playwrightTestDistributer.playwrightTestDistributer_ByTest(Array.from(testFolders));
                                break;
                            case "group-test":
                                let testGroupFolders: Set<string> = new Set();
                                values = testDistributorValue.split(/[ ,;]+/);
                                for (const value of values) {
                                    testGroupFolders.add(playwrightTestDistributer.does_DirectoryHaveTests(value));
                                }
                                command = playwrightTestDistributer.playwrightTestDistributer_ByTestGroups(Array.from(testGroupFolders));
                                break;
                            case "tags":
                            case "names":
                                values = testDistributorValue.split(/[ ,;]+/);
                                for (const value of values) {
                                    playwrightTestDistributer.does_TestContainTag(value);
                                }
                                command = playwrightTestDistributer.playwrightTestDistributer_ByTagName(testDistributorValue.split(" "));
                                break;
                            default:
                                command = "echo test";
                        }
                    } else {
                        logger.error(`Unsupported package manager: ${packageManager}`);
                        return this.rt(`Unsupported package manager "${packageManager}". Currently supported: npm, yarn, pnpm.`);
                    }
                    let result = await yamlcreater.updateField("TestDiscoveryCommand", command);
                    result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
                    logger.info(`Test distribution updated. Command: ${command}`);
                    return this.rt(`Test distribution updated.\n\nRunner Command:\n\`${command}\`\n\nYAML Update Result:\n${JSON.stringify(result, null, 2)}`);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Playwright Test distribution error: ${error.message}`);
                    return this.rt(`Error in distributing the tests.\nReason: ${error.message}\n\nInputs:\n- Distributor: ${testDistributor}\n- Value: ${testDistributorValue}`);
                }
            }
        );
    }

    /**
     * Note:
     * 1) Handle Multi-Folder scenario for specific featrure file; Ex-> login.feature can be with QA & Stage env
     * 2) Handle specific scenario line example: when user pass login.feature:10
     */
    private registerKarateTestDistributer() {
        /**
         * Registers the tool to distribute Karate tests across parallel machines.
         * Supports distribution by tags or feature files. Updates hyperexecute.yaml accordingly.
         * Returns a text response with distribution status or error details.
         */
        this.server.tool(
            "test-distributer-karate",
            `Distribute karate-tests across parallel machines. Supported distribution modes: tags or feature files. (must be entered manually, cannot be inferred)
             Distributed Inputs are updated into hyperexecute.yaml file by this tool & 'run-tests-on-hyperexecute' tool needs to be called after this tool`,
            {
                testDistributor: z.enum([
                    "tags",
                    "feature-files"
                ])
                    .transform(val => val.toLowerCase() as typeof val)
                    .describe(
                        `Select distribution mode (case-insensitive):
                   • tags → Run tests with a specific @tags on separate machines.
                   • feature-files → Run scenarios from feature files on separate machines.`
                    ),

                testDistributorValue: z.string().describe(
                    `Additional filter value depending on distribution mode:
                 • For tags → provide the tag name (e.g. "@smoke").
                 • For feature-files → provide the specific feature file or folder (e.g. "login.feature", "*.feature","src/test/resource/features" ).
                   (must be entered manually, cannot be inferred)`
                ),
            },
            async ({ testDistributor, testDistributorValue }) => {
                try {
                    logger.info(`Distributing Karate tests. Mode: ${testDistributor}, Value: ${testDistributorValue}`);
                    const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
                    let result = ``, responseText = ``, values: string[] = [], testDiscoveryCommand = ``;
                    this.frameworkSpecObject ??= new FrameworkSpecAnalyzer();
                    const testFiles: string[] = this.frameworkSpecObject.getField("testFiles") ?? [];
                    const packageManager: string = (this.frameworkSpecObject.getField("packageManager") ?? "").toLowerCase();
                    const hasValidFeatures = testFiles.length > 0 && testFiles.some(f => f.toLowerCase().includes(".feature"));
                    if (!hasValidFeatures) {
                        logger.warn("No valid `.feature` files found in Karate project.");
                        return this.rt("No valid `.feature` files found. Please ensure your Karate project has `.feature` files.");
                    }
                    if (!["maven", "gradle"].includes(packageManager)) {
                        logger.error(`Unsupported build tool: ${packageManager}`);
                        return this.rt(`Unsupported build tool: ${packageManager || "unknown"}. Supported tools: Maven, Gradle.`);
                    }
                    const distributer = new KarateTestDistributor();
                    const parseDistributorValues = (input: string): string[] =>
                        (input || "").split(/[ ,;]+/).filter(Boolean);
                    const applyDistribution = async (type: string, values: string[]) => {
                        switch (type) {
                            case "tags":
                                values.forEach(tag => distributer.hasFeatureWithTag(tag));
                                return distributer.testDiscoverCommand_forTags(values);
                            case "feature-files":
                                values.forEach(f => distributer.hasFeatureFileOrFolder(f));
                                return distributer.testDiscoverCommand_forFileOrFolder(values);
                            default:
                                return "echo test";
                        }
                    };
                    if (packageManager === "maven") {
                        logger.info("Ensuring Karate Maven YAML file...");
                        yamlcreater.ensureYamlFile_Karate_Maven();
                        values = parseDistributorValues(testDistributorValue);
                        testDiscoveryCommand = await applyDistribution(testDistributor, values);
                        result = await yamlcreater.updateField("TestDiscoveryCommand", testDiscoveryCommand);
                        result = await yamlcreater.updateField("TestRunnerCommand", distributer.testRunnerCommand_karateMaven());
                    } else {
                        logger.info("Ensuring Karate Gradle YAML file...");
                        yamlcreater.ensureYamlFile_Karate_Gradle();
                        values = parseDistributorValues(testDistributorValue);
                        testDiscoveryCommand = await applyDistribution(testDistributor, values);
                        result = await yamlcreater.updateField("TestDiscoveryCommand", testDiscoveryCommand);
                        result = await yamlcreater.updateField("TestRunnerCommand", distributer.testRunnerCommand_karateGradle());
                    }
                    responseText = `Test distribution updated.\n\nRunner Command:\n\`${testDiscoveryCommand}\`\n\nYAML Update Result:\n${JSON.stringify(result, null, 2)}`;
                    logger.info(`Karate test distribution updated. Command: ${testDiscoveryCommand}`);
                    return this.rt(responseText);
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    logger.error(`Karate Test distribution error: ${error.message}`);
                    return this.rt(`Error in distributing the tests.\nReason: ${error.message}\n\nInputs:\n- Distributor: ${testDistributor}\n- Value: ${testDistributorValue}`);
                }
            }
        );
    }
    // -------- Start Server --------
    /**
    * Starts the Hyperexecute MCP server using stdio transport.
    * Call this method to begin listening for MCP tool requests.
    */
    public start() {
        logger.info("Starting Hyperexecute MCP server...");
        const transport = new StdioServerTransport();
        this.server.connect(transport);
    }
}
