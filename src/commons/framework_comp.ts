import * as fileOps from '../commons/fileOperations.js';

function framework_comp(packageManager: string): string[] {
    try {
        if (["npm", "yarn", "pnpm"].includes(packageManager)) { // TODO: Handle for Maven projects.
            const pkgJson = fileOps.findFileRelativePath('.', 'package.json');
            if (pkgJson) {
                const pkgJsonData = fileOps.getFileContent(pkgJson);
                const pkgData = JSON.parse(pkgJsonData);
                const testFrameworks = detectTestFrameworks(pkgData);
                return testFrameworks;
            }
            else { // If Package.json file does not exist, then return empty array
                throw new Error('Package.json file not found to get the test frameworks');
            }
        }
        else {  // If analyzer is null & framework is not npm, then return empty array
            return [];
        }
    }
    catch (error: any) {
        console.error(error.message);
        // Return empty array
        return [];
    }
}

const detectTestFrameworks = (pkg: any): string[] => {
    const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
    };

    const frameworks: string[] = [];
    if (deps["@playwright/test"]) {
        frameworks.push(`playwright@${deps["@playwright/test"]}`);
    } else if (deps["playwright"]) {
        frameworks.push(`playwright@${deps["playwright"]}`);
    }
    if (deps["jest"]) frameworks.push(`jest@${deps["jest"]}`);
    if (deps["mocha"]) frameworks.push(`mocha@${deps["mocha"]}`);
    if (deps["vitest"]) frameworks.push(`vitest@${deps["vitest"]}`);
    if (deps["cypress"]) frameworks.push(`cypress@${deps["cypress"]}`);

    return frameworks;
}


export { framework_comp };