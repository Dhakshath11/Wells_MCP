import logger from "../src/commons/logger";

describe("logger.test.ts", function () {
  try {
    logger.info(`Testing logger`);
    logger.debug(`Debug test`);
    logger.warn(`Warning test`);
    logger.error(`Error test with error`);

    logger.info(`Going to clean logs older than 7 days`);
    logger.warn(`If log does not have any date older than 7 days, then it won't clean`);

    throw new Error("Simulated runtime crash for testing");
  } catch (error: any) {
    logger.error(`Error testing with message`, error);
  }
});
