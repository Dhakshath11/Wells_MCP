/**
 * yaml-creator.ts
 *
 * Utility functions to create and update hyperexecute YAML configuration files for LambdaTest.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Provides helpers to update project metadata, pre-commands, and test runner commands in YAML files for cloud test automation.
 */

import YAML from 'yaml';
import * as fileOps from '../../commons/fileOperations.js';
type yaml = YAML.Document.Parsed;

/**
 * Updates the 'project' section in the YAML document with new metadata.
 * @param doc YAML document object
 * @param updates Key-value pairs to update in the project section
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
 * Updates the 'pre' section in the YAML document with a new Playwright version.
 * @param doc YAML document object
 * @param newVersion New Playwright version string
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
 * Updates the 'testRunnerCommand' in the YAML document.
 * @param doc YAML document object
 * @param command New test runner command string
 */
function updateTestRunnerCommand(doc: yaml, command: string) {
    doc.set('testRunnerCommand', command);
}

/**
 * Main function to create or update a hyperexecute YAML file for LambdaTest.
 * Reads a sample YAML, updates project info and test runner command, and writes the result.
 * @param projectName Project name for LambdaTest
 * @param projectID Project ID for LambdaTest
 * @param playwrightVersion Playwright version string (default: 'playwright@1.55.0')
 * @param testPath Path to the test file (default: 'tests/page_test.spec.js')
 * @returns The updated YAML content as a string
 */
function hyperexecuteYamlCreator(projectName: string, projectID: string, playwrightVersion: string = 'playwright@1.55.0', testPath: string = 'tests/page_test.spec.js'): string {
    try {
        const doc = fileOps.getFileContent('sample_yaml_file.yaml');
        const docConvertedToYaml = YAML.parseDocument(doc);   // Serialize the document: string contents into YAML Object for easy operation

        updateProject(docConvertedToYaml, { name: projectName, id: projectID });
        //updatePre(docConvertedToYaml, playwrightVersion); -> TODO: COMMENTED AS OF NOW 
        updateTestRunnerCommand(docConvertedToYaml, `npx playwright test ${testPath}`);

        const yamlContent = docConvertedToYaml.toString();   // De-serialize the YAML object to string
        fileOps.writeFile('hyperexecute.yaml', yamlContent);
        return yamlContent;
    } catch (error: any) {
        throw new Error(`Error creating YAML file: ${error.message}`);
    }
}

export { hyperexecuteYamlCreator };
