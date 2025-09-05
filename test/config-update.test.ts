import { test, expect } from "/Users/dhakshath/Documents/Wells_MCP/lambdatest-setup.js";
import * as configSetup from "../src/playwright-setup/playwright-config-setup";

describe("playwright-config-setup.ts", () => {
    it("Update the file to add capabilities and projects block", () => {
        const result = configSetup.playwrightConfigSetup();
        console.log(result);
    });
});
