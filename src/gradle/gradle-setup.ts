import * as fileOps from '../commons/fileOperations.js';

const include_GradleDependency = (dependencyToAdd: string): void => {
    const gradleFile = fileOps.findFileRelativePath('.', 'build.gradle');
    if (!gradleFile) throw new Error(`build.gradle file is not found. Does it exist?`);
    const buildGradle = fileOps.getFileContent(gradleFile);

    // Avoid duplicate addition
    if (!buildGradle.includes(dependencyToAdd)) {
        const marker = 'dependencies {';

        if (!buildGradle.includes(marker)) {
            throw new Error("No dependencies block found in build.gradle");
        }

        const updatedGradle = buildGradle.replace(marker,`${marker}\n ${dependencyToAdd}`);
        fileOps.writeFile(gradleFile, updatedGradle);
    }
}

const add_karate_junit5 = (): void => {
    const dependencyToAdd = `testImplementation 'com.intuit.karate:karate-junit5:1.4.1'`.trim();
    include_GradleDependency(dependencyToAdd);
}

export {
    add_karate_junit5
};
