import * as fileOps from '../commons/fileOperations.js';
import { FrameworkSpecAnalyzer } from '../server/tools/framework-spec';

function getTestDirectory(): string {
    try {
        const pkgPath = fileOps.findFileRelativePath('.', 'package.json');
        if (!pkgPath) throw new Error('package.json not found');
        const pkg = fileOps.getFileContent(pkgPath);
        let testDir = JSON.parse(pkg).testDir;
        if (testDir) return testDir;  // test directory found in package.json is at high priority
        else {
            const frameworkSpecAnalyzer: FrameworkSpecAnalyzer = new FrameworkSpecAnalyzer();
            const testFiles: string[] = frameworkSpecAnalyzer.getField('testFiles');
            if (testFiles.length > 0) {
                testDir = '';
                for (const testFile of testFiles) {
                    if (!testFile.includes(testDir)) {
                        testDir = testFile.split('/')[0].trim();
                    }
                }
                return testDir;
            }
            else return 'tests'; // Default test directory - Playwright Default
        }
    }
    catch (error: any) { return 'tests'; } // Default test directory - Playwright Default
}

function playwrightTestDistributer_ByTest(): string {
    try {
        return `grep -nri 'test(' ${getTestDirectory()} | sed -E 's/^([^:]+:[0-9]+):.*/\\1/' | sort -u`; // test-Discovery Command
    }
    catch (error: any) {
        throw new Error(`Error to distribute tests by test: ${error.message}`);
    }
}

function playwrightTestDistributer_ByTestGroups(): string {
    try {
        return `grep -nri 'test.describe' ${getTestDirectory()}  | sed 's/:test.*//' | sort -u`; // test-Discovery Command
    }
    catch (error: any) {
        throw new Error(`Error to distribute tests by test-groups: ${error.message}`);
    }
}

function playwrightTestDistributer_ByTagName(tagName: string): string {
    return `npx playwright test --grep ${tagName}`
}

export {
    getTestDirectory,
    playwrightTestDistributer_ByTest,
    playwrightTestDistributer_ByTestGroups,
    playwrightTestDistributer_ByTagName
};