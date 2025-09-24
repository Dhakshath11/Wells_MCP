
import * as fileOps from '../commons/fileOperations.js';
import * as path from "path";
import * as maven_setup from '../maven/maven-setup.js'
import * as gradle_setup from '../gradle/gradle-setup.js'

export class KarateTestDistributor {
    public testDiscoverCommand_forTags(tags: string[]): string {
        const testDiscoveryCommand = `./snooper --featureFilePaths=. --frameWork=java --specificTags=${tags.join(' ')}`;
        return testDiscoveryCommand;
    }

    public testDiscoverCommand_forFileOrFolder(INPUTS: string[]): string {
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