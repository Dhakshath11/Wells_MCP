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
import * as fileOps from "../commons/fileOperations";

const execAsync = util.promisify(exec);
const playwright_hyperexecute_yaml_url = "https://gist.githubusercontent.com/Dhakshath11/35a42bf955415621c2a5d4d836d22aa8/raw/hyperexecute.yaml";
const lambdatest_setup_file_url = "https://gist.githubusercontent.com/Dhakshath11/ce6cf8443190c3ae2f0d12bf9229b45d/raw/lambdatest-setup.js";

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
  
  const download_Lambdatest_Setup_File = async () =>
    await downloadFile(lambdatest_setup_file_url, "lambdatest-setup.js");
  

export {
    download_Playwright_hyperexecute_yaml,
    download_Lambdatest_Setup_File
};