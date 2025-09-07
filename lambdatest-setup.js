/**

* Add the file in your test suite to run tests on LambdaTest.

* Import `test` object from this file in the tests.

*/

 

import * as base from "@playwright/test";
import path from "path";
import { chromium } from "playwright";


const getErrorMessage = (obj, keys) =>
  keys.reduce(
    (obj, key) => (typeof obj == "object" ? obj[key] : undefined),
    obj
  );

 
const expect = base.expect
const test = base.test.extend({
  
  page: async ({ page, playwright }, use, testInfo) => {

      await use(page);

 

      const testStatus = {

        action: "setTestStatus",

        arguments: {

          status: testInfo.status,

          remark: getErrorMessage(testInfo, ["error", "message"]),

        },

      };

      await page.evaluate(() => {},

      `lambdatest_action: ${JSON.stringify(testStatus)}`);

      await page.close();

    // }

  },

});

 

export { test, expect };