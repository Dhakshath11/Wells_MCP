/**
 * yaml-creator.test.ts
 *
 * Test suite for hyperexecute YAML file creation utilities.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Validates creation and printing of LambdaTest hyperexecute YAML files using yaml-creator module.
 */

import { HyperexecuteYaml } from "../src/server/tools/yaml-creator.js";

describe("yaml-creator.ts", () => {
    it("should create Hyperexecute yaml file for PLAYWRIGHT and print result", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        const result = await yamlcreater.createYamlForPlaywright("TestProjectName", "46517TEST810");
        console.log(result);
    });
});

describe("yaml-creator.ts", () => {
    it("should create Hyperexecute yaml file for Karate - MAVEN and print result", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        const result = await yamlcreater.createYamlForKarate("TestProjectName", "46517TEST810", "MAVEN");
        console.log(result);
    });
});

describe("yaml-creator.ts", () => {
    it("should create Hyperexecute yaml file for Karate - GRADLE and print result", async () => {
        const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
        const result = await yamlcreater.createYamlForKarate("TestProjectName", "46517TEST810", "GRADLE");
        console.log(result);
    });
});