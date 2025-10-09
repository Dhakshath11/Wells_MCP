/**
 * gradle-setup.ts
 *
 * Utility functions for managing Gradle dependencies in Java projects.
 *
 * Author: Dhakshath Amin
 * Date: 27 September 2025
 * Description:
 *   - Adds required dependencies to build.gradle for Karate/JUnit5 integration
 *   - Ensures dependencies are not duplicated
 *   - Throws clear errors if build.gradle or dependencies block is missing
 *
 * Key Features:
 * - Safe, idempotent dependency addition
 * - Designed for use in LambdaTest/HyperExecute automation tools
 */
import * as fileOps from '../fileOperations.js';
import logger from '../logger.js';

const include_GradleDependency = (dependencyToAdd: string): void => {
    /**
     * Adds a dependency to the dependencies block in build.gradle if not already present.
     * Throws an error if build.gradle or dependencies block is missing.
     *
     * @param dependencyToAdd - The Gradle dependency string to add (e.g. testImplementation ...)
     * @throws {Error} If build.gradle or dependencies block is not found
     */
    const gradleFile = fileOps.findFileRelativePath('.', 'build.gradle');
    if (!gradleFile) {
        logger.error('build.gradle file is not found. Does it exist?');
        throw new Error(`build.gradle file is not found. Does it exist?`);
    }
    const buildGradle = fileOps.getFileContent(gradleFile);

    // Avoid duplicate addition
    if (!buildGradle.includes(dependencyToAdd)) {
        const marker = 'dependencies {';

        if (!buildGradle.includes(marker)) {
            logger.error('No dependencies block found in build.gradle');
            throw new Error("No dependencies block found in build.gradle");
        }

        const updatedGradle = buildGradle.replace(marker, `${marker}\n ${dependencyToAdd}`);
        fileOps.writeFile(gradleFile, updatedGradle);
        logger.info(`Added Gradle dependency: ${dependencyToAdd}`);
    } else {
        logger.debug(`Dependency already present in build.gradle: ${dependencyToAdd}`);
    }
}

const add_karate_junit5 = (): void => {
    /**
     * Adds the Karate JUnit5 test dependency to build.gradle if not already present.
     * Uses include_GradleDependency for safe addition.
     */
    const dependencyToAdd = `testImplementation 'com.intuit.karate:karate-junit5:1.4.1'`.trim();
    try {
        include_GradleDependency(dependencyToAdd);
    } catch (error: any) {
        logger.error('Failed to add Karate JUnit5 dependency to build.gradle', error);
        throw error;
    }
}

export {
    add_karate_junit5
};
