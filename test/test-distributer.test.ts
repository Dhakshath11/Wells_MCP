import * as distributer from "../src/playwright-setup/playwright-test-distributer.ts";
import { HyperexecuteYaml } from "../src/server/tools/yaml-creator";

const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
let testFiles: string[] = [], testDir = ``, command = ``, result = ``;

async function yaml(): Promise<void>{
    await yamlcreater.ensureYamlFile();
}

describe("playwright-test-distributer.ts", () => {
    it("Distribute the specific tests by test name", async () => {
        await yaml();
        testFiles = distributer.does_TestExists("test-distributer.test.ts");
        testFiles = distributer.does_TestExists("cli*");
        testFiles = distributer.does_TestExists("*.test.*");
        testFiles = distributer.does_TestExists("*.test.ts");
        command = distributer.playwrightTestDistributer_BySpecificTest(testFiles);
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test and update it in YAML file", async () => {
        await yaml();
        testDir = distributer.does_DirectoryHaveTests("test");
        command = distributer.playwrightTestDistributer_ByTest(testDir);
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Groups and update it in YAML file", async () => {
        await yaml();
        testDir = distributer.does_DirectoryHaveTests("test");
        command = distributer.playwrightTestDistributer_ByTestGroups(testDir);
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Name 'Navigation' and update it in YAML file", async () => {
        await yaml();
        distributer.does_TestContainTag("login");
        command = distributer.playwrightTestDistributer_ByTagName("login");
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Tag '@smoke' and update it in YAML file", async () => {
        await yaml();
        distributer.does_TestContainTag("@smoke");
        command = distributer.playwrightTestDistributer_ByTagName("@smoke");
        result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    // --------- Kept for testing purpose, dont uncomment ---------
    /*test('valid login @smoke', async ({  }) => {
      await page.goto('https://example.com/login');
      await page.fill('#username', 'user1');
      await page.fill('#password', 'pass123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('https://example.com/dashboard');
    });*/
});
