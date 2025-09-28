/**
 * karate-test-distributer.ts
 *
 * Utility class for distributing Karate test execution across parallel machines.
 *
 * Author: Dhakshath Amin
 * Date: 27 September 2025
 * Description:
 *   - Provides methods to discover feature files and tags for Karate tests
 *   - Generates test discovery and runner commands for Maven and Gradle
 *   - Ensures required test runner Java class exists
 *
 * Key Features:
 * - Tag-based and file-based test discovery for Karate
 * - Safe shell command construction for test discovery
 * - Automatic creation of LambdaRunner Java class for test execution
 * - Integration with Maven and Gradle build tools
 */

import * as fileOps from '../commons/fileOperations.js';
import * as path from "path";
import * as maven_setup from '../commons/maven/maven-setup.js'
import * as gradle_setup from '../commons/gradle/gradle-setup.js'
import * as cmd from "../commons/cmdOperations.js"

export class KarateTestDistributor {

    /**
     * Checks if any feature file exists with the given tag.
     * Throws an error if no matching file is found.
     * @param tag Karate tag to search for (e.g. "@smoke")
     * @returns {boolean} True if at least one file is found
     * @throws {Error} If no feature file is found with the tag
     */

    public hasFeatureWithTag(tag: string): boolean {
        const result = cmd.getFeatureFilesForTags(tag)?.trim();
        if (!result) {
            throw new Error(`No feature file found with tag: ${tag}`);
        }
        return true;
    }

    public testDiscoverCommand_forTags(tags: string[]): string {
    /**
     * Generates a shell command to discover feature files by tags.
     * @param tags Array of Karate tags to search for
     * @returns {string} Shell command for test discovery by tags
     */
        const testDiscoveryCommand = `./snooper --featureFilePaths=. --frameWork=java --specificTags=${tags.join(' ')}`;
        return testDiscoveryCommand;
    }

    public hasFeatureFileOrFolder(ff: string): boolean {
    /**
     * Checks if any feature file or folder exists for the given input.
     * Throws an error if no matching file is found.
     * @param ff File or folder path or pattern
     * @returns {boolean} True if at least one file is found
     * @throws {Error} If no feature file is found in the input
     */
        const result = cmd.findCommand(ff)?.trim();
        if (!result) {
            throw new Error(`No feature file found within : ${ff}`);
        }
        return true;
    }

    public testDiscoverCommand_forFileOrFolder(INPUTS: string[]): string {
    /**
     * Generates a shell command to discover feature files by file or folder input(s).
     * Escapes input for shell safety and supports multiple inputs.
     * @param INPUTS Array of file/folder paths or patterns
     * @returns {string} Shell command for test discovery by file/folder
     */
        // Escape each input for shell safety
        const escapedInputs = INPUTS.map(i => i.replace(/"/g, '\\"'));

        // Build a find command for all inputs
        const commands = escapedInputs.map(input => {
            return `[ -d "${input}" ] && find "${input}" -type f || find . -type f \\( -path "${input}" -o -name "$(basename "${input}")" -o -name "${input}" \\)`;
        });

        // Join all commands with ' ; ' so they run sequentially
        const testDiscoveryCommand = commands.join(' ; ');
        return testDiscoveryCommand;
    }

    private create_karate_testRunner(): void {
    /**
     * Ensures the LambdaRunner Java class exists for Karate test execution.
     * Creates the file if missing, with the required JUnit5 runner code.
     */
        // Use path.join for cross-platform paths
        const filePath = path.join("src", "test", "java", "LambdaRunner.java");

        if (!fileOps.fileExists(filePath)) {
            const classfileContent = `
            import com.intuit.karate.junit5.Karate;

            /* -- Created For Karate-Lambdatest Run -- */
            public class LambdaRunner {
                @Karate.Test
                Karate run() {
                    String karateOptions = System.getProperty("karate.options");
                    System.out.println(karateOptions);
                    if (karateOptions != null && !karateOptions.isEmpty()) {
                        return Karate.run(karateOptions.split(" "));
                    } else {
                        return Karate.run().relativeTo(getClass());
                    }
                }
                // mvn test -Dtest=LambdaRunner -Dkarate.options="src/test/resources/apis/features/PutRequest.feature:10"
                // gradle test --tests LambdaRunner -Dkarate.options="src/test/resources/apis/features/PutRequest.feature:10"
            }
            `;

            fileOps.writeFile(filePath, classfileContent);
        }
    }

    public testRunnerCommand_karateMaven(): string {
    /**
     * Generates the Maven test runner command for Karate using LambdaRunner.
     * Ensures dependencies and runner class are present.
     * @returns {string} Maven command to run Karate tests
     * @throws {Error} If setup or file creation fails
     */
        try {
            maven_setup.add_karate_junit5();
            this.create_karate_testRunner();
            const testRunnerCommand = `mvn test -Dtest=LambdaRunner -Dkarate.options=$test`;
            return testRunnerCommand;
        }
        catch (error: any) {
            throw new Error(`Error is creating TestRunnerCommand for Maven project: ${error.message}`)
        }
    }

    public testRunnerCommand_karateGradle(): string {
    /**
     * Generates the Gradle test runner command for Karate using LambdaRunner.
     * Ensures dependencies and runner class are present.
     * @returns {string} Gradle command to run Karate tests
     * @throws {Error} If setup or file creation fails
     */
        try {
            gradle_setup.add_karate_junit5();
            this.create_karate_testRunner();
            const testRunnerCommand = `gradle test --tests LambdaRunner -Dkarate.options=$test`;
            return testRunnerCommand;
        }
        catch (error: any) {
            throw new Error(`Error is creating TestRunnerCommand for Gradle project: ${error.message}`)
        }
    }

}