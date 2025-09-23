/**
 * download-file.ts
 *
 * Utility functions to download sample configuration files for Playwright and LambdaTest integration.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Downloads sample files from remote sources for quick project setup.
 * Source: Github Gist https://gist.githubusercontent.com/Dhakshath11
 */

import { exec } from "child_process";
import util from "util";
import * as fileOps from "../commons/fileOperations.js";

const execAsync = util.promisify(exec);
const playwright_hyperexecute_yaml_url = "https://gist.githubusercontent.com/Dhakshath11/35a42bf955415621c2a5d4d836d22aa8/raw/hyperexecute.yaml";
const lambdatest_setup_file_url_javaScript = "https://gist.githubusercontent.com/Dhakshath11/ce6cf8443190c3ae2f0d12bf9229b45d/raw/lambdatest-setup.js";
const lambdatest_setup_file_url_typeScript = "https://gist.githubusercontent.com/Dhakshath11/621c503189b851a810b7b956aea9de71/raw/lambdatest-setup.ts";
const karate_maven_hyperexecute_yaml_url = "https://gist.githubusercontent.com/Dhakshath11/d69ca782ecc68355ce2dcf6e14d9a4b1/raw/hyperexecute.yaml";
const karate_gradle_hyperexecute_yaml_url = "https://gist.githubusercontent.com/Dhakshath11/2f53da930dbe72d17bba3bad8ff03164/raw/hyperexecute.yaml";


async function downloadFile(url: string, target: string): Promise<boolean> {
  try {
    await execAsync(`curl -L -o ${target} ${url}`, { timeout: 60000 }); // Timeout for 60 seconds
    return fileOps.fileExists(target);
  } catch (error: any) {
    throw new Error(`Error downloading ${target}: ${error.message}`);
  }
}

const download_Playwright_hyperexecute_yaml = async () =>
  await downloadFile(playwright_hyperexecute_yaml_url, "hyperexecute.yaml");

const download_Lambdatest_Setup_File_JavaScript = async () =>
  await downloadFile(lambdatest_setup_file_url_javaScript, "lambdatest-setup.js");

const download_Lambdatest_Setup_File_TypeScript = async () =>
  await downloadFile(lambdatest_setup_file_url_typeScript, "lambdatest-setup.ts");

const download_karate_maven_hyperexecute_yaml = async () =>
  await downloadFile(karate_maven_hyperexecute_yaml_url, "hyperexecute.yaml");

const download_karate_gradle_hyperexecute_yaml = async () =>
  await downloadFile(karate_gradle_hyperexecute_yaml_url, "hyperexecute.yaml");


export {
  download_Playwright_hyperexecute_yaml,
  download_Lambdatest_Setup_File_JavaScript,
  download_Lambdatest_Setup_File_TypeScript,
  download_karate_maven_hyperexecute_yaml,
  download_karate_gradle_hyperexecute_yaml
};