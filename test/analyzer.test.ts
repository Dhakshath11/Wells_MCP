import * as analyzer from "../src/analyzer";

describe("analyzer.ts", () => {
  it("should parse analysis log and print result", () => {
    const result = analyzer.parseAnalysisLog();
    console.log("Analysis result:", result);
  });
});
