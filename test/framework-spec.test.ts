/**
 * framework-spec.test.ts
 *
 * Test suite for framework specification analysis utilities.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Validates parsing and printing of analysis results from framework-spec module.
 */

import * as analyzer from "../src/server/tools/framework-spec.js";
import * as fileOps from "../src/commons/fileOperations.js";

const pomXmlSample = `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>
    <groupId>bandwidth</groupId>
    <artifactId>my-bandwidth-project</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>my-bandwidth-project</name> <!-- FIXME change it to the project's website -->
    <url>http://www.example.com</url>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.release>11</maven.compiler.release>
    </properties>

    <dependencies>
        <!-- https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>4.30.0</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.testng/testng -->
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>7.1.0</version>
            <scope>test</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/junit/junit -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.aventstack/extentreports -->
        <dependency>
            <groupId>com.aventstack</groupId>
            <artifactId>extentreports</artifactId>
            <version>5.0.9</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.qmetry/qaf -->
        <dependency>
            <groupId>com.qmetry</groupId>
            <artifactId>qaf</artifactId>
            <version>4.0.0-RC3</version>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-server -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-server</artifactId>
            <version>4.0.0-alpha-2</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>4.35.0</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.qmetry/qaf -->
        <dependency>
            <groupId>com.qmetry</groupId>
            <artifactId>qaf</artifactId>
            <version>4.0.0-RC3</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.intuit.karate/karate-junit4 -->
        <dependency>
            <groupId>com.intuit.karate</groupId>
            <artifactId>karate-junit4</artifactId>
            <version>1.4.0.RC3</version>
            <scope>test</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.intuit.karate/karate-core -->
        <dependency>
            <groupId>com.intuit.karate</groupId>
            <artifactId>karate-core</artifactId>
            <version>1.4.1</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.intuit.karate/karate-apache -->
        <dependency>
            <groupId>com.intuit.karate</groupId>
            <artifactId>karate-apache</artifactId>
            <version>0.9.6</version>
            <scope>test</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.intuit.karate/karate-junit5 -->
        <dependency>
            <groupId>com.intuit.karate</groupId>
            <artifactId>karate-junit5</artifactId>
            <version>1.4.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
    </build>

</project>
`;

const gradleSample = `
plugins {
    id('java')
}

group = 'com.lambdatest.sample'
version = '1.0-SNAPSHOT'

repositories {
    mavenCentral()
}

dependencies {
    // https://mvnrepository.com/artifact/com.intuit.karate/karate-junit5
    testImplementation('com.intuit.karate:karate-junit5:1.4.1')

    // https://mvnrepository.com/artifact/com.intuit.karate/karate-junit5
    testImplementation("com.intuit.karate:karate-junit5:1.4.1")

    // https://mvnrepository.com/artifact/com.intuit.karate/karate-apache
    testImplementation("com.intuit.karate:karate-apache:0.9.6")

    // https://mvnrepository.com/artifact/com.intuit.karate/karate-core
    implementation("com.intuit.karate:karate-core:1.4.1")

    // https://mvnrepository.com/artifact/com.intuit.karate/karate-junit4
    testImplementation("com.intuit.karate:karate-junit4:1.4.0.RC3")

    // https://mvnrepository.com/artifact/com.qmetry/qaf
    implementation("com.qmetry:qaf:4.0.0-RC3")

    // https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java
    implementation("org.seleniumhq.selenium:selenium-java:4.35.0")

    // https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-server
    implementation("org.seleniumhq.selenium:selenium-server:4.0.0-alpha-2")
}

test {
    useJUnitPlatform()
    maxParallelForks = 4

    // pull karate options into the runtime
    systemProperty "karate.options", System.getProperty("karate.options")

    // ensure tests are always run
    outputs.upToDateWhen { false }
}
`;

const featureFileContent = `
@DeleteRequest
Feature: Delete user in DB

  Background:
    * url baseURL
    * header Accept = 'application/json'
    * header x-api-key = 'reqres-free-v1'

  @UpdateUser
  Scenario: Delete Existing User
    Given path 'api/users/2'
    When method DELETE
    Then status 204
    And print response
`;


const createMockLogFile = (name: string, content: string) => {
  fileOps.writeFile(name, content);
};

// ✅ Generic test runner
const runFrameworkAnalysisTest = (
  testName: string,
  logContent: string,
  extraFiles: Record<string, string> = {}
) => {
  describe("framework-spec.ts", () => {
    it(testName, () => {
      // Create log file
      createMockLogFile("hyperexecute-analyze.log", logContent);
      createMockLogFile("TestFeature.feature", featureFileContent);  // To ensure Karate Files is detected :- Only for Maven & Gradle Projects

      // Create any extra project files
      for (const [fileName, content] of Object.entries(extraFiles)) {
        createMockLogFile(fileName, content);
      }

      // Run analyzer
      const result = analyzer.FrameworkSpecAnalyzer.testFrameworkSpec();
      console.log(`Analysis result for ${testName}:`, result);

      // Cleanup
      fileOps.deleteFile("hyperexecute-analyze.log");
      fileOps.deleteFile("TestFeature.feature");
      for (const fileName of Object.keys(extraFiles)) {
        fileOps.deleteFile(fileName);
      }
    });
  });
};

// 🔹 Test cases
runFrameworkAnalysisTest("Framework Analyze for NPM Project", `
{"level":"debug","msg":"List of possible test files detected [tests/page_test.spec.js]"}
{"level":"debug","msg":"detected 4 urls for repository , [https://www.lambdatest.com/capabilities-generator/ https://playwright.dev/docs/api/class-testconfig https://www.bing.com https://www.saucedemo.com/]"}
{"level":"debug","msg":"Analysis Result {Language:JavaScript RuntimeVersion:v23.11.0 PackageManager:npm PackageManagerVersion:10.9.2 TestFrameworks:[] TestFiles:[tests/page_test.spec.js]}"}  
`);

runFrameworkAnalysisTest("Framework Analyze for Gradle Project", `
{"level":"debug","msg":"List of possible test files detected [src/test/java/TestRunner.java]"}
{"level":"debug","msg":"detected 3 urls for repository , [https://mvnrepository.com/artifact/com https://reqres.in/api/users?page=2' https://reqres.in/]"}
{"level":"debug","msg":"Analysis Result {Language:Java RuntimeVersion:openjdk version  \\"17.0.15 \\" PackageManager:gradle PackageManagerVersion:Gradle 8.14 TestFrameworks:[junit5 -> 5.9.3] TestFiles:[src/test/java/TestRunner.java]}"}  
`, {
  "build.gradle": gradleSample,
}); 

runFrameworkAnalysisTest("Framework Analyze for Maven Project", `
{"level":"debug","time":"2025-09-19T18:48:05.541+0530","caller":"analyzer/analyser.go:135","msg":"List of possible test files detected [src/test/java/com/bandwidth/CrossBrowserTest.java src/test/java/com/bandwidth/commons/Report/TestListener.java src/test/java/com/bandwidth_QAF/SampleQAFTest.java src/test/java/com/bandwidth/commons/Inputs/TestCaseInputs.java]"}
{"level":"debug","time":"2025-09-19T18:48:05.542+0530","caller":"analyzer/analyser.go:162","msg":"detected 4 urls for repository /Users/dhakshath/Documents/Frameworks/Wells/BandWidth, [http://localhost:4444 https://example.com https://google.com https://resideo.com]"}
{"level":"debug","time":"2025-09-19T18:48:06.726+0530","caller":"reporter/reporter.go:47","msg":"Analysis Result {Language:Java RuntimeVersion:openjdk version  \\"17.0.15 \\" 2025-04-15 LTS OpenJDK Runtime Environment Corretto-17.0.15.6.1 (build 17.0.15+6-LTS) OpenJDK 64-Bit Server VM Corretto-17.0.15.6.1 (build 17.0.15+6-LTS, mixed mode, sharing) Module: bandwidth:my-bandwidth-project:0.0.1-SNAPSHOT -> [maven.compiler.release: 11] PackageManager:maven PackageManagerVersion:Apache Maven 3.9.9 (8e8579a9e76f7d015ee5ec7bfcdc97d260186937) Maven home: /opt/homebrew/Cellar/maven/3.9.9/libexec Java version: 17.0.15, vendor: Amazon.com Inc., runtime: /Users/dhakshath/.sdkman/candidates/java/17.0.15-amzn Default locale: en_IN, platform encoding: UTF-8 OS name:  \\"mac os x \\", version:  \\"15.6.1 \\", arch:  \\"aarch64 \\", family:  \\"mac \\" TestFrameworks:[testng -> org.testng:testng:7.1.0 junit4 -> junit:junit:4.13.2] PrivateRegistry:[] PrivateEndpoints:[] InaccessibleURLs:[] ExternalReporters:[] TestFiles:[src/test/java/com/bandwidth/CrossBrowserTest.java src/test/java/com/bandwidth/commons/Report/TestListener.java src/test/java/com/bandwidth_QAF/SampleQAFTest.java src/test/java/com/bandwidth/commons/Inputs/TestCaseInputs.java] LangStat:[]}"}
`, {
  "pom.xml": pomXmlSample,
});