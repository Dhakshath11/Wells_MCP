import * as analyzer from "../src/framework-spec";

describe("framework-spec.ts", () => {
  it("should parse analysis log and print result", () => {
    const result = analyzer.FrameworkSpecAnalyzer.parseAnalysisLog();
    console.log("Analysis result:", result);
  });
});
