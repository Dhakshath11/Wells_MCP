import { expect } from 'chai';
import { normalize, NormalizedOutput } from './normalizer';
import { describe, it } from 'mocha';

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
        TestFilesTree: ["src/test/java/TestRunner.java"]
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
        "testfiles": []
    }
};

// --------------------
// Run Transformation (all inputs)
// --------------------
const inputs = [javaGradleInput, jsInput, javaMavenInput, testInput];
const outputs: NormalizedOutput[] = inputs.map(normalize);
/** --- ABOVE IS AN ALTERNATIVE WAY TO WRITE THE MAP FUNCTION ---
 * const outputs: NormalizedOutput[] = [];
 * for (const input of inputs) {
 * const result = normalize(input);
 * outputs.push(result);
 * }
 */

// Print normalized output for inspection
describe('Normalizer Function', () => {
    it('should normalize all example inputs', () => {
        console.log(JSON.stringify(outputs, null, 2));
        expect(outputs).to.exist;
        expect(outputs.length).to.equal(inputs.length);
        outputs.forEach(output => {
            expect(output.language).to.exist;
            expect(Array.isArray(output.testFiles)).to.be.true;
        });
    });
});

// To Run this --> 
// npx mocha -r tsx test/normalizer.test.ts
// OR
// npm run test_normalizer
