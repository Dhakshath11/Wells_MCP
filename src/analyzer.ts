import * as fs from "fs";

interface AnalysisOutput {
    language: string;
    runtimeVersion: string;
    packageManager: string | null;
    packageManagerVersion: string | null;
    testFrameworks: string[];
    privateRegistry: string[];
    privateEndpoints: string[];
    inaccessibleURLs: string[];
    externalReporters: string[];
    testFiles: string[];
}

function getLastLine(filePath: string): string {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);

    const data = fs.readFileSync(filePath, "utf-8");
    const lines = data.trim().split("\n");
    return lines[lines.length - 1];
}

function normalizeRuntimeVersion(runtimeStr: string, language: string): string {
    const match = runtimeStr.match(/v?(\d+(?:\.\d+){0,2})/);
    return match ? match[1].trim() : runtimeStr.trim();
}

function normalizeFrameworks(frameworksStr: string): string[] {
    const frameworks: string[] = [];
    const regex = /(\w+)\s*->|([\w-]+@[\d\w\.\^\-]+)/g;
    let match;

    while ((match = regex.exec(frameworksStr)) !== null) {
        if (match[1]) {
            // Java: before "->"
            frameworks.push(match[1]);
        } else if (match[2]) {
            // JS/TS: full package@version
            frameworks.push(match[2]);
        }
    }
    return frameworks;
}

function extractList(msg: string, field: string): string[] {
    const regex = new RegExp(`${field}:\\[([^\\]]*)\\]`);
    const match = msg.match(regex);
    if (!match) return [];
    return match[1].split(" ").map(f => f.trim()).filter(Boolean);
}

function extractTestFiles(msg: string): string[] {
    const regex = /TestFiles:\[([^\]]*)\]/;
    const match = msg.match(regex);
    if (!match) return [];

    const files = match[1].split(" ").map(f => f.trim()).filter(Boolean);
    return files;
}

function parseAnalysisLog(): AnalysisOutput {
    try {
        const filePath = "hyperexecute-analyze.log";
        const lastLine = getLastLine(filePath);
        const logObj = JSON.parse(lastLine);

        const msg: string = logObj.msg;

        const languageMatch = msg.match(/Language:([^\s]+)/);
        const runtimeMatch = msg.match(/RuntimeVersion:([^\n]+)/);
        const packageManagerMatch = msg.match(/PackageManager:(\w+)/);
        const packageManagerVersionMatch = msg.match(/PackageManagerVersion:([^\n]+)/); //remove
        const testFrameworksMatch = msg.match(/TestFrameworks:\[([^\]]*)\]/);

        const language = languageMatch ? languageMatch[1].trim() : "";
        const runtimeVersion = runtimeMatch
            ? normalizeRuntimeVersion(runtimeMatch[1], language)
            : "";
        const packageManager = packageManagerMatch ? packageManagerMatch[1].trim() : null;
        const packageManagerVersion = packageManagerVersionMatch
            ? packageManagerVersionMatch[1].trim()
            : null;
        const testFrameworks = testFrameworksMatch
            ? normalizeFrameworks(testFrameworksMatch[1])
            : [];
        const testFiles = extractTestFiles(msg);

        return {
            language,
            runtimeVersion,
            packageManager,
            packageManagerVersion,
            testFrameworks,
            privateRegistry: extractList(msg, "PrivateRegistry"),
            privateEndpoints: extractList(msg, "PrivateEndpoints"),
            inaccessibleURLs: extractList(msg, "InaccessibleURLs"),
            externalReporters: extractList(msg, "ExternalReporters"),
            testFiles,
        };
    }
    catch (error: any) {
        throw new Error(`Error parsing analysis log: ${error.message}`);
    }
}


export { parseAnalysisLog, AnalysisOutput };
