/**
 * cli-log.test.ts
 *
 * Test suite for LambdaTest HyperExecute CLI log utilities.
 *
 * Author: Dhakshath Amin
 * Date: 9 September 2025
 * Description: Validates log parsing, event detection, and job link extraction from CLI logs using the cli-log module.
 */

import { expect } from 'chai';
import * as cli from "../src/server/tools/cli-log.js";
import * as fileOps from "../src/commons/fileOperations.js";
import logger from "../src/commons/logger";

describe("cli-log.test.ts", function () {
    console.log("--- Test Started: Waiting for few minutes for results ---");
    logger.info('--- Test Started: Waiting for few minutes for results ---');

    logger.info('Setting timeout to 5mins');
    this.timeout(300000); // Allow 5mins for all tests inside this describe

    it("Find CLI Logs", async () => {
        logger.debug('hyperexecute-cli.log file will be updated');
        fileOps.writeFile("hyperexecute-cli.log", fileContents);

        const results = {
            jobTriggered: await cli.isJobTriggered(),
            invalidCreds: await cli.isInvalidCredentials(),
            projectNotFound: await cli.isProjectNotFound(),
            uploadArchiveStarted: await cli.isUploadArchiveStarted(),
            uploadArchiveDone: await cli.isUploadArchiveDone(),
            serverConnectionStarted: await cli.isServerConnectionStarted(),
            jobLinkGenerated: await cli.isJobLinkGenerated(),
            jobTrackStopped: await cli.isJobTrackStopped(),
            yamlNotFound: await cli.isYAMLNotFound(),
            jobLink: await cli.getJobLink(),
        };

        console.log(results);
        logger.info(`Test completed`);
        logger.debug(`${results}`);
        console.table(results);

        // Example: Add expectations
        expect(results.jobLink).to.be.a("string");
    });
});


const fileContents =
    `
{"level":"warn","time":"2025-09-05T12:00:30.769+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T12:00:30.770+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T12:00:31.958+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"debug","time":"2025-09-05T12:00:33.134+0530","caller":"cmd/bin.go:153","msg":"Upstream version details: {Name:cli Min:0.2.265 Max:0.2.302} "}
{"level":"info","time":"2025-09-05T12:00:33.134+0530","caller":"cmd/bin.go:201","msg":"Generating TraceID for tracking request: 01K4C93HKHCK75BZP57EZDHH3S \n"}
{"level":"warn","time":"2025-09-05T12:00:33.135+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T12:00:33.136+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T12:00:36.643+0530","caller":"core/lifecycle.go:107","msg":"Setting environment"}
{"level":"debug","time":"2025-09-05T12:00:36.643+0530","caller":"core/lifecycle.go:110","msg":"Parsing config"}
{"level":"debug","time":"2025-09-05T12:00:36.644+0530","caller":"yamlconfigmanager/setup.go:726","msg":"Custom location for .hyperexecute.yaml specified. Using: hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T12:00:36.644+0530","caller":"yamlconfigmanager/setup.go:118","msg":"using hyperexecute config from : hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T12:00:38.009+0530","caller":"yamlconfigmanager/setup.go:2138","msg":"Autodetecting test type in files of path : /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T12:00:38.010+0530","caller":"yamlconfigmanager/setup.go:2180","msg":"File in which test type is detected - /Users/dhakshath/Documents/Wells_MCP/package.json"}
{"level":"debug","time":"2025-09-05T12:00:38.010+0530","caller":"yamlconfigmanager/setup.go:2181","msg":"Pre command in which test type is detected - npm install playwright@^1.55.0"}
{"level":"debug","time":"2025-09-05T12:00:38.010+0530","caller":"yamlconfigmanager/setup.go:516","msg":"Automatic test type detected - playwright"}
{"level":"debug","time":"2025-09-05T12:00:38.010+0530","caller":"yamlconfigmanager/setup.go:548","msg":"Tunnel: %!t(<nil>)"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:896","msg":"\nExecution Plan"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:697","msg":"Mode:    autosplit"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:757","msg":"Runson:    linux"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:765","msg":"Concurrency:    1"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:829","msg":"Report:    disabled"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:843","msg":"Artefacts:"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:846","msg":"    PW Reports:    playwright-report/**"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:861","msg":"Cache Directories:"}
{"level":"info","time":"2025-09-05T12:00:38.010+0530","caller":"models/HypertestYamlConfig.go:863","msg":"    node_modules"}
{"level":"info","time":"2025-09-05T12:00:38.011+0530","caller":"models/HypertestYamlConfig.go:909","msg":""}
{"level":"debug","time":"2025-09-05T12:00:38.011+0530","caller":"filevalidator/setup.go:49","msg":"Warning: Checking data.json file in current directory, no dataJsonPath found in .hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T12:00:38.011+0530","caller":"filevalidator/setup.go:53","msg":"Warning: data.json file doesn't exist"}
{"level":"debug","time":"2025-09-05T12:00:40.689+0530","caller":"core/lifecycle.go:516","msg":"Job ID: 3c5876e0-c9d6-434f-91be-ccf468c7f7c0"}
{"level":"debug","time":"2025-09-05T12:00:40.689+0530","caller":"core/lifecycle.go:519","msg":"User - dhakshath, triggered job with ID 3c5876e0-c9d6-434f-91be-ccf468c7f7c0 from CLI"}
{"level":"debug","time":"2025-09-05T12:00:40.689+0530","caller":"core/lifecycle.go:522","msg":"User has provided playwright as test type for the job with ID 3c5876e0-c9d6-434f-91be-ccf468c7f7c0"}
{"level":"debug","time":"2025-09-05T12:00:40.689+0530","caller":"events/manager.go:96","msg":"Starting event manager"}
{"level":"debug","time":"2025-09-05T12:00:40.689+0530","caller":"events/manager.go:98","msg":"SSE enabled, getting SSE connection"}
{"level":"debug","time":"2025-09-05T12:00:40.690+0530","caller":"archivemanager/setup.go:339","msg":"digestMap: map[]"}
{"level":"debug","time":"2025-09-05T12:00:40.690+0530","caller":"archivemanager/setup.go:345","msg":"Creating archive of target directory: /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T12:00:40.704+0530","caller":"core/lifecycle.go:673","msg":"Zip file size: 25.47 kB"}
{"level":"debug","time":"2025-09-05T12:00:40.704+0530","caller":"core/lifecycle.go:683","msg":"Archive location: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.zip\n"}
{"level":"debug","time":"2025-09-05T12:00:40.704+0530","caller":"storage/azure.go:59","msg":"Payload size: 25.47 kB, source path /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.zip"}
{"level":"debug","time":"2025-09-05T12:00:40.901+0530","caller":"storage/azure.go:59","msg":"Payload size: 16.80 kB, source path /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff"}
{"level":"debug","time":"2025-09-05T12:00:41.830+0530","caller":"events/manager.go:280","msg":"connection to hyperexecute server established successfully."}
{"level":"info","time":"2025-09-05T12:00:53.028+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.zip upload completed in 12.324393625s"}
{"level":"debug","time":"2025-09-05T12:00:53.029+0530","caller":"receptionmanager/setup.go:271","msg":"number of entries in runtimes: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T12:00:53.029+0530","caller":"receptionmanager/setup.go:300","msg":"number of entries in partialreports: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T12:00:53.029+0530","caller":"receptionmanager/setup.go:185","msg":"Uploading yaml : /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T12:00:53.029+0530","caller":"storage/azure.go:59","msg":"Payload size: 3.86 kB, source path /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"info","time":"2025-09-05T12:01:01.046+0530","caller":"storage/azure.go:114","msg":"File: /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff upload completed in 20.1456875s"}
{"level":"info","time":"2025-09-05T12:01:11.077+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml upload completed in 18.048015083s"}
{"level":"debug","time":"2025-09-05T12:01:11.077+0530","caller":"core/lifecycle.go:710","msg":"Successfully deleted code archive: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.zip\n"}
{"level":"debug","time":"2025-09-05T12:01:11.078+0530","caller":"storage/azure.go:59","msg":"Payload size: 1.79 kB, source path mask-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.yaml"}
{"level":"info","time":"2025-09-05T12:01:23.142+0530","caller":"storage/azure.go:114","msg":"File: mask-3c5876e0-c9d6-434f-91be-ccf468c7f7c0.yaml upload completed in 12.063957s"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:825","msg":"Job progress won't be tracked as no-track flag is set true"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:899","msg":"Context canceled"}
{"level":"info","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:902","msg":"Stopping pipeline gracefully"}
{"level":"info","time":"2025-09-05T12:01:24.819+0530","caller":"events/manager.go:330","msg":"context done and stopping SSE"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"events/manager.go:248","msg":"Stopping event manager"}
{"level":"info","time":"2025-09-05T12:01:24.819+0530","caller":"jobmanager/manager.go:143","msg":"Job Link: https://hyperexecute.lambdatest.com/hyperexecute/task?jobId=3c5876e0-c9d6-434f-91be-ccf468c7f7c0\n"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:59","msg":"Quit requested from main goroutine...."}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:60","msg":"Waiting for the goroutines to exit"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"core/lifecycle.go:63","msg":"All lifecycle goroutines exited"}
{"level":"debug","time":"2025-09-05T12:01:24.819+0530","caller":"cmd/bin.go:359","msg":"main: all goroutines have finished."}
{"level":"warn","time":"2025-09-05T15:27:41.693+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:27:41.695+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:27:42.971+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"debug","time":"2025-09-05T15:27:44.173+0530","caller":"cmd/bin.go:153","msg":"Upstream version details: {Name:cli Min:0.2.265 Max:0.2.302} "}
{"level":"info","time":"2025-09-05T15:27:44.174+0530","caller":"cmd/bin.go:201","msg":"Generating TraceID for tracking request: 01K4CMYX5WH5RG75CJZTV9XNQH \n"}


{"level":"warn","time":"2025-09-05T15:27:44.176+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:27:44.176+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:27:47.454+0530","caller":"core/lifecycle.go:107","msg":"Setting environment"}
{"level":"debug","time":"2025-09-05T15:27:47.455+0530","caller":"core/lifecycle.go:110","msg":"Parsing config"}
{"level":"debug","time":"2025-09-05T15:27:47.455+0530","caller":"yamlconfigmanager/setup.go:726","msg":"Custom location for .hyperexecute.yaml specified. Using: hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:27:47.455+0530","caller":"yamlconfigmanager/setup.go:118","msg":"using hyperexecute config from : hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:27:48.881+0530","caller":"yamlconfigmanager/setup.go:2138","msg":"Autodetecting test type in files of path : /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T15:27:48.881+0530","caller":"yamlconfigmanager/setup.go:2180","msg":"File in which test type is detected - /Users/dhakshath/Documents/Wells_MCP/package.json"}
{"level":"debug","time":"2025-09-05T15:27:48.881+0530","caller":"yamlconfigmanager/setup.go:2181","msg":"Pre command in which test type is detected - npm install playwright@^1.55.0"}
{"level":"debug","time":"2025-09-05T15:27:48.882+0530","caller":"yamlconfigmanager/setup.go:516","msg":"Automatic test type detected - playwright"}
{"level":"debug","time":"2025-09-05T15:27:48.882+0530","caller":"yamlconfigmanager/setup.go:548","msg":"Tunnel: %!t(<nil>)"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:896","msg":"\n\u001b[4m\u001b[1m\u001b[97mExecution Plan\u001b[0m\u001b[22m\u001b[24m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:697","msg":"Mode:    \u001b[36mautosplit\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:757","msg":"Runson:    \u001b[36mlinux\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:765","msg":"Concurrency:    \u001b[36m1\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:829","msg":"Report:    \u001b[36mdisabled\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:843","msg":"Artefacts:"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:846","msg":"    PW Reports:    \u001b[36mplaywright-report/**\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:861","msg":"Cache Directories:"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:863","msg":"    \u001b[36mnode_modules\u001b[0m"}
{"level":"info","time":"2025-09-05T15:27:48.882+0530","caller":"models/HypertestYamlConfig.go:909","msg":""}
{"level":"debug","time":"2025-09-05T15:27:48.882+0530","caller":"filevalidator/setup.go:49","msg":"Warning: Checking data.json file in current directory, no dataJsonPath found in .hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:27:48.882+0530","caller":"filevalidator/setup.go:53","msg":"Warning: data.json file doesn't exist"}
{"level":"debug","time":"2025-09-05T15:27:51.290+0530","caller":"core/lifecycle.go:1057","msg":"Project not found at sentinel, trying to link to TMS"}
{"level":"debug","time":"2025-09-05T15:28:08.671+0530","caller":"core/lifecycle.go:1060","msg":"Error in linking project to TMS: unexpected end of JSON input"}
{"level":"error","time":"2025-09-05T15:28:08.672+0530","caller":"core/lifecycle.go:166","msg":"2025-09-05T15:27:41+05:30    error    \u001b[91mERR::PROJECT::NTFND\u001b[0m     Project not found. unexpected end of JSON input    Error while validating project"}
{"level":"debug","time":"2025-09-05T15:28:08.672+0530","caller":"core/lifecycle.go:59","msg":"Quit requested from main goroutine...."}
{"level":"debug","time":"2025-09-05T15:28:08.672+0530","caller":"core/lifecycle.go:60","msg":"Waiting for the goroutines to exit"}
{"level":"debug","time":"2025-09-05T15:28:08.672+0530","caller":"core/lifecycle.go:63","msg":"All lifecycle goroutines exited"}
{"level":"debug","time":"2025-09-05T15:28:08.672+0530","caller":"cmd/bin.go:359","msg":"main: all goroutines have finished."}
{"level":"debug","time":"2025-09-05T15:28:08.672+0530","caller":"cmd/bin.go:398","msg":"Exiting application due to error \u001b[91mERR::PROJECT::NTFND\u001b[0m     Project not found. unexpected end of JSON input"}


{"level":"warn","time":"2025-09-05T15:30:08.517+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:30:08.517+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:30:09.806+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"debug","time":"2025-09-05T15:30:11.001+0530","caller":"cmd/bin.go:153","msg":"Upstream version details: {Name:cli Min:0.2.265 Max:0.2.302} "}
{"level":"info","time":"2025-09-05T15:30:11.002+0530","caller":"cmd/bin.go:201","msg":"Generating TraceID for tracking request: 01K4CN3CJ4KM2Q469787SDZ3WS \n"}
{"level":"warn","time":"2025-09-05T15:30:11.003+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:30:11.003+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:30:14.233+0530","caller":"core/lifecycle.go:107","msg":"Setting environment"}
{"level":"debug","time":"2025-09-05T15:30:14.233+0530","caller":"core/lifecycle.go:110","msg":"Parsing config"}
{"level":"debug","time":"2025-09-05T15:30:14.234+0530","caller":"yamlconfigmanager/setup.go:726","msg":"Custom location for .hyperexecute.yaml specified. Using: hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:30:14.234+0530","caller":"yamlconfigmanager/setup.go:118","msg":"using hyperexecute config from : hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:30:15.633+0530","caller":"yamlconfigmanager/setup.go:2138","msg":"Autodetecting test type in files of path : /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T15:30:15.634+0530","caller":"yamlconfigmanager/setup.go:2180","msg":"File in which test type is detected - /Users/dhakshath/Documents/Wells_MCP/package.json"}
{"level":"debug","time":"2025-09-05T15:30:15.635+0530","caller":"yamlconfigmanager/setup.go:2181","msg":"Pre command in which test type is detected - npm install playwright@^1.55.0"}
{"level":"debug","time":"2025-09-05T15:30:15.635+0530","caller":"yamlconfigmanager/setup.go:516","msg":"Automatic test type detected - playwright"}
{"level":"debug","time":"2025-09-05T15:30:15.635+0530","caller":"yamlconfigmanager/setup.go:548","msg":"Tunnel: %!t(<nil>)"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:896","msg":"\n\u001b[4m\u001b[1m\u001b[97mExecution Plan\u001b[0m\u001b[22m\u001b[24m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:697","msg":"Mode:    \u001b[36mautosplit\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:757","msg":"Runson:    \u001b[36mlinux\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:765","msg":"Concurrency:    \u001b[36m1\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:829","msg":"Report:    \u001b[36mdisabled\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:843","msg":"Artefacts:"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:846","msg":"    PW Reports:    \u001b[36mplaywright-report/**\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:861","msg":"Cache Directories:"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:863","msg":"    \u001b[36mnode_modules\u001b[0m"}
{"level":"info","time":"2025-09-05T15:30:15.635+0530","caller":"models/HypertestYamlConfig.go:909","msg":""}
{"level":"debug","time":"2025-09-05T15:30:15.635+0530","caller":"filevalidator/setup.go:49","msg":"Warning: Checking data.json file in current directory, no dataJsonPath found in .hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:30:15.635+0530","caller":"filevalidator/setup.go:53","msg":"Warning: data.json file doesn't exist"}
{"level":"debug","time":"2025-09-05T15:30:18.398+0530","caller":"core/lifecycle.go:516","msg":"Job ID: e9145958-68be-4611-992e-83fae2c23839"}
{"level":"debug","time":"2025-09-05T15:30:18.398+0530","caller":"core/lifecycle.go:519","msg":"User - dhakshath, triggered job with ID e9145958-68be-4611-992e-83fae2c23839 from CLI"}
{"level":"debug","time":"2025-09-05T15:30:18.398+0530","caller":"events/manager.go:96","msg":"Starting event manager"}
{"level":"debug","time":"2025-09-05T15:30:18.398+0530","caller":"events/manager.go:98","msg":"SSE enabled, getting SSE connection"}
{"level":"debug","time":"2025-09-05T15:30:18.398+0530","caller":"core/lifecycle.go:522","msg":"User has provided playwright as test type for the job with ID e9145958-68be-4611-992e-83fae2c23839"}
{"level":"debug","time":"2025-09-05T15:30:18.399+0530","caller":"archivemanager/setup.go:339","msg":"digestMap: map[]"}
{"level":"debug","time":"2025-09-05T15:30:18.399+0530","caller":"archivemanager/setup.go:345","msg":"Creating archive of target directory: /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T15:30:18.416+0530","caller":"core/lifecycle.go:673","msg":"Zip file size: 26.42 kB"}
{"level":"debug","time":"2025-09-05T15:30:18.416+0530","caller":"core/lifecycle.go:683","msg":"Archive location: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-e9145958-68be-4611-992e-83fae2c23839.zip\n"}
{"level":"debug","time":"2025-09-05T15:30:18.416+0530","caller":"storage/azure.go:59","msg":"Payload size: 26.42 kB, source path /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-e9145958-68be-4611-992e-83fae2c23839.zip"}
{"level":"debug","time":"2025-09-05T15:30:18.601+0530","caller":"storage/azure.go:59","msg":"Payload size: 798 B, source path /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff"}
{"level":"debug","time":"2025-09-05T15:30:19.498+0530","caller":"events/manager.go:280","msg":"connection to hyperexecute server established successfully."}
{"level":"info","time":"2025-09-05T15:30:30.738+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-e9145958-68be-4611-992e-83fae2c23839.zip upload completed in 12.321779667s"}
{"level":"debug","time":"2025-09-05T15:30:30.738+0530","caller":"receptionmanager/setup.go:271","msg":"number of entries in runtimes: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T15:30:30.738+0530","caller":"receptionmanager/setup.go:300","msg":"number of entries in partialreports: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T15:30:30.739+0530","caller":"receptionmanager/setup.go:185","msg":"Uploading yaml : /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:30:30.739+0530","caller":"storage/azure.go:59","msg":"Payload size: 3.88 kB, source path /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"info","time":"2025-09-05T15:30:38.779+0530","caller":"storage/azure.go:114","msg":"File: /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff upload completed in 20.177930167s"}
{"level":"info","time":"2025-09-05T15:30:46.804+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml upload completed in 16.065866917s"}
{"level":"debug","time":"2025-09-05T15:30:46.805+0530","caller":"core/lifecycle.go:710","msg":"Successfully deleted code archive: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-e9145958-68be-4611-992e-83fae2c23839.zip\n"}
{"level":"debug","time":"2025-09-05T15:30:46.805+0530","caller":"storage/azure.go:59","msg":"Payload size: 1.92 kB, source path mask-e9145958-68be-4611-992e-83fae2c23839.yaml"}
{"level":"info","time":"2025-09-05T15:30:58.849+0530","caller":"storage/azure.go:114","msg":"File: mask-e9145958-68be-4611-992e-83fae2c23839.yaml upload completed in 12.044189625s"}
{"level":"debug","time":"2025-09-05T15:31:00.600+0530","caller":"core/lifecycle.go:825","msg":"Job progress won't be tracked as no-track flag is set true"}
{"level":"debug","time":"2025-09-05T15:31:00.600+0530","caller":"core/lifecycle.go:899","msg":"Context canceled"}
{"level":"info","time":"2025-09-05T15:31:00.600+0530","caller":"core/lifecycle.go:902","msg":"\u001b[2mStopping pipeline gracefully\u001b[22m"}
{"level":"info","time":"2025-09-05T15:31:00.600+0530","caller":"events/manager.go:330","msg":"context done and stopping SSE"}
{"level":"debug","time":"2025-09-05T15:31:00.601+0530","caller":"events/manager.go:248","msg":"Stopping event manager"}
{"level":"info","time":"2025-09-05T15:31:00.601+0530","caller":"jobmanager/manager.go:143","msg":"Job Link: \u001b[4m\u001b[34mhttps://hyperexecute.lambdatest.com/hyperexecute/task?jobId=e9145958-68be-4611-992e-83fae2c23839\u001b[0m\u001b[24m\n"}
{"level":"debug","time":"2025-09-05T15:31:00.601+0530","caller":"core/lifecycle.go:59","msg":"Quit requested from main goroutine...."}
{"level":"debug","time":"2025-09-05T15:31:00.601+0530","caller":"core/lifecycle.go:60","msg":"Waiting for the goroutines to exit"}
{"level":"debug","time":"2025-09-05T15:31:00.601+0530","caller":"core/lifecycle.go:63","msg":"All lifecycle goroutines exited"}
{"level":"debug","time":"2025-09-05T15:31:00.601+0530","caller":"cmd/bin.go:359","msg":"main: all goroutines have finished."}


{"level":"warn","time":"2025-09-05T15:42:58.437+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:42:58.438+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:42:59.727+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"debug","time":"2025-09-05T15:43:00.918+0530","caller":"cmd/bin.go:153","msg":"Upstream version details: {Name:cli Min:0.2.265 Max:0.2.302} "}
{"level":"info","time":"2025-09-05T15:43:00.918+0530","caller":"cmd/bin.go:201","msg":"Generating TraceID for tracking request: 01K4CNTWE40BHK9RE3VQ25R2SR \n"}
{"level":"warn","time":"2025-09-05T15:43:00.919+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:43:00.920+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"info","time":"2025-09-05T15:43:28.799+0530","caller":"storage/azure.go:114","msg":"File: /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff upload completed in 20.108059167s"}
{"level":"info","time":"2025-09-05T15:43:36.846+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml upload completed in 16.070264042s"}
{"level":"debug","time":"2025-09-05T15:43:36.846+0530","caller":"core/lifecycle.go:710","msg":"Successfully deleted code archive: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-b12cf55a-3d79-415e-9dfc-12825adb9ee3.zip\n"}
{"level":"debug","time":"2025-09-05T15:43:36.847+0530","caller":"storage/azure.go:59","msg":"Payload size: 1.92 kB, source path mask-b12cf55a-3d79-415e-9dfc-12825adb9ee3.yaml"}
{"level":"info","time":"2025-09-05T15:43:48.912+0530","caller":"storage/azure.go:114","msg":"File: mask-b12cf55a-3d79-415e-9dfc-12825adb9ee3.yaml upload completed in 12.06459325s"}
{"level":"debug","time":"2025-09-05T15:43:50.529+0530","caller":"core/lifecycle.go:825","msg":"Job progress won't be tracked as no-track flag is set true"}
{"level":"debug","time":"2025-09-05T15:43:50.529+0530","caller":"core/lifecycle.go:899","msg":"Context canceled"}
{"level":"info","time":"2025-09-05T15:43:50.529+0530","caller":"events/manager.go:330","msg":"context done and stopping SSE"}
{"level":"debug","time":"2025-09-05T15:43:50.529+0530","caller":"events/manager.go:248","msg":"Stopping event manager"}
{"level":"info","time":"2025-09-05T15:43:50.529+0530","caller":"core/lifecycle.go:902","msg":"\u001b[2mStopping pipeline gracefully\u001b[22m"}
{"level":"info","time":"2025-09-05T15:43:50.529+0530","caller":"jobmanager/manager.go:143","msg":"Job Link: \u001b[4m\u001b[34mhttps://hyperexecute.lambdatest.com/hyperexecute/task?jobId=b12cf55a-3d79-415e-9dfc-12825adb9ee3\u001b[0m\u001b[24m\n"}
{"level":"debug","time":"2025-09-05T15:43:50.529+0530","caller":"core/lifecycle.go:59","msg":"Quit requested from main goroutine...."}
{"level":"debug","time":"2025-09-05T15:43:50.530+0530","caller":"core/lifecycle.go:60","msg":"Waiting for the goroutines to exit"}
{"level":"debug","time":"2025-09-05T15:43:50.530+0530","caller":"core/lifecycle.go:63","msg":"All lifecycle goroutines exited"}
{"level":"debug","time":"2025-09-05T15:43:50.530+0530","caller":"cmd/bin.go:359","msg":"main: all goroutines have finished."}


{"level":"warn","time":"2025-09-05T15:44:10.629+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:44:10.630+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:44:11.829+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"debug","time":"2025-09-05T15:44:13.043+0530","caller":"cmd/bin.go:153","msg":"Upstream version details: {Name:cli Min:0.2.265 Max:0.2.302} "}
{"level":"info","time":"2025-09-05T15:44:13.044+0530","caller":"cmd/bin.go:201","msg":"Generating TraceID for tracking request: 01K4CNX2Y4QTCFN8GSMK528P0W \n"}
{"level":"warn","time":"2025-09-05T15:44:13.046+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:44:13.046+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:44:16.369+0530","caller":"core/lifecycle.go:107","msg":"Setting environment"}
{"level":"debug","time":"2025-09-05T15:44:16.369+0530","caller":"core/lifecycle.go:110","msg":"Parsing config"}
{"level":"debug","time":"2025-09-05T15:44:16.370+0530","caller":"yamlconfigmanager/setup.go:726","msg":"Custom location for .hyperexecute.yaml specified. Using: hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:44:16.370+0530","caller":"yamlconfigmanager/setup.go:118","msg":"using hyperexecute config from : hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:44:17.815+0530","caller":"yamlconfigmanager/setup.go:2138","msg":"Autodetecting test type in files of path : /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T15:44:17.816+0530","caller":"yamlconfigmanager/setup.go:2180","msg":"File in which test type is detected - /Users/dhakshath/Documents/Wells_MCP/package.json"}
{"level":"debug","time":"2025-09-05T15:44:17.816+0530","caller":"yamlconfigmanager/setup.go:2181","msg":"Pre command in which test type is detected - npm install playwright@^1.55.0"}
{"level":"debug","time":"2025-09-05T15:44:17.816+0530","caller":"yamlconfigmanager/setup.go:516","msg":"Automatic test type detected - playwright"}
{"level":"debug","time":"2025-09-05T15:44:17.817+0530","caller":"yamlconfigmanager/setup.go:548","msg":"Tunnel: %!t(<nil>)"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:896","msg":"\n\u001b[4m\u001b[1m\u001b[97mExecution Plan\u001b[0m\u001b[22m\u001b[24m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:697","msg":"Mode:    \u001b[36mautosplit\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:757","msg":"Runson:    \u001b[36mlinux\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:765","msg":"Concurrency:    \u001b[36m1\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:829","msg":"Report:    \u001b[36mdisabled\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:843","msg":"Artefacts:"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:846","msg":"    PW Reports:    \u001b[36mplaywright-report/**\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:861","msg":"Cache Directories:"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:863","msg":"    \u001b[36mnode_modules\u001b[0m"}
{"level":"info","time":"2025-09-05T15:44:17.817+0530","caller":"models/HypertestYamlConfig.go:909","msg":""}
{"level":"debug","time":"2025-09-05T15:44:17.817+0530","caller":"filevalidator/setup.go:49","msg":"Warning: Checking data.json file in current directory, no dataJsonPath found in .hyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:44:17.817+0530","caller":"filevalidator/setup.go:53","msg":"Warning: data.json file doesn't exist"}
{"level":"debug","time":"2025-09-05T15:44:20.597+0530","caller":"core/lifecycle.go:516","msg":"Job ID: 512b307d-1e68-44bf-af56-2b4b22fde22e"}
{"level":"debug","time":"2025-09-05T15:44:20.597+0530","caller":"events/manager.go:96","msg":"Starting event manager"}
{"level":"debug","time":"2025-09-05T15:44:20.597+0530","caller":"events/manager.go:98","msg":"SSE enabled, getting SSE connection"}
{"level":"debug","time":"2025-09-05T15:44:20.597+0530","caller":"core/lifecycle.go:519","msg":"User - dhakshath, triggered job with ID 512b307d-1e68-44bf-af56-2b4b22fde22e from CLI"}
{"level":"debug","time":"2025-09-05T15:44:20.597+0530","caller":"core/lifecycle.go:522","msg":"User has provided playwright as test type for the job with ID 512b307d-1e68-44bf-af56-2b4b22fde22e"}
{"level":"debug","time":"2025-09-05T15:44:20.598+0530","caller":"archivemanager/setup.go:339","msg":"digestMap: map[]"}
{"level":"debug","time":"2025-09-05T15:44:20.598+0530","caller":"archivemanager/setup.go:345","msg":"Creating archive of target directory: /Users/dhakshath/Documents/Wells_MCP"}
{"level":"debug","time":"2025-09-05T15:44:20.619+0530","caller":"core/lifecycle.go:673","msg":"Zip file size: 23.25 kB"}
{"level":"debug","time":"2025-09-05T15:44:20.619+0530","caller":"core/lifecycle.go:683","msg":"Archive location: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-512b307d-1e68-44bf-af56-2b4b22fde22e.zip\n"}
{"level":"debug","time":"2025-09-05T15:44:20.619+0530","caller":"storage/azure.go:59","msg":"Payload size: 23.25 kB, source path /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-512b307d-1e68-44bf-af56-2b4b22fde22e.zip"}
{"level":"debug","time":"2025-09-05T15:44:20.777+0530","caller":"storage/azure.go:59","msg":"Payload size: 7.65 kB, source path /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff"}
{"level":"debug","time":"2025-09-05T15:44:21.674+0530","caller":"events/manager.go:280","msg":"connection to hyperexecute server established successfully."}
{"level":"info","time":"2025-09-05T15:44:32.730+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-512b307d-1e68-44bf-af56-2b4b22fde22e.zip upload completed in 12.110459333s"}
{"level":"debug","time":"2025-09-05T15:44:32.730+0530","caller":"receptionmanager/setup.go:271","msg":"number of entries in runtimes: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T15:44:32.730+0530","caller":"receptionmanager/setup.go:300","msg":"number of entries in partialreports: 0, switching to new yaml format"}
{"level":"debug","time":"2025-09-05T15:44:32.731+0530","caller":"receptionmanager/setup.go:185","msg":"Uploading yaml : /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"debug","time":"2025-09-05T15:44:32.731+0530","caller":"storage/azure.go:59","msg":"Payload size: 3.88 kB, source path /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml"}
{"level":"info","time":"2025-09-05T15:44:40.756+0530","caller":"storage/azure.go:114","msg":"File: /var/folders/d5/vhtnmxhj2cdbdlvq4jlw4dz00000gp/T/git.diff upload completed in 19.979176416s"}
{"level":"info","time":"2025-09-05T15:44:48.796+0530","caller":"storage/azure.go:114","msg":"File: /Users/dhakshath/Documents/Wells_MCP/.updatedhyperexecute.yaml upload completed in 16.065599542s"}
{"level":"debug","time":"2025-09-05T15:44:48.797+0530","caller":"core/lifecycle.go:710","msg":"Successfully deleted code archive: /Users/dhakshath/Documents/Wells_MCP/hyperexecute-code-512b307d-1e68-44bf-af56-2b4b22fde22e.zip\n"}
{"level":"debug","time":"2025-09-05T15:44:48.797+0530","caller":"storage/azure.go:59","msg":"Payload size: 1.92 kB, source path mask-512b307d-1e68-44bf-af56-2b4b22fde22e.yaml"}
{"level":"info","time":"2025-09-05T15:45:00.857+0530","caller":"storage/azure.go:114","msg":"File: mask-512b307d-1e68-44bf-af56-2b4b22fde22e.yaml upload completed in 12.059940083s"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:825","msg":"Job progress won't be tracked as no-track flag is set true"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:899","msg":"Context canceled"}
{"level":"info","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:902","msg":"\u001b[2mStopping pipeline gracefully\u001b[22m"}
{"level":"info","time":"2025-09-05T15:45:02.705+0530","caller":"events/manager.go:330","msg":"context done and stopping SSE"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"events/manager.go:248","msg":"Stopping event manager"}
{"level":"info","time":"2025-09-05T15:45:02.705+0530","caller":"jobmanager/manager.go:143","msg":"Job Link: \u001b[4m\u001b[34mhttps://hyperexecute.lambdatest.com/hyperexecute/task?jobId=512b307d-1e68-44bf-af56-2b4b22fde22e\u001b[0m\u001b[24m\n"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:59","msg":"Quit requested from main goroutine...."}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:60","msg":"Waiting for the goroutines to exit"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"core/lifecycle.go:63","msg":"All lifecycle goroutines exited"}
{"level":"debug","time":"2025-09-05T15:45:02.705+0530","caller":"cmd/bin.go:359","msg":"main: all goroutines have finished."}



{"level":"warn","time":"2025-09-05T15:47:11.004+0530","caller":"globalconfigvalidator/setup.go:45","msg":"Found user credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"warn","time":"2025-09-05T15:47:11.005+0530","caller":"globalconfigvalidator/setup.go:50","msg":"Found key credentials in env and cli flag both, credentials in env will be ignored"}
{"level":"debug","time":"2025-09-05T15:47:12.573+0530","caller":"cmd/bin.go:144","msg":"cli os: darwin, cli arch: arm64"}
{"level":"error","time":"2025-09-05T15:47:14.067+0530","caller":"cmd/bin.go:150","msg":"2025-09-05T15:47:11+05:30    error    \u001b[91mERR::UP::VER\u001b[0m     Unable to fetch latest version from upstream  \u001b[91mERR::HTTP::RESP\u001b[0m     non-20x status code 401    Invalid user/key credentials"}


{"level":"debug","time":"2025-09-17T18:40:05.900+0530","caller":"cmd/bin.go:398","msg":"Exiting application due to error \u001b[91mERR::NO::HTY\u001b[0m     Unable to find hyperexecute config file.    No file found at location hyperexecute.yaml"}

`;