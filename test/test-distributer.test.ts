import * as distributer from "../src/playwright-setup/playwright-test-distributer.ts";
import { HyperexecuteYaml } from "../src/server/tools/yaml-creator";

describe("playwright-test-distributer.ts", () => {
    it("Distribute the tests by Test and update it in YAML file", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        const testDir = distributer.testExistsInDirectory("src");
        const command = distributer.playwrightTestDistributer_ByTest(testDir);
        let result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Groups and update it in YAML file", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        const testDir = distributer.testExistsInDirectory("test");
        const command = distributer.playwrightTestDistributer_ByTestGroups(testDir);
        let result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Name 'Navigation' and update it in YAML file", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        distributer.tagsExistsInTest("login");
        const command = distributer.playwrightTestDistributer_ByTagName("login");
        let result = await yamlcreater.updateField("TestDiscoveryCommand", command);
        result = await yamlcreater.updateField("TestRunnerCommand", "npx playwright test $test");
        console.log(result);
    });

    it("Distribute the tests by Test Tag '@smoke' and update it in YAML file", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        distributer.tagsExistsInTest("@smoke1");
        const command = distributer.playwrightTestDistributer_ByTagName("@smoke");
        let result = await yamlcreater.updateField("TestDiscoveryCommand", command);
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
