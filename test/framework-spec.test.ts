import { test, expect } from "/Users/dhakshath/Documents/Wells_MCP/lambdatest-setup.js";
import * as analyzer from "../src/framework-spec";

describe("framework-spec.ts", () => {
  it("should parse analysis log and print result", () => {
    const result = analyzer.FrameworkSpecAnalyzer.testFrameworkSpec();
    console.log("Analysis result:", result);
  });
});
