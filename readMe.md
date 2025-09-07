Refactor the code to have file operation in one separate class i.e to find file, get file & write file content => To reduce the code present in also all classes; Note: Dont make it a class keep it as a function

------------------------------------------------------------------------------------------------------------------------
// Hybrid LambdaTest credentials setup tool
server.tool(
  "setup-lambdatest-credentials",
  "Collect LambdaTest credentials (mandatory). Uses LLM autofill if possible, otherwise prompts user.",
  {
    LT_USERNAME: z.string().optional().describe(
      "Your LambdaTest username (from https://hyperexecute.lambdatest.com/hyperexecute)"
    ),
    LT_ACCESS_KEY: z.string().optional().describe(
      "Your LambdaTest access key (from the same page)"
    ),
  },
  async ({ LT_USERNAME, LT_ACCESS_KEY }) => {
    // If LLM didn’t provide, fall back to explicit user input
    if (!LT_USERNAME || !LT_ACCESS_KEY) {
      const result = await server.server.elicitInput({
        message: "Please provide your LambdaTest credentials to continue.",
        requestedSchema: {
          type: "object",
          properties: {
            LT_USERNAME: {
              type: "string",
              title: "LambdaTest Username",
              description: "Find this in https://hyperexecute.lambdatest.com/hyperexecute",
            },
            LT_ACCESS_KEY: {
              type: "string",
              title: "LambdaTest Access Key",
              description: "Also available in the same dashboard page",
            },
          },
          required: ["LT_USERNAME", "LT_ACCESS_KEY"],
        },
      });

      if (result.action === "reject") {
        return {
          content: [
            { type: "text", text: "❌ Credentials not provided. Cannot continue." },
          ],
        };
      }

      LT_USERNAME = result.content.LT_USERNAME;
      LT_ACCESS_KEY = result.content.LT_ACCESS_KEY;
    }

    // Save globally
    username = LT_USERNAME!;
    accessKey = LT_ACCESS_KEY!;

    return {
      content: [
        {
          type: "text",
          text: `✅ LambdaTest credentials configured successfully for user: ${username}`,
        },
      ],
    };
  }
);
------------------------------------------------------------------------------------------------------------------------

analyze:
Error: Invalid Credentials / Project Not Found ~ 1 min
Job Commence: Execution Plan ~ 30 Sec
Zip Upload Start: Creating archive ~ 30 sec
Zip Upload Stop: Archive location ~ 5 min
Job Server Connection: Connection to hyperexecute server  ~ 30 sec
YAML Upload: Uploading yaml ~ 1 min
Job Link: Job Link ~ 2 min
Job Track Stop: goroutines have finished ~ 2 min