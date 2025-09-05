import { test, expect } from "/Users/dhakshath/Documents/Wells_MCP/lambdatest-setup.js";
import * as importUpdate from "../src/playwright-setup/playwright-lambdatest-setup";

describe("playwright-lambdatest-setup", () => {
    it("replace the import paths in the test files from playwright to lambdatest", () => {
        const testFiles: string[] = ['test/framework-spec.test.ts', 'test/yaml-creator.test.ts', 'test/config-update.test.ts', 'test/import-update.test.ts'];
        importUpdate.updateImportPaths(testFiles);
        console.log("Check if these files are updated to new i ports \n" + testFiles);
    });
});
