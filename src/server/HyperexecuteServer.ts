import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import util from "util";

import { FrameworkSpecAnalyzer, AnalysisOutput } from "./tools/framework-spec";
import { hyperexecuteYamlCreator } from "./tools/yaml-creator";
import { playwrightConfigSetup } from "../playwright-setup/playwright-config-setup";
import { updateImportPaths } from "../playwright-setup/playwright-lambdatest-setup";
import * as fileOps from "../commons/fileOperations.js";
import * as cliLog from "./tools/cli-log.js";

const execAsync = util.promisify(exec);

export class HyperexecuteServer {
    private server: McpServer;

    // State
    private frameworkSpecObject: FrameworkSpecAnalyzer | null = null;
    private username: string | undefined = process.env.LT_USERNAME;
    private accessKey: string | undefined = process.env.LT_ACCESS_KEY;
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

        this.registerTools();
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
    }

    // -------- Tool Definitions --------

    private registerCheckCliPresent() {
        this.server.tool(
            "check-hyperexecute-cli-present",
            "Check if hyperexecute CLI exists in the framework repo. Should be called before running analyze or downloading CLI.",
            {},
            async () => {
                try {
                    const { stdout, stderr } = await execAsync("find . -name 'hyperexecute'");
                    let message: string;

                    if (stderr) {
                        message = `stderr while checking for hyperexecute CLI: ${stderr}`;
                    } else if (stdout.trim()) {
                        message = `Yes, hyperexecute CLI is present. Suspected files:\n${stdout}`;
                    } else {
                        message = `Oops, hyperexecute CLI is not present in the framework repo. Please download it.`;
                    }

                    return {
                        content: [{
                            type: "text",
                            text: message
                        }]
                    };
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [{
                            type: "text",
                            text: `Error occurred while checking for hyperexecute CLI: ${error.message}`
                        }]
                    };
                }
            }
        );
    }

    private registerGetCli() {
        this.server.tool(
            "get-hyperexecute-cli",
            `Download hyperexecute CLI. Should only be called if 'hyperexecute-cli-present?' reports missing CLI.
             Always run 'run-hyperexecute-analyzer' after downloading the CLI.`,
            {},
            async () => {
                try {
                    // Curl command will always return stderr, not stdout. Hence not checking stdout.
                    const { stderr } = await execAsync(
                        "curl -s -O https://downloads.lambdatest.com/hyperexecute/darwin/hyperexecute"
                    );

                    return {
                        content: [{
                            type: "text",
                            text: `Downloaded the file. ${stderr}`
                        }]
                    };

                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [{
                            type: "text",
                            text: `Error in downloading, here is Response: ${error.message}`
                        }]
                    };
                }
            }
        );
    }

    private registerRunAnalyzer() {
        this.server.tool(
            "run-hyperexecute-analyzer",
            "Run hyperexecute analyzer, returns framework spec. Requires CLI. If CLI not present, first call 'get-hyperexecute-cli'.",
            {},
            async () => {
                try {
                    // Giving permission to the hyperexecute file
                    const { stderr } = await execAsync(
                        "chmod 777 hyperexecute | ls -la hyperexecute "
                    );
                    if (stderr) {
                        return {
                            content: [{
                                type: "text",
                                text: `Error while running chmod command: ${stderr}`
                            }]
                        };
                    } else {
                        const { stderr } = await execAsync(
                            "./hyperexecute analyze"
                        );
                        if (stderr) {
                            return {
                                content: [{
                                    type: "text",
                                    text: `Error while running hyperexecute command: ${stderr}`
                                }]
                            };
                        }
                        this.frameworkSpecObject = new FrameworkSpecAnalyzer(); // Object is stored globally
                        const frameworkSpec: AnalysisOutput = this.frameworkSpecObject.parseAnalysisLog();
                        return {
                            content: [{
                                type: "text",
                                text: JSON.stringify(frameworkSpec, null, 2)
                            }]
                        };
                    }
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [{
                            type: "text",
                            text: `Error trying to run hyperexecute analyze: ${error.message}`
                        }]
                    };
                }
            }
        );
    }

    private registerMakeCompatible() {
        this.server.tool(
            "make-hyperexecute-compatible",
            `Make the framework compatible with Hyperexecute CLI.`,
            {},
            async ({ }) => {
                try {
                    if (!this.frameworkSpecObject) this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                    const packageManager: string = this.frameworkSpecObject.getField('packageManager');
                    const testFrameworks: string[] = this.frameworkSpecObject.getField('testFrameworks');
                    const testFiles: string[] = this.frameworkSpecObject.getField('testFiles');

                    if (["npm", "yarn", "pnpm"].includes(packageManager) && testFrameworks.some(fw => fw.includes("playwright"))) {
                        playwrightConfigSetup();
                        updateImportPaths(testFiles);
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Made the framework compatible with Hyperexecute CLI by updating playwright.config.js and replacing imports in test files with lambdatest-test.`,
                            },
                        ],
                    };
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error in making the framework compatible with Hyperexecute CLI: ${error.message}`,
                            },
                        ],
                    };
                }
            }
        );
    }

    private registerCreateYaml() {
        this.server.tool(
            "create-hyperexecute-yaml-file",
            `Create a hyperexecute yaml file for the this framework.`,
            {
                projectName: z.string().describe("Provide your  project name found in https://hyperexecute.lambdatest.com/hyperexecute/projects"),
                projectID: z.string().describe("Provide your project ID"),
            },
            async ({ projectName, projectID }) => {
                try {
                    if (!this.frameworkSpecObject) this.frameworkSpecObject = new FrameworkSpecAnalyzer();
                    const packageManager: string = this.frameworkSpecObject.getField('packageManager');
                    const testFrameworks: string[] = this.frameworkSpecObject.getField('testFrameworks');
                    const testFiles: string[] = this.frameworkSpecObject.getField('testFiles');

                    let playwrightVersion: string = '', result: string = '';
                    if (packageManager === 'npm' || packageManager === 'yarn' || packageManager === 'pnpm') {
                        for (const testFramework of testFrameworks) {
                            if (testFramework.includes('playwright')) {
                                playwrightVersion = testFramework;
                            }
                        }
                        result = hyperexecuteYamlCreator(projectName, projectID, playwrightVersion, testFiles[0])
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Created hyperexecute.yaml file\n ${JSON.stringify(result, null, 2)}`
                            },
                        ],
                    };
                } catch (error: any) {
                    console.error(error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error in creating hyperexecute.yaml file: ${error.message}`,
                            },
                        ],
                    };
                }
            }
        );
    }

    private registerSetupCredentials() {
        this.server.tool(
            "setup-lambdatest-credentials",
            "Collect LambdaTest credentials if NOT ALREADY provided from user input (must be entered manually, cannot be inferred).",
            {
                LT_USERNAME: z
                    .string()
                    .describe("Provide your LambdaTest username Manually (Copy if from link: https://hyperexecute.lambdatest.com/hyperexecute)"),
                LT_ACCESS_KEY: z
                    .string()
                    .describe("Provide your LambdaTest access key Manually"),
            },
            async ({ LT_USERNAME, LT_ACCESS_KEY }) => {
                // Override global vars only if user provides
                if (LT_USERNAME) this.username = LT_USERNAME;
                if (LT_ACCESS_KEY) this.accessKey = LT_ACCESS_KEY;
                return {
                    content: [
                        {
                            type: "text",
                            text: (!this.username || !this.accessKey)
                                ? `Please provide LambdaTest credentials to run tests on HyperExecute;
               Can be found in the link: https://hyperexecute.lambdatest.com/hyperexecute`
                                : `LambdaTest credentials configured successfully for user: ${this.username}`,
                        },
                    ],
                };
            }
        );
    }

    private registerRunTests() {
        this.server.tool(
            "run-tests-on-hyperexecute",
            `Run the tests present in the framework on Hyperexecute lambdatest test tool platform, requires hyperexecute cli, lambdatest-credentials, hyperexecute yaml file and framework compatible with Hyperexecute CLI.`,
            {},
            async () => {
                // Make control variables false before running the test
                [this.jobStarted, this.noError, this.uploadStarted, this.uploadDone, this.serverConnected, this.jobLink, this.jobDone] = Array(7).fill(false);
                try {
                    let lastCliOutput = "";
                    const filePath = fileOps.findFileAbsolutePath(process.cwd(), 'hyperexecute-cli.log');
                    if (filePath) fileOps.deleteFile('hyperexecute-cli.log');

                    lastCliOutput = await cliLog.runTest(this.username, this.accessKey);

                    this.jobStarted = await cliLog.isJobTriggered();
                    const message = this.jobStarted ? "CLI Job triggered successfully" : `Failed to trigger CLI Job. CLI said: ${lastCliOutput || "no output yet"}`;

                    return {
                        content: [{
                            type: "text",
                            text: message
                        }]
                    };
                } catch (error: any) {
                    console.error('Error Message: \n' + error.message); // Log the error for debugging - you can see it in MCP inpsector bottom-left
                    return {
                        content: [{
                            type: "text",
                            text: `Error running test in hyperexecute CLI: ${error.message}`
                        }]
                    };
                }
            }
        );
    }

    private registerAnalyzeCliRun() {
        this.server.tool(
            "analyze-hyperexecute-cli-run",
            `Post test runs in hyperexecute CLI, analyze the hyperexecute-cli.logs file to get the Job Link. 
             Keep on checking for the Job Link until it is found in logs or job is terminated.`,
            {},
            async () => {
                try {
                    let message = "";

                    if (!this.jobStarted) {
                        this.jobStarted = await cliLog.isJobTriggered();
                        if (this.jobStarted) {
                            message = `CLI Job triggered successfully, lets check for the job link.`;
                        } else {
                            throw new Error("Tests not started - Please run the tests in hyperexecute CLI.");
                        }
                        return {
                            content: [{
                                type: "text",
                                text: message
                            }]
                        };
                    }

                    if (this.jobStarted && !this.noError) {
                        const firstResult = await cliLog.detectFirstCLIEvent();
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
                            default:
                                message = "None of the errors are found, can proceed looking for the job link in cli logs.";
                                this.noError = true;
                        }
                        return {
                            content: [{
                                type: "text",
                                text: message
                            }]
                        };
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
                                    // If job link step → fetch dynamic link
                                    if (step.onSuccess) {
                                        this.jobExecutionLink = await step.onSuccess();
                                        return { content: [{ type: "text", text: step.message(this.jobExecutionLink) }] };
                                    }
                                    return { content: [{ type: "text", text: step.message }] };
                                }
                            }
                        }
                    }

                    // Deadlock prevention → job ended but no jobLink
                    if (!this.jobLink) {
                        this.jobDone = await cliLog.isJobTrackStopped();
                        if (this.jobDone) {
                            throw new Error("Job link is not generated, but test has been terminated.");
                        }
                        // Still running but no link yet
                        return { content: [{ type: "text", text: "Job is still running, waiting for job link..." }] };
                    }

                    // Job link already found
                    return { content: [{ type: "text", text: `Job link is generated. Here is the job link: ${this.jobExecutionLink}` }] };

                } catch (error: any) {
                    console.error(error.message);
                    return {
                        content: [{
                            type: "text",
                            text: `Error getting the job link: ${error.message}. \n Exiting the user request. Kindly analyze your project manually & try again later!`
                        }]
                    };
                }
            });
    }

    // -------- Start Server --------
    public start() {
        const transport = new StdioServerTransport();
        this.server.connect(transport);
    }
}
