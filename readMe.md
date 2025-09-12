### 9. test-distributer
Discovers, groups, and distributes Playwright tests in your project. Lets you find tests by name, directory, group, or tag, and generates commands to run or update YAML configuration for distributed test execution. Useful for scaling and organizing large test suites.
# Wells MCP HyperExecute Server

## Abstract
This project implements a Model Context Protocol (MCP) server for orchestrating Playwright test automation on the LambdaTest HyperExecute platform. It provides a robust, extensible backend for running, analyzing, and managing Playwright tests in cloud environments, with support for YAML configuration, CLI integration, and LambdaTest credentials management.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Directory & File Structure](#directory--file-structure)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
  - [mcp.json](#mcpjson)
  - [launch.json](#launchjson)
  - [package.json](#packagejson)
- [Usage](#usage)
- [File-by-File Breakdown](#file-by-file-breakdown)
- [Debugging](#debugging)
- [Extending to Other Projects](#extending-to-other-projects)
- [Author & License](#author--license)

---

## Project Overview
This MCP server enables Playwright test execution and analysis on LambdaTest's HyperExecute platform. It automates CLI management, YAML creation, credentials setup, and test orchestration, making it easy to integrate cloud-based testing into CI/CD pipelines or local development workflows.

---

## Directory & File Structure
```
Wells_MCP/
├── src/
│   ├── main.ts
│   ├── server/
│   │   ├── HyperexecuteServer.ts
│   │   └── tools/
│   │       ├── cli-log.ts
│   │       ├── framework-spec.ts
│   │       ├── yaml-creator.ts
│   ├── commons/
│   │   └── fileOperations.ts
│   ├── playwright-setup/
│   │   ├── playwright-config-setup.ts
│   │   ├── playwright-lambdatest-setup.ts
│   │   └── playwright-test-distributer.ts
│   ├── normalizer.ts
│   └── analyzer.ts
├── test/
│   ├── cli-log.test.ts
│   ├── config-update.test.ts
│   ├── framework-spec.test.ts
│   ├── import-update.test.ts
│   ├── normalizer.test.ts
│   ├── yaml-creator.test.ts
├── hyperexecute.yaml
├── package.json
├── mcp.json
├── .vscode/
│   └── launch.json
└── README.md
```

---

## Installation & Setup
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd Wells_MCP
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure LambdaTest credentials:**
   - Set environment variables `LT_USERNAME` and `LT_ACCESS_KEY` or use the MCP tool to set them interactively.

---

## Configuration
### mcp.json
Defines the MCP server configuration, including tool registration, server name, and version. To adapt for other projects, update the `name`, `version`, and tool definitions as needed.

### launch.json
VS Code debug configuration. Add or modify entries to debug:
- The MCP server (`main.ts`)
- Individual test files (e.g., `framework-spec.test.ts`, ` cli-log.test.ts`)

Example:
```json
 {
      "type": "node",
      "request": "launch",
      "name": "Debug Framework-Spec Test: framework-spec.test.ts",
      "program": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": [
        "${workspaceFolder}/node_modules/.bin/mocha",
        "${workspaceFolder}/test/framework-spec.test.ts"
      ],
      "runtimeArgs": [],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
```

### package.json
Specifies project metadata, dependencies, scripts, and dev tools. Key scripts:
- `start`: Launches the MCP server - Inspector for local debug
- `test_framework_spec`, etc.: Runs specific test suites

Update dependencies and scripts as needed for your project.

---

## Usage
- **Start the MCP server:**
  ```sh
  npm run start
  ```
- **Run tests locally:**
  ```sh
  npm run test_framework_spec
  ```
- **Debug in VS Code:**
  Use the Run & Debug panel and select the desired configuration from `launch.json`.

---

## Server Tools Overview

The MCP server provides a set of tools to help you manage, analyze, and run Playwright tests on LambdaTest HyperExecute. Here’s a quick overview of each tool and what it does:

### 1. check-hyperexecute-cli-present
Checks if the HyperExecute CLI is installed in your project. Use this before running any analysis or tests.

### 2. get-hyperexecute-cli
Downloads the HyperExecute CLI if it’s missing, and checks if your LambdaTest credentials are set. Run this if the CLI is not present.

### 3. run-hyperexecute-analyzer
Runs the HyperExecute analyzer to inspect your project and return a summary of your test framework, runtime, and package manager. Requires the CLI to be installed.

### 4. make-hyperexecute-compatible
Updates your Playwright configuration and test files to ensure compatibility with HyperExecute. Automatically adds LambdaTest capabilities and updates imports.

### 5. create-hyperexecute-yaml-file
Prompts you to enter your LambdaTest project name and ID, then generates a `hyperexecute.yaml` file tailored for your project. This file is required for running tests on HyperExecute.

### 6. setup-lambdatest-credentials
Lets you manually set your LambdaTest username and access key if they aren’t already set in your environment. Credentials are needed to run tests on LambdaTest.

### 7. run-tests-on-hyperexecute
Runs your Playwright tests on LambdaTest HyperExecute using the CLI, credentials, and YAML file. Automates the cloud test execution process.

### 8. analyze-hyperexecute-cli-run
Analyzes the CLI log after a test run to find your job link and check for errors. Helps you track your test job and troubleshoot issues.

---
### src/main.ts
Entry point. Instantiates and starts the `HyperexecuteServer`.

### src/server/HyperexecuteServer.ts
Main server class. Registers MCP tools for CLI management, YAML creation, credentials setup, and test orchestration.

### src/server/tools/cli-log.ts
Utilities for monitoring and parsing HyperExecute CLI logs, detecting job events, and extracting job links.

### src/server/tools/framework-spec.ts
Analyzes framework specifications and parses analysis logs for test framework, runtime, and package manager info.

### src/server/tools/yaml-creator.ts
Creates and updates `hyperexecute.yaml` files, including project metadata and test runner commands.

### src/commons/fileOperations.ts
File system utilities for reading, writing, searching, and deleting files, plus relative import path calculation.


### src/playwright-setup/playwright-config-setup.ts
Updates Playwright config files to add LambdaTest capabilities and project blocks for cloud execution.

### src/playwright-setup/playwright-lambdatest-setup.ts
Replaces Playwright imports in test files with LambdaTest setup imports and comments out conflicting imports.

### src/playwright-setup/playwright-test-distributer.ts
Discovers and distributes Playwright tests in the project. Provides helpers to determine test directories, generate shell commands for test discovery, and support test grouping/tagging for efficient test runs. Integrates with MCP server tools for advanced test orchestration.

### test/
Contains test suites for each major module, validating functionality and integration.

### hyperexecute.yaml
Configuration file for LambdaTest HyperExecute runs. Generated and updated by the MCP server tools.

### package.json
Project metadata, dependencies, and scripts. Update as needed for your own project requirements.

### mcp.json
MCP server configuration. Modify to register new tools, change server name, or adapt to other frameworks.

### .vscode/launch.json
VS Code debug configurations. Add or modify entries to debug server or test files.

---

## Debugging
- Use VS Code's Run & Debug panel with `launch.json` configurations.
- Set breakpoints in any source file.
- Debug the MCP server, test files, or utility scripts as needed.

---

## Extending to Other Projects - Using MCP server

Follow these steps to use the MCP server in your own project:

1. **Clone the MCP project and install dependencies:**
  ```sh
  git clone <mcp-repo-url>
  cd <your-local-project>
  npm install
  ```

2. **Create a `.vscode` or `.cursor` directory in your local project:**
  This enables VS Code or Cursor IDE integration for debugging and agent queries.

3. **Copy the `mcp.json` file from the MCP project into your local project:**
  This configures the MCP tools and server for your environment.

4. **Go to the chat box and select the `mcp.json` by switching to agent mode:**
  This allows you to interact with the MCP agent for your project.

5. **Query the agent with useful commands, such as:**
  - Check if CLI is installed?
  - Can you analyze this project?
  - Run the test in hyperexecute CLI
  - Analyze the test run and get me job ID

These queries will trigger the corresponding MCP tools and workflows, automating your cloud test orchestration and analysis.

---

## Author & License
**Author:** Dhakshath Amin
**License:** ISC

---

## Additional Notes
- This project is designed for extensibility. Add new MCP tools by extending `HyperexecuteServer`.
- All major modules and utilities are documented for maintainability.
- For LambdaTest integration, ensure your credentials and CLI are up to date.
- For Playwright support, update config and import utilities as needed for your test structure.

---

For further help or contributions, please contact the author or open an issue in the repository.
