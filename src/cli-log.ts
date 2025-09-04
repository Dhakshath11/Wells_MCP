import * as fs from "fs";
import * as path from "path";

function deletLogFile(filePath: string = 'hyperexecute-cli.log'): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

async function waitForLogMessage(
    logFile: string,
    searchString: string,
    timeoutMs = 30000,
    intervalMs = 1000
): Promise<boolean> {
    const absolutePath = path.resolve(logFile);

    return new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
            try {
                if (!fs.existsSync(absolutePath)) return; // file not yet created
                const contents = fs.readFileSync(absolutePath, "utf-8");
                if (contents.includes(searchString)) {
                    clearInterval(timer);
                    resolve(true); // found string
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(timer);
                    resolve(false); // timeout
                }
            } catch (err) {
                clearInterval(timer);
                reject(err);
            }
        }, intervalMs);
    });
}

async function isJobTriggered(): Promise<boolean> {
    try {
        const logFile = path.resolve('hyperexecute-cli.log');
        const searchString = 'Generating TraceID for tracking request';
        const isTriggered = await waitForLogMessage(logFile, searchString, 30000, 2000); // 30 seconds, 2 seconds interval
        if (isTriggered) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error: any) {
        return false;
    }
}
export { isJobTriggered, deletLogFile }