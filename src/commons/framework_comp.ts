/**
 * framework_comp.ts
 *
 * Detects and extracts test frameworks from project dependency files.
 *
 * Author: Dhakshath Amin
 * Date: 19 September 2025
 * Description: Utilities to identify test frameworks based on package manager and dependency files.
 */

import * as fileOps from '../commons/fileOperations.js';
import { Parser } from "xml2js";

/**
 * Detects test frameworks used in a project depending on the given package manager.
 *
 * Supports:
 * - Node.js package managers (npm, yarn, pnpm)
 * - Maven (pom.xml)
 * - Gradle (build.gradle)
 *
 * @param packageManager - The package manager name ("npm" | "yarn" | "pnpm" | "maven" | "gradle").
 * @returns Array of detected frameworks in the format `framework@version`.
 *
 * Example:
 * ```ts
 * framework_comp("maven");
 * // ["selenium-java@4.30.0", "karate-core@1.4.1"]
 * ```
 */
function framework_comp(packageManager: string): string[] {
    try {
        const pm = packageManager.trim().toLowerCase();

        // Handle Node.js (package.json)
        if (["npm", "yarn", "pnpm"].includes(pm)) {
            const pkgJson = fileOps.findFileRelativePath('.', 'package.json');
            if (!pkgJson) throw new Error('package.json file not found to get the test frameworks');
            const pkgJsonData = fileOps.getFileContent(pkgJson);
            const pkgData = JSON.parse(pkgJsonData);
            return extractNodeDependencies(pkgData);

            // Handle Maven (pom.xml)
        } else if (pm === 'maven') {
            const dependencyFile = fileOps.findFileRelativePath('.', 'pom.xml');
            if (!dependencyFile) throw new Error('pom.xml file not found to get the test frameworks');
            const dependencyFileData = fileOps.getFileContent(dependencyFile);
            return extractMavenDependencies(dependencyFileData);

            // Handle Gradle (build.gradle)
        } else if (pm === 'gradle') {
            const dependencyFile = fileOps.findFileRelativePath('.', 'build.gradle');
            if (!dependencyFile) throw new Error('build.gradle file not found to get the test frameworks');
            const dependencyFileData = fileOps.getFileContent(dependencyFile);
            return extractGradleDependencies(dependencyFileData);

            // Unsupported package manager
        } else {
            return [];
        }
    } catch (error: any) {
        console.error(error?.message || error);
        return [];
    }
}

/**
 * Extracts known test frameworks from a Node.js package.json structure.
 *
 * @param pkg - Parsed package.json content (dependencies + devDependencies).
 * @returns Array of detected frameworks like ["playwright@1.40.0", "jest@29.7.0"]
 */
const extractNodeDependencies = (pkg: any): string[] => {
    const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
    };
    const frameworks: string[] = [];

    if (deps["@playwright/test"]) frameworks.push(`playwright@${deps["@playwright/test"]}`);
    else if (deps["playwright"]) frameworks.push(`playwright@${deps["playwright"]}`);

    if (deps["jest"]) frameworks.push(`jest@${deps["jest"]}`);
    if (deps["mocha"]) frameworks.push(`mocha@${deps["mocha"]}`);
    if (deps["vitest"]) frameworks.push(`vitest@${deps["vitest"]}`);
    if (deps["cypress"]) frameworks.push(`cypress@${deps["cypress"]}`);

    return frameworks;
};

/**
 * Extracts test frameworks from a Maven pom.xml string using xml2js.
 *
 * @param dependencyFileData - Raw XML string from pom.xml.
 * @returns Array of detected frameworks like ["selenium-java@4.30.0", "karate-core@1.4.1"]
 */
const extractMavenDependencies = (dependencyFileData: string): string[] => {
    const frameworks: string[] = [];
    let parsedXml: any = null;

    const parser = new Parser({
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
    });

    // Parse XML (xml2js parseString is async but callback-based, so we wrap it synchronously here)
    parser.parseString(dependencyFileData, (err, result) => {
        if (err) {
            console.error('Failed to parse pom.xml:', err);
            parsedXml = null;
        } else {
            parsedXml = result;
        }
    });

    if (!parsedXml || !parsedXml.project || !parsedXml.project.dependencies || !parsedXml.project.dependencies.dependency) {
        return frameworks;
    }

    const dependencies = parsedXml.project.dependencies.dependency;
    const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];

    for (const dep of depArray) {
        const groupId = dep.groupId;
        const artifactId = dep.artifactId;
        const version = dep.version;
        if (groupId && artifactId && version && isTestFramework(groupId)) {
            frameworks.push(`${artifactId}@${version}`);
        }
    }

    return frameworks;
};

/**
 * Extracts test frameworks from a Gradle build.gradle file.
 *
 * Uses regex to detect dependencies like:
 * implementation "groupId:artifactId:version"
 *
 * @param dependencyFileData - Raw string content of build.gradle.
 * @returns Array of detected frameworks like ["selenium-java@4.35.0", "karate-junit5@1.4.1"]
 */
const extractGradleDependencies = (dependencyFileData: string): string[] => {
    // Regex to capture groupId:artifactId:version inside quotes
    const regex = /["'`]([\w\.\-]+):([\w\.\-]+):([\w\.\-]+)["'`]/g;
    const frameworks: string[] = [];
    let match;

    while ((match = regex.exec(dependencyFileData)) !== null) {
        const groupId = match[1];
        const artifactId = match[2];
        const version = match[3];
        if (isTestFramework(groupId)) {
            frameworks.push(`${artifactId}@${version}`);
        }
    }

    return frameworks;
};

/**
 * Filters dependencies to only include supported test frameworks.
 *
 * Supported groupIds:
 * - com.intuit.karate (Karate)
 * - org.seleniumhq.selenium (Selenium)
 * - com.qmetry (QAF)
 *
 * @param groupId - The dependency groupId string.
 * @returns true if it’s a supported test framework, otherwise false.
 */
const isTestFramework = (groupId: string): boolean => {
    return (
        groupId.startsWith("com.intuit.karate") ||
        groupId.startsWith("org.seleniumhq.selenium") ||
        groupId.startsWith("com.qmetry")
    );
};

export { framework_comp };
