import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";
import { exec } from "child_process";
import util from "util";
import { FrameworkSpecAnalyzer, AnalysisOutput } from "./framework-spec";
import { hyperexecuteYamlCreator } from "./yaml-creator";
import { playwrightConfigSetup } from "./playwright-setup/playwright-config-setup";
import { updateImportPaths } from "./playwright-setup/playwright-lambdatest-setup";
import { isJobTriggered, deletLogFile } from "./cli-log";

let frameworkSpecObject: FrameworkSpecAnalyzer | null = null;
let username = process.env.LT_USERNAME;
let accessKey = process.env.LT_ACCESS_KEY;

const server = new McpServer({
  name: "Hyperexecute-Wells Tool",
  version: "1.0.0"
});

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
  "Download hyperexecute CLI. Should only be called if 'hyperexecute-cli-present?' reports missing CLI.",
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

server.tool(
  "setup-lambdatest-credentials",
  "Collect LambdaTest credentials if not already provided",
  {
    LT_USERNAME: z
      .string()
      .describe("Provide your LambdaTest username (from https://hyperexecute.lambdatest.com/hyperexecute)"),
    LT_ACCESS_KEY: z
      .string()
      .describe("Provide your LambdaTest access key"),
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
            ? "Please provide LambdaTest credentials to run tests on HyperExecute"
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
    try {
      let lastCliOutput = "";
      deletLogFile();
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
      const yes = await isJobTriggered();
      const message = yes
        ? "CLI Job triggered successfully"
        : `Failed to trigger CLI Job. CLI said: ${lastCliOutput || "no output yet"}`;
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


const transport = new StdioServerTransport();
server.connect(transport);