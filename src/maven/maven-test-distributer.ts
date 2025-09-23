import * as fileOps from '../commons/fileOperations.js';
import { HyperexecuteYaml } from "../server/tools/yaml-creator.js";
import * as cmd from "../commons/cmdOperations.js"
import * as path from "path";

export class MavenTestDistributor {
    private args: string[] = [];
    private argsPairs: { [key: string]: string } = {};

    // COMMAND: `mvn test -Dtest=TestRunner -Dkarate.options="--tags @smoke" -Denv='QA' -Dtimeout=30`
    private splitArgs(command: string): void {
        // Match -Dkey=value where value can be unquoted, or quoted with " or '
        const regex = /(-D[^\s=]+=(?:"[^"]*"|'[^']*'|[^\s]*))/g;
        const matches = command.match(regex) ?? [];
        this.args = matches.map(arg => arg.trim());
    }

    private parseArgs(): void {
        for (const arg of this.args) {
            if (arg.indexOf('=') <= 0) continue;  // Skip if no '=' found
            const [key, value] = arg.split('=');
            if (key && value) {
                let keyTrimmed = key.replace(/^-D/, '').toLowerCase(); // Remove leading -D
                this.argsPairs[keyTrimmed] = value.replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes if any
            }
        }
    }

    public getArgs(command: string): Record<string, string> {
        this.splitArgs(command);
        this.parseArgs();
        return this.argsPairs;

    }

    public getSuiteXml(): string | null {
        const suiteXmlKeys = ['suitexmlfiles', 'suitexmlfile', 'xmlfiles', 'xmlfile', 'xml'];
        for (const key of suiteXmlKeys) {
            if (key in this.argsPairs) {
                return this.argsPairs[key];
            }
        }
        return null;
    }

    public getTest(): string | null {
        return this.argsPairs['test'] ?? null;
    }

    public getTags(): string[] {
        const tags: string[] = [];
        for (const value of Object.values(this.argsPairs)) {
            if (typeof value === 'string' && value.includes("@")) {
                const parts = value
                    .split(/[\s,]+/)      // split on space(s) or comma(s)
                    .map(tag => tag.trim())
                    .filter(tag => tag.startsWith("@")); // keep only tags starting with '@'
                tags.push(...parts);
            }
        }
        return Array.from(new Set(tags));
    }

    /** @deprecated */
    public async karate_maven_test_distributer(mvnCommand: string): Promise<string> {
        const yamlcreater = new HyperexecuteYaml();
        this.splitArgs(mvnCommand);
        this.parseArgs();

        const errors: string[] = [];
        const test = this.getTest();
        const suiteXml = this.getSuiteXml();
        const tags = this.getTags();

        if (test && !fileOps.fileExists(test)) {
            errors.push(`Specified test '${test}' does not exist in the framework`);
        }
        if (suiteXml && !fileOps.fileExists(suiteXml)) {
            errors.push(`Specified suite XML '${suiteXml}' does not exist in the framework`);
        }
        if (!tags.length) {
            errors.push(
                `Please specify tags in the runner command with '@'. Example: -Dkarate.options='@smoke'`
            );
        }
        // Throw all collected errors at once
        if (errors.length > 0) {
            throw new Error(errors.join("\n"));
        }

        // Check if all the tags are present?
        for (const tag in tags) {
            if (!cmd.getFeatureFilesForTags(tag))
                throw new Error(`There is not feature file which has tag ${tag}, please try again with updated tag.`)
        }
        const testDiscoveryCommand = `./snooper --featureFilePaths=. --frameWork=java --specificTags=${tags.join(' ')}`;
        await yamlcreater.updateField("TestDiscoveryCommand", testDiscoveryCommand);

        const testRunnerCommand = this.reconstructMvn_forTag(mvnCommand);
        return await yamlcreater.updateField("TestRunnerCommand", testRunnerCommand);
    }

    /** @deprecated */
    private reconstructMvn_forTag(mvnCommand: string): string {
        const parts: string[] = [];
        const baseCommand = mvnCommand.split('-D')[0]; // "mvn test"
        parts.push(baseCommand);

        for (const [key, value] of Object.entries(this.argsPairs)) {
            if (value.includes('@')) {
                parts.push(`-D${key}=$test`);
            } else if (value.includes(' ')) {
                // Preserve quotes for multi-word values
                parts.push(`-D${key}="${value}"`);
            } else {
                parts.push(`-D${key}=${value}`);
            }
        }
        return parts.join(' ');
    }

    private include_MavenDependency_karateJunit5(): void {
        const pomFile = fileOps.findFileRelativePath('.', 'pom.xml');
        if (!pomFile) throw new Error(`pom.xml file is not found. Does it exists?`)
        const POM = fileOps.getFileContent(pomFile);

        // Avoid duplicate addition
        if (!POM.includes("<artifactId>karate-junit5</artifactId>")) {
            const dependencyToAdd = `
                    <dependency>
                    <groupId>com.intuit.karate</groupId>
                    <artifactId>karate-junit5</artifactId>
                    <version>1.4.0</version>
                    <scope>test</scope>
                    </dependency>`;
            const marker = '</dependencies>';

            if (!POM.includes(marker)) { //SafeCheck
                throw new Error("No <dependencies> section found in pom.xml");
            }

            const updatedPOM = POM.replace(marker, `${dependencyToAdd} \n ${marker}`)
            fileOps.writeFile(pomFile, updatedPOM);
        }
    }

    private create_testRunner(): void {
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

    public testDiscoverCommand_karate(tags: string[]): string {
        const testDiscoveryCommand = `./snooper --featureFilePaths=. --frameWork=java --specificTags=${tags.join(' ')}`;
        return testDiscoveryCommand;
    }

    public testRunnerCommand_karateMaven(): string {
        try {
            this.include_MavenDependency_karateJunit5();
            this.create_testRunner();
            const testRunnerCommand = `mvn test -Dtest=LambdaRunner -Dkarate.options=$test`;
            return testRunnerCommand;
        }
        catch (error: any) {
            throw new Error(`Error is creating`)
        }
    }

}