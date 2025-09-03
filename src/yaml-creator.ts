import * as fs from "fs";
import YAML from 'yaml';
type yaml = YAML.Document.Parsed;

/**
 * Load YAML file as a YAML Document (preserves comments & formatting)
 */
function getFileContent(filePath: string): yaml {
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);
    const data = fs.readFileSync(filePath, 'utf-8');
    return YAML.parseDocument(data);
}

/**
 * Write YAML Document back to file
 */
function writeFile(filePath: string, doc: yaml) {
    fs.writeFileSync(filePath, doc.toString(), 'utf-8');
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
function hyperexecuteYamlCreator(projectName: string, projectID: string) {
    try {
        const doc = getFileContent('sample_yaml_file.yaml');

        updateProject(doc, { name: projectName, id: projectID });
        updatePre(doc, 'playwright@1.55.0');

        const testPath = 'tests/page_test.spec.js';
        updateTestRunnerCommand(doc, `npx playwright test ${testPath}`);

        writeFile('hyperexecute.yaml', doc);
        console.log('hyperexecute.yaml created successfully!');
    } catch (error: any) {
        throw new Error(`Error creating YAML file: ${error.message}`);
    }
}

/**
 * Test function to verify YAML creation
 */
function testYamlCreator(): yaml {
    hyperexecuteYamlCreator("TestProjectName", "46517TEST810");
    return getFileContent('hyperexecute.yaml');
}

export { hyperexecuteYamlCreator, testYamlCreator };
