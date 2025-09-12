/**
 * test-distributer.test.ts
 *
 * Test suite for Playwright test distribution utilities.
 *
 * Author: Dhakshath Amin
 * Date: 12 September 2025
 * Description: Validates test discovery, grouping, and YAML update logic for Playwright tests using the distributer and yaml-creator modules.
 * Covers distribution by test name, directory, group, tag, and updates YAML configuration accordingly.
 */

import * as distributer from "../src/playwright-setup/playwright-test-distributer.js";
import { HyperexecuteYaml } from "../src/server/tools/yaml-creator.js";

const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
let testDir: string = ``, command = ``, result = ``;

async function yaml(): Promise<void> {
    await yamlcreater.ensureYamlFile();
}

describe("playwright-test-distributer.ts", () => {
    it("Distribute the specific tests by test name", async () => {
        await yaml();
        let testFiles: Set<string> = new Set();
        distributer.does_TestExists("test-distributer.test.ts").forEach(testFile => testFiles.add(testFile));
        distributer.does_TestExists("cli*").forEach(testFile => testFiles.add(testFile)); //Will return the list of test files that match the pattern -> Stroing it in SET to have unique
        distributer.does_TestExists("*.test.*").forEach(testFile => testFiles.add(testFile));
        distributer.does_TestExists("*.test.ts").forEach(testFile => testFiles.add(testFile));
        command = distributer.playwrightTestDistributer_BySpecificTest(Array.from(testFiles)); // Passing array of test files
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test and update it in YAML file", async () => {
        await yaml();
        // testDir = distributer.does_DirectoryHaveTests("src/commons");
        // testDir = distributer.does_DirectoryHaveTests("src"); -> Error: No Test Exists in this Directory
        testDir = distributer.does_DirectoryHaveTests("test");
        command = distributer.playwrightTestDistributer_ByTest(["src/commons"]);    // Passing array of test directories -> Single Folders
        command = distributer.playwrightTestDistributer_ByTest(["src/commons", "src", "test"]);    // Passing array of test directories -> Multiple Folders
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Groups and update it in YAML file", async () => {
        await yaml();
        testDir = distributer.does_DirectoryHaveTests("test");
        command = distributer.playwrightTestDistributer_ByTestGroups(["src", "test"]);    // Passing array of test directories -> Multiple Folders
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Name 'login' and update it in YAML file", async () => {
        await yaml();
        distributer.does_TestContainTag("login");
        command = distributer.playwrightTestDistributer_ByTagName(["login"]);       // Passing the array of Names -> Here its only Single Name
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Tag '@smoke' and update it in YAML file", async () => {
        await yaml();
        distributer.does_TestContainTag("@smoke");
        distributer.does_TestContainTag("@regression");
        command = distributer.playwrightTestDistributer_ByTagName(["@smoke", "@regression"]);    // Passing the array of Tags -> Here its Mulitple Name
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    // --------- Kept for testing purpose, dont uncomment ---------
    /*test('valid login @smoke @regression', async ({  }) => {
      await page.goto('https://example.com/login');
      await page.fill('#username', 'user1');
      await page.fill('#password', 'pass123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('https://example.com/dashboard');
    });*/
});
