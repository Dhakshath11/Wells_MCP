import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";
import { exec } from "child_process";
import util from "util";
import { FrameworkSpecAnalyzer, AnalysisOutput } from "./framework-spec";
import { hyperexecuteYamlCreator } from "./yaml-creator";
import { playwrightConfigSetup } from "./playwright-setup/playwright-config-setup";
import { updateImportPaths } from "./playwright-setup/playwright-lambdatest-setup";
import * as fileOps from './commons/fileOperations.js';
import * as cliLog from './cli-log.js';

let frameworkSpecObject: FrameworkSpecAnalyzer | null = null;
let username = process.env.LT_USERNAME;
let accessKey = process.env.LT_ACCESS_KEY;
let [jobStarted, noError, uploadStarted, uploadDone, serverConnected, jobLink, jobDone] = Array(7).fill(false);
let jobExecutionLink = "";

/**
 * MCP server for Hyperexecute-Wells Tool - Entry Point
 */
// const server = new McpServer({
//   name: "Hyperexecute-Wells Tool",        // <- Uncomment it
//   version: "1.0.0"
// });

const execAsync = util.promisify(exec);

// Return type to tool would be "text, image, audio or resource"

// Tool to check if CLI is present
server.tool(
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

// Tool to download the CLI
server.tool(
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
          text: `Downloaded the file, here is Response: ${stderr}`
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

// Tool to run hyperexecute analyzer
server.tool(
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
        frameworkSpecObject = new FrameworkSpecAnalyzer(); // Object is stored globally
        const frameworkSpec: AnalysisOutput = frameworkSpecObject.parseAnalysisLog();
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

// Tool to make the framework compatible with Hyperexecute CLI
server.tool(
  "make-hyperexecute-compatible",
  `Make the framework compatible with Hyperexecute CLI.`,
  {},
  async ({ }) => {
    try {
      if (!frameworkSpecObject) frameworkSpecObject = new FrameworkSpecAnalyzer();
      const packageManager: string = frameworkSpecObject.getField('packageManager');
      const testFrameworks: string[] = frameworkSpecObject.getField('testFrameworks');
      const testFiles: string[] = frameworkSpecObject.getField('testFiles');

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

// Tool to create hyperexecute yaml file
server.tool(
  "create-hyperexecute-yaml-file",
  `Create a hyperexecute yaml file for the this framework.`,
  {
    projectName: z.string().describe("Provide your  project name found in https://hyperexecute.lambdatest.com/hyperexecute/projects"),
    projectID: z.string().describe("Provide your project ID"),
  },
  async ({ projectName, projectID }) => {
    try {
      if (!frameworkSpecObject) frameworkSpecObject = new FrameworkSpecAnalyzer();
      const packageManager: string = frameworkSpecObject.getField('packageManager');
      const testFrameworks: string[] = frameworkSpecObject.getField('testFrameworks');
      const testFiles: string[] = frameworkSpecObject.getField('testFiles');

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

// Pass the credentials from env variables, let LLM model shall not use it. -> Change it to env variables
server.tool(
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
    if (LT_USERNAME) username = LT_USERNAME;
    if (LT_ACCESS_KEY) accessKey = LT_ACCESS_KEY;
    return {
      content: [
        {
          type: "text",
          text: (!username || !accessKey)
            ? `Please provide LambdaTest credentials to run tests on HyperExecute;
               Can be found in the link: https://hyperexecute.lambdatest.com/hyperexecute`
            : `LambdaTest credentials configured successfully for user: ${username}`,
        },
      ],
    };
  }
);


// Tool to run 
server.tool(
  "run-tests-on-hyperexecute",
  `Run the tests present in the framework on Hyperexecute lambdatest test tool platform, requires hyperexecute cli, lambdatest-credentials, hyperexecute yaml file and framework compatible with Hyperexecute CLI.`,
  {},
  async () => {
    // Make control variables false before running the test
    [jobStarted, noError, uploadStarted, uploadDone, serverConnected, jobLink, jobDone] = Array(7).fill(false);
    try {
      let lastCliOutput = "";
      fileOps.deleteFile('hyperexecute-cli.log');
      exec(`./hyperexecute --user ${username} --key ${accessKey} --config hyperexecute.yaml --no-track`,
        (error, stdout, stderr) => {
          if (error || stderr) {
            console.error(`exec error: ${error?.message || stderr}`);
            return;
          }
          console.error(`stdout: ${stdout}`);
          lastCliOutput = stdout;
        }
      );

      jobStarted = await cliLog.isJobTriggered();
      const message = jobStarted ? "CLI Job triggered successfully" : `Failed to trigger CLI Job. CLI said: ${lastCliOutput || "no output yet"}`;

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
          text: `Error running test in hyperexecute CLI: ${error.message}`
        }]
      };
    }
  }
);

// Analyze the CLI-RUN
server.tool(
  "analyze-hyperexecute-cli-run",
  `Post test runs in hyperexecute CLI, analyze the hyperexecute-cli.logs file to get the Job Link. 
  Keep on checking for the Job Link until it is found in logs or job is terminated.`,
  {},
  async () => {
    try {
      let message = "";

      if (!jobStarted) {
        jobStarted = await cliLog.isJobTriggered();
        if (jobStarted) {
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

      if (jobStarted && !noError) {
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
            noError = true;
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
          condition: () => !uploadStarted,
          check: async () => (uploadStarted = await cliLog.isUploadArchiveStarted()),
          message: "Uploading archives started. Please wait for the archives to be uploaded."
        },
        {
          condition: () => uploadStarted && !uploadDone,
          check: async () => (uploadDone = await cliLog.isUploadArchiveDone()),
          message: "Uploading archives done. Let's wait for the server connection to be established."
        },
        {
          condition: () => uploadDone && !serverConnected,
          check: async () => (serverConnected = await cliLog.isServerConnectionStarted()),
          message: "Server connection established. Please wait for the job link or at least test to terminate."
        },
        {
          condition: () => serverConnected && !jobLink,
          check: async () => (jobLink = await cliLog.isJobLinkGenerated()),
          message: (link: string) => `Job link is generated. Here is the job link: ${link}`,
          onSuccess: async () => await cliLog.getJobLink()
        }
      ];

      if (jobStarted && !jobDone) {
        for (const step of jobSteps) {
          if (step.condition()) {
            const result = await step.check();
            if (result) {
              // If job link step → fetch dynamic link
              if (step.onSuccess) {
                jobExecutionLink = await step.onSuccess();
                return { content: [{ type: "text", text: step.message(jobExecutionLink) }] };
              }
              return { content: [{ type: "text", text: step.message }] };
            }
          }
        }
      }

      // Deadlock prevention → job ended but no jobLink
      if (!jobLink) {
        jobDone = await cliLog.isJobTrackStopped();
        if (jobDone) {
          throw new Error("Job link is not generated, but test has been terminated.");
        }
        // Still running but no link yet
        return { content: [{ type: "text", text: "Job is still running, waiting for job link..." }] };
      }

      // Job link already found
      return { content: [{ type: "text", text: `Job link is generated. Here is the job link: ${jobExecutionLink}` }] };

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

const transport = new StdioServerTransport();
server.connect(transport);