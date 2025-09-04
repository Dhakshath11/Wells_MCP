import * as creator from "../src/yaml-creator";

describe("yaml-creator.ts", () => {
    it("should create file and print result", () => {
        const result = creator.hyperexecuteYamlCreator("TestProjectName", "46517TEST810");
        console.log(result);
    });
});
