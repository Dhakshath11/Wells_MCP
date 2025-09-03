import * as fs from "fs";
import YAML from 'yaml';
type yaml = YAML.Document.Parsed;

/**
 * Load YAML file as a YAML Document (preserves comments & formatting)
 */
function getFileContent(filePath: string): string {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write YAML Document back to file
 */
function writeFile(filePath: string, doc: string) {
    fs.writeFileSync(filePath, doc, 'utf-8');
}

/**
 * Update project metadata in YAML
 */
function updateProject(doc: yaml, updates: Record<string, any>) {
    let project = doc.get('project') as YAML.YAMLMap | undefined;
    if (!(project instanceof YAML.YAMLMap)) {
        project = new YAML.YAMLMap();
        doc.set('project', project);
    }

    for (const key in updates) {
        project.set(key, updates[key]);
    }

}

/**
 * Update pre commands (e.g., playwright version) in YAML
 */
function updatePre(doc: yaml, newVersion: string) {
    const pre = doc.get('pre');
    if (pre instanceof YAML.YAMLSeq) {
        pre.items.forEach((item, idx) => {
            const line = item.toString(); // this is the actual string
            if (line.includes('playwright')) {
                pre.items[idx] = line.replace(/playwright(@[\d.]+)?/, newVersion);
            }
        });
        doc.set('pre', pre);
    }
}

/**
 * Update testRunnerCommand in YAML
 */
function updateTestRunnerCommand(doc: yaml, command: string) {
    doc.set('testRunnerCommand', command);
}

/**
 * Main function to create or update hyperexecute YAML
 */
function hyperexecuteYamlCreator(projectName: string, projectID: string, playwrightVersion: string = 'playwright@1.55.0', testPath: string = 'tests/page_test.spec.js'): string {
    try {
        const doc = getFileContent('sample_yaml_file.yaml');
        const docConvertedToYaml = YAML.parseDocument(doc);   // Serialize the document: string contents into YAML Object for easy operation

        updateProject(docConvertedToYaml, { name: projectName, id: projectID });
        updatePre(docConvertedToYaml, playwrightVersion);
        updateTestRunnerCommand(docConvertedToYaml, `npx playwright test ${testPath}`);

        const yamlContent = docConvertedToYaml.toString();   // De-serialize the YAML object to string
        writeFile('hyperexecute.yaml', yamlContent);
        return yamlContent;
    } catch (error: any) {
        throw new Error(`Error creating YAML file: ${error.message}`);
    }
}

export { hyperexecuteYamlCreator };
