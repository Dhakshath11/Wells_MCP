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

const app = new HyperexecuteServer();
app.start();
