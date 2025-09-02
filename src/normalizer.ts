// Author: @Dhakshath
// Date: 29 Aug 2025
import * as fs from "fs";
import * as path from "path";

// Define output interface (strict)
/**
 * @deprecated This interface is deprecated and will be removed in a future version
 */
export interface NormalizedOutput {
  // NormalizedOutput defines the strict output structure for normalized data
  language: string;
  version: string;
  BuildTool: string | null;
  PackageManager: string | null;
  runson: string;
  testFramework: string | null;
  testTool: string | null;
  testFiles: string[];
}

/**
 * @deprecated This pattern is deprecated and will be removed in a future version
 */
export const NormalizedPattern: Record<string, string> = {
  language: "string",
  version: "string",
  BuildTool: "string | null",
  PackageManager: "string | null",
  runson: "string",
  testFramework: "string | null",
  testTool: "string | null",
  testfiles: "string[]",
};


/** 
 * Normalizer function:
 * This function takes an input object and normalizes it to a strict output format
 * Problem would be, normalize function cannot predict what type or how the passed inputs would be structured, suppose
 * Input json may be nested inside HyperExecuteAnalyzer or May not be; Also It can json keys within input may vary, example it may have Runtimeversion or just version
 * Refer to below Inputs - which are different kind of inputs
 * @deprecated This pattern is deprecated and will be removed in a future version
 * */

export function normalize(input: any): NormalizedOutput {
  try {
    // 🔹 Ensure analyzer always points to the correct object
    const analyzer =
      input?.HyperExecuteAnalyzer && typeof input.HyperExecuteAnalyzer === "object"
        ? input.HyperExecuteAnalyzer
        : input;

    // Extract build tool + package manager separately because framework can have either one
    const buildTool = extractBuildTool(analyzer);
    const packageManager = extractPackageManager(analyzer);

    return {
      language: extractLanguage(analyzer),
      version: extractVersion(analyzer),
      BuildTool: buildTool ?? null,
      PackageManager: buildTool ? null : (packageManager ?? null),
      runson: extractOS(analyzer),
      testFramework: extractTestFramework(analyzer),
      testTool: extractTestTool(buildTool ?? packageManager),  // If buildTool is null, then go to packageManager; cause either one can be present
      testFiles: extractTestFiles(analyzer),
    };
  } catch (error: any) {
    console.error("Error normalizing input:", error?.message || error);
    throw new Error("Failed to normalize input: " + (error?.message || error));
  }
}

/**
 * getKey: Returns the value for the first matching key (case-insensitive).
 */
const getKey = (obj: any, keys: string[], fallback: any = undefined): any => {
  if (!obj || typeof obj !== "object") return fallback;
  const lowerObj: Record<string, any> = {};
  for (const k in obj) lowerObj[k.toLowerCase()] = obj[k];
  for (const key of keys) {
    const val = lowerObj[key.toLowerCase()];
    if (val !== undefined) return val;
  }
  return fallback;
};

// 🔹 Language
const extractLanguage = (analyzer: any): string => {
  let language = getKey(analyzer, ["PrimaryLanguage", "Language"], "unknown");
  return language === "eScript" ? "TypeScript" : language;
};

// 🔹 Runtime version
const extractVersion = (analyzer: any): string => {
  const runtimeVersion = getKey(analyzer, ["RuntimeVersion", "JavaVersion", "version"]);
  if (Array.isArray(runtimeVersion)) {
    const valid = runtimeVersion.find((v: string) => /\d+\.\d+\.\d+/.test(v));
    return valid?.match(/(\d+\.\d+\.\d+)/)?.[1] ?? valid ?? "";
  }
  if (typeof runtimeVersion === "string") {
    return runtimeVersion.match(/(\d+\.\d+\.\d+)/)?.[1] ?? runtimeVersion;
  }
  return "";
};

// 🔹 Build tool + Package manager (merged style)
const extractBuildTool = (analyzer: any): string | null =>
  getKey(analyzer, ["BuildTool"], null);

const extractPackageManager = (analyzer: any): string | null =>
  getKey(analyzer, ["PackageManager", "PackageManagerName"], null);

// 🔹 OS
const extractOS = (analyzer: any): string => {
  const osValue = getKey(analyzer, ["OS", "OperatingSystem"]);
  const buildDetailsOS = analyzer?.BuildDetails?.OS;

  if (typeof buildDetailsOS === "string") {
    return buildDetailsOS.toLowerCase().includes("mac") ? "mac" : buildDetailsOS;
  }
  if (typeof osValue === "string") {
    return osValue.toLowerCase().includes("mac") ? "mac" : osValue;
  }
  if (typeof osValue === "object") {
    return osValue?.Family ?? osValue?.Name ?? "unknown";
  }
  return "unknown";
};

// 🔹 Test framework
const extractTestFramework = (analyzer: any): string | null => {
  const tf = getKey(analyzer, ["TestFrameworks", "TestFramework"]);
  if (Array.isArray(tf) && tf.length > 0) return tf[0]?.Name ?? null;
  if (typeof tf === "string" && tf !== "N/A") return tf;
  return null;
};

// 🔹 Test files
const extractTestFiles = (analyzer: any): string[] => {
  const testFilesTree = getKey(analyzer, ["TestFilesTree", "TestFiles"]);

  if (Array.isArray(testFilesTree)) return testFilesTree;
  if (typeof testFilesTree === "string") return [testFilesTree];

  if (typeof testFilesTree === "object" && testFilesTree.structure) {
    const extractFiles = (items: any[]): string[] =>
      items.flatMap((item) =>
        item.type === "file" && item.name
          ? [item.name]
          : Array.isArray(item.children)
            ? extractFiles(item.children)
            : []
      );
    return extractFiles(testFilesTree.structure);
  }
  return [];
};

// 🔹 Test Tool
// Does not support Python
const extractTestTool = (buildTool: string | null): string | null => {
  try {
    if (!buildTool) return null;

    const projectRoot = process.cwd();
    buildTool = buildTool.toLowerCase();

    if (buildTool === "maven") {
      const pomPath = findDependencyFile(projectRoot, "pom.xml");
      return pomPath ? extractMavenToolSync(pomPath) : null;
    }
    if (buildTool === "gradle") {
      const gradlePath = findDependencyFile(projectRoot, "build.gradle") ||
        findDependencyFile(projectRoot, "build.gradle.kts");  // If build.gradle is null; then look for build.gradle.kts
      return gradlePath ? extractGradleTool(gradlePath) : null;
    }
    if (buildTool === "npm") {
      const pkgPath = findDependencyFile(projectRoot, "package.json");
      return pkgPath ? extractNpmTool(pkgPath) : null;
    }

    return null;
  } catch (error: any) {
    console.error("Error extracting test tool:", error?.message || error);
    return null;
  }
}

function findDependencyFile(
  dir: string,
  fileName: string,
  maxDepth: number = 5
): string | null {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory() && file.name === "node_modules") {
        continue; // skip node_modules as it will contain package.json file
      }
      if (file.isFile() && file.name.toLowerCase() === fileName.toLowerCase()) {
        return fullPath;
      }
      if (file.isDirectory() && maxDepth > 0) {
        const found = findDependencyFile(fullPath, fileName, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch {
    // ignore permission errors
  }
  return null;
}

function extractMavenToolSync(pomPath: string): string | null {
  const pom = fs.readFileSync(pomPath, "utf-8");

  // Simple regex-based parsing instead of XML parsing
  const seleniumMatch = pom.match(/<artifactId>selenium-java<\/artifactId>\s*<version>([^<]+)<\/version>/);
  if (seleniumMatch) return `selenium@${seleniumMatch[1]}`;

  const qafMatch = pom.match(/<artifactId>qaf<\/artifactId>\s*<version>([^<]+)<\/version>/);
  if (qafMatch) return `qaf@${qafMatch[1]}`;

  const karateMatch = pom.match(/<artifactId>karate<\/artifactId>\s*<version>([^<]+)<\/version>/);
  if (karateMatch) return `karate@${karateMatch[1]}`;

  return null;
}

function extractGradleTool(gradlePath: string): string | null {
  const gradle = fs.readFileSync(gradlePath, "utf-8");

  const match = (pattern: RegExp): string | null => gradle.match(pattern)?.[1] ?? null;

  if (gradle.includes("selenium-java")) {
    return `selenium@${match(/selenium-java:([\d.]+)/) ?? "latest"}`;
  }
  if (gradle.includes("qmetry")) {
    return `qaf@${match(/qaf.*:([\w\-.]+)/) ?? "latest"}`;
  }
  if (gradle.includes("karate")) {
    return `karate@${match(/karate.*:([\d.]+)/) ?? "latest"}`;
  }

  return null;
}

function extractNpmTool(pkgPath: string): string | null {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps["@playwright/test"] || deps["playwright"]) {
    return `playwright@${(deps["@playwright/test"] || deps["playwright"]).replace(/^\^/, "")}`;
  }

  if (deps["selenium"] || deps["selenium-webdriver"]) {
    return `selenium@${(deps["selenium"] || deps["selenium-webdriver"]).replace(/^\^/, "")}`;
  }
  return null;
}


// --------------------
// Example Inputs (varied formats)
// --------------------
const javaGradleInput = {
  HyperExecuteAnalyzer: {
    PrimaryLanguage: "Java",
    RuntimeVersion: [
      'openjdk version "17.0.15" 2025-04-15 LTS OpenJDK Runtime Environment',
      "Corretto-17.0.15.6.1 (build 17.0.15+6-LTS)",
      "OpenJDK 64-Bit Server VM Corretto-17.0.15.6.1 (build 17.0.15+6-LTS, mixed mode, sharing)"
    ],
    BuildTool: "gradle",
    BuildToolVersion: "Gradle 8.14",
    BuildDetails: { OS: "Mac OS X 15.6 aarch64" },
    TestFrameworks: [{ Name: "junit5", Version: "5.9.3" }],
    testFilesTree: ["src/test/java/TestRunner.java"]
  }
};

const jsInput = {
  HyperExecuteAnalyzer: {
    PrimaryLanguage: "JavaScript",
    RuntimeVersion: "v18.20.8",
    PackageManager: "npm",
    PackageManagerVersion: "10.8.2",
    TestFrameworks: "N/A",
    PrivateRegistry: "N/A",
    PrivateEndpoints: "N/A",
    InaccessibleURLs: "N/A",
    TestFilesTree: ["tests/page_test.spec.js"]
  }
};

const javaMavenInput = {
  HyperExecuteAnalyzer: {
    PrimaryLanguage: "Java",
    RuntimeVersion: [
      'openjdk version "17.0.15" 2025-04-15 LTS OpenJDK Runtime Environment',
      "Corretto-17.0.15.6.1 (build 17.0.15+6-LTS)",
      "OpenJDK 64-Bit Server VM Corretto-17.0.15.6.1 (build 17.0.15+6-LTS, mixed mode, sharing)"
    ],
    Module: "bandwidth:my-bandwidth-project:0.0.1-SNAPSHOT",
    CompilerRelease: "11",
    BuildTool: "maven",
    BuildToolVersion:
      "Apache Maven 3.9.9 (8e8579a9e76f7d015ee5ec7bfcdc97d260186937)",
    MavenHome: "/opt/homebrew/Cellar/maven/3.9.9/libexec",
    JavaVersion: "17.0.15",
    JavaVendor: "Amazon.com Inc.",
    JavaRuntime: "/Users/dhakshath/.sdkman/candidates/java/17.0.15-amzn",
    Locale: "en_IN",
    PlatformEncoding: "UTF-8",
    OS: {
      Name: "mac os x",
      Version: "15.6",
      Arch: "aarch64",
      Family: "mac"
    },
    TestFrameworks: [{ Name: "testng", Artifact: "org.testng:testng:7.1.0" }],
    PrivateRepository: "N/A",
    PrivateEndpoints: "N/A",
    InaccessibleURLs: "N/A",
    TestFilesTree: [
      "src/test/java/com/bandwidth/CrossBrowserTest.java",
      "src/test/java/com/bandwidth/commons/Inputs/TestCaseInputs.java",
      "src/test/java/com/bandwidth/commons/Report/TestListener.java",
      "src/test/java/com/bandwidth_QAF/SampleQAFTest.java"
    ]
  }
};

const testInput = {
  "HyperExecuteAnalyzer": {
    "language": "TypeScript",
    "version": "v18.20.8",
    "BuildTool": null,
    "PackageManager": "npm",
    "OS": "mac",
    "testFramework": null,
    "testFiles": []
  }
};

// New example matching the HyperExecute output format we saw
const hyperExecuteOutputInput = {
  "PrimaryLanguage": "TypeScript",
  "RuntimeVersion": "v18.20.8",
  "PackageManager": "npm",
  "PackageManagerVersion": "10.8.2",
  "TestFrameworks": "N/A",
  "PrivateRegistry": "N/A",
  "PrivateEndpoints": "N/A",
  "InaccessibleURLs": "N/A",
  "TestFilesTree": {
    "root": "/Users/dhakshath/Documents/Wells_MCP",
    "structure": [
      {
        "type": "directory",
        "name": "test",
        "children": [
          {
            "type": "file",
            "name": "normalizer.test.ts"
          }
        ]
      }
    ]
  }
};

// --------------------
// Run Transformation (all inputs)
// --------------------
// You can test with any combination of input objects below
const inputs = [javaGradleInput, jsInput, javaMavenInput, testInput, hyperExecuteOutputInput];
const outputs: NormalizedOutput[] = inputs.map(normalize);

// Print normalized output for inspection
// console.log(JSON.stringify(outputs, null, 2));