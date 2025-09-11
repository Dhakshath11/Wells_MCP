/**
 * yaml-creator.ts
 *
 * Utility class to create and update hyperexecute YAML configuration files for LambdaTest.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Provides helpers to update project metadata, pre-commands, test discovery, and test runner commands.
 */

import * as YAML from "yaml";
import * as fileOps from "../../commons/fileOperations.js";
import { download_Playwright_hyperexecute_yaml } from "../../resources/download-file.js";
type yaml = YAML.Document.Parsed;

export class HyperexecuteYaml {
    private readonly fileName = "hyperexecute.yaml";

    /**
     * Ensures the YAML file exists. Downloads if not present.
     */
    public async ensureYamlFile(): Promise<void> {
        if (!fileOps.fileExists(this.fileName)) {
            await download_Playwright_hyperexecute_yaml();
        }
    }

    /**
     * Downloads the YAML file.
     */
    private async downloadYamlFile(): Promise<void> {
        await download_Playwright_hyperexecute_yaml();
    }

    /**
     * Loads the YAML file into a parsed document.
     */
    private loadYaml(): yaml {
        const raw = fileOps.getFileContent(this.fileName);
        return YAML.parseDocument(raw);
    }

    /**
     * Writes the YAML document back to file.
     */
    private saveYaml(doc: yaml): string {
        const yamlContent = doc.toString();
        fileOps.writeFile(this.fileName, yamlContent);
        return yamlContent;
    }

    /**
     * Updates the 'project' section with metadata.
     */
    private updateProject(doc: yaml, updates: Record<string, any>): yaml {
        let project = doc.get("project") as YAML.YAMLMap | undefined;
        if (!(project instanceof YAML.YAMLMap)) {
            project = new YAML.YAMLMap();
            doc.set("project", project);
        }
        for (const key in updates) {
            project.set(key, updates[key]);
        }
        return doc;
    }

    /**
     * Updates the 'pre' section with Playwright version.
     */
    private updatePre(doc: yaml, newVersion: string): yaml {
        const pre = doc.get("pre");
        if (pre instanceof YAML.YAMLSeq) {
            pre.items = pre.items.map((item) => {
                const line = item.toString();
                return line.includes("playwright")
                    ? line.replace(/playwright(@[\d.]+)?/, newVersion)
                    : line;
            });
            doc.set("pre", pre);
        } else {
            // Create if missing
            const seq = new YAML.YAMLSeq();
            seq.add(`npm install ${newVersion}`);
            doc.set("pre", seq);
        }
        return doc;
    }

    /**
     * Updates the 'testDiscovery.command'.
     */
    private updateTestDiscoveryCommand(doc: yaml, command: string): yaml {
        let testDiscovery = doc.get("testDiscovery") as YAML.YAMLMap | undefined;
        if (!(testDiscovery instanceof YAML.YAMLMap)) {
            testDiscovery = new YAML.YAMLMap();
        }
        testDiscovery.set("command", command);
        doc.set("testDiscovery", testDiscovery);
        return doc;
    }

    /**
     * Updates the 'testRunnerCommand'.
     */
    private updateTestRunnerCommand(doc: yaml, command: string): yaml {
        doc.set("testRunnerCommand", command);
        return doc;
    }

    /**
     * Creates or updates the YAML file with project details & runner command.
     */
    async createYaml(
        projectName: string,
        projectID: string,
        playwrightVersion = "playwright@latest",
        testPath = "tests/page_test.spec.js"
    ): Promise<string> {
        try {
            await this.downloadYamlFile(); // Always Download the fresh YAML file during creation
            const doc = this.loadYaml();

            this.updateProject(doc, { name: projectName, id: projectID });
            this.updatePre(doc, playwrightVersion);
            this.updateTestRunnerCommand(doc, `npx playwright test ${testPath}`);

            return this.saveYaml(doc);
        } catch (error: any) {
            throw new Error(`Error creating YAML file: ${error.message}`);
        }
    }

    /**
     * Updates a specific YAML command section.
     */
    async updateField(whichCommand: string, value: string): Promise<string> {
        try {
            await this.ensureYamlFile();
            const doc = this.loadYaml();

            switch (whichCommand) {
                case "TestRunnerCommand":
                    this.updateTestRunnerCommand(doc, value);
                    break;
                case "TestDiscoveryCommand":
                case "Command":
                    this.updateTestDiscoveryCommand(doc, value);
                    break;
                default:
                    throw new Error(`Unsupported command type: ${whichCommand}`);
            }

            return this.saveYaml(doc);
        } catch (error: any) {
            throw new Error(`Error updating YAML field [${whichCommand}]: ${error.message}`);
        }
    }
}
