/**
 * yaml-creator.test.ts
 *
 * Test suite for hyperexecute YAML file creation utilities.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Validates creation and printing of LambdaTest hyperexecute YAML files using yaml-creator module.
 */

import * as creator from "../src/server/tools/yaml-creator";

describe("yaml-creator.ts", () => {
    it("should create file and print result", async () => {
        const result = await creator.hyperexecuteYamlCreator("TestProjectName", "46517TEST810");
        console.log(result);
    });
});
