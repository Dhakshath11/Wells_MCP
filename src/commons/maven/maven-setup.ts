/**
 * maven-setup.ts
 *
 * Utility functions for managing Maven dependencies in Java projects.
 *
 * Author: Dhakshath Amin
 * Date: 27 September 2025
 * Description:
 *   - Adds required dependencies to pom.xml for Karate/JUnit5 integration
 *   - Ensures dependencies are not duplicated
 *   - Throws clear errors if pom.xml or dependencies section is missing
 *
 * Key Features:
 * - Safe, idempotent dependency addition
 * - Designed for use in LambdaTest/HyperExecute automation tools
 */
import * as fileOps from '../fileOperations.js';
import logger from '../logger.js';

const include_MavenDependency = (dependencyToAdd: string, artifactId: string): void => {
    /**
     * Adds a dependency to the <dependencies> section in pom.xml if not already present.
     * Throws an error if pom.xml or dependencies section is missing.
     *
     * @param dependencyToAdd - The Maven dependency XML string to add
     * @param artifactId - The artifactId to check for duplication
     * @throws {Error} If pom.xml or dependencies section is not found
     */
    const pomFile = fileOps.findFileRelativePath('.', 'pom.xml');
    if (!pomFile) throw new Error(`pom.xml file is not found. Does it exists?`)
    const POM = fileOps.getFileContent(pomFile);

    // Avoid duplicate addition
    if (!POM.toLowerCase().includes(`<artifactId>${artifactId.toLowerCase()}</artifactId>`)) {
        const marker = '</dependencies>';

        if (!POM.includes(marker)) { //SafeCheck
            logger.error('No <dependencies> section found in pom.xml');
            throw new Error("No <dependencies> section found in pom.xml");
        }

        const updatedPOM = POM.replace(marker, `${dependencyToAdd}\n ${marker}`)
        fileOps.writeFile(pomFile, updatedPOM);
        logger.info(`Added Maven dependency: ${artifactId}`);
    } else {
        logger.debug(`Dependency already present in pom.xml: ${artifactId}`);
    }
}

const add_karate_junit5 = (): void => {
    /**
     * Adds the Karate JUnit5 test dependency to pom.xml if not already present.
     * Uses include_MavenDependency for safe addition.
     */
    const dependencyToAdd = `
                    <dependency>
                    <groupId>com.intuit.karate</groupId>
                    <artifactId>karate-junit5</artifactId>
                    <version>1.4.0</version>
                    <scope>test</scope>
                    </dependency>`.trim();
    try {
        include_MavenDependency(dependencyToAdd, 'karate-junit5');
    } catch (error: any) {
        logger.error('Failed to add Karate JUnit5 dependency to pom.xml', error);
        throw error;
    }
}

export {
    add_karate_junit5
};

//}