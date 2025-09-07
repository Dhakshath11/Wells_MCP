import { test, expect } from "/Users/dhakshath/Documents/Wells_MCP/lambdatest-setup.js";
import * as creator from "../src/server/tools/yaml-creator";

describe("yaml-creator.ts", () => {
    it("should create file and print result", () => {
        const result = creator.hyperexecuteYamlCreator("TestProjectName", "46517TEST810");
        console.log(result);
    });
});
