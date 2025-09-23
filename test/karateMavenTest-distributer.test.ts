/**
 * test-distributer.test.ts
 *
 * Test suite for Playwright test distribution utilities.
 *
 * Author: Dhakshath Amin
 * Date: 12 September 2025
 * Description: Validates test discovery, grouping, and YAML update logic for Playwright tests using the distributer and yaml-creator modules.
 * Covers distribution by test name, directory, group, tag, and updates YAML configuration accordingly.
 */

import { MavenTestDistributor } from "../src/maven/maven-test-distributer.js";
import { HyperexecuteYaml } from "../src/server/tools/yaml-creator.js";
import * as cmd from "../src/commons/cmdOperations.js"
import * as fileOps from '../src/commons/fileOperations.js';

const yamlcreater: HyperexecuteYaml = new HyperexecuteYaml();
let mvnCommand = ``, result = ``;

async function yaml(): Promise<void> {
    await yamlcreater.ensureYamlFile_Karate_Maven();
}
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

describe("karate-maven-test-distributer.ts", () => {
    it("Distribute the karate test for the tags @DeleteRequest @UpdateUser", async () => {
        createMockLogFile("TestFeature.feature", featureFileContent);
        createMockLogFile("pom.xml", pomXmlSample);

        await yaml();
        const tags = ['@DeleteRequest', '@UpdateUser'];
        for (const tag of tags) {
            if (!cmd.getFeatureFilesForTags(tag)) {
                throw new Error(`No feature file found which has Tag: ${tag}`);
            }
        }
        const distributer = new MavenTestDistributor();
        result = await yamlcreater.updateField("TestDiscoveryCommand", distributer.testDiscoverCommand_karate(tags));
        result = await yamlcreater.updateField("TestRunnerCommand", distributer.testRunnerCommand_karateMaven());
        console.log(result);

        fileOps.deleteFile("TestFeature.feature");
        fileOps.deleteFile("pom.xml");
        fileOps.deleteFile("cucumber_context.json");
        fileOps.deleteFile("snooper.log");
        fileOps.deleteFolder("src/test");
    });
});
