#!/usr/bin/env node
/**
 * main.ts
 *
 * Entry point for the Wells MCP HyperExecute integration server.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Instantiates and starts the HyperexecuteServer, enabling MCP tools and LambdaTest integration.
 */

import { HyperexecuteServer } from "./server/HyperexecuteServer.js";
import * as fileOps from './commons/fileOperations.js';

function showHelp() {
    console.log(`
Usage: npx hyper-mcp-server [options]

Options:
  --help            Show this help message
  --version         Show version info

To run the MCP server:

1. Install the MCP server:
     npm install @dhakshath11/mcp-server

2. Create a mcp.json file inside the .vscode or .cursor directory of your project.

3. Add the following configuration to mcp.json:

{
  "mcpServers": {
    "playwright-mcp": {
      "command": "npx hyper-mcp-server",
      "env": {},
      "cwd": ".",
      "description": "MCP server for Playwright project"
    }
  }
}

4. Go to the chat box and select the mcp.json by switching to agent mode.
`);
}


function getVersion() {
    const pkgJson = fileOps.findFileRelativePath('.', 'package.json');
    if (pkgJson) {
        return JSON.parse(fileOps.getFileContent(pkgJson)).version;
    }
    else {
        return "1.0.0";
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--help")) {
        showHelp();
        process.exit(0);
    }

    if (args.includes("--version")) {
        const version = getVersion();
        console.log(`hyper-mcp-server version ${version}`);
        process.exit(0);
    }

    const app = new HyperexecuteServer();
    app.start();
}

main();
