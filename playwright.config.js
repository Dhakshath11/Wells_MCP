const { devices } = require('@playwright/test')

// Playwright config to run tests on LambdaTest platform and local
const config = {
  testDir: 'tests',
  testMatch: '**/*.spec.js',
  timeout: 120000,
  use: {
    viewport: null
  },
  workers: 1,
  projects: [

  


    {
      use: {
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`
        },
      viewport: { width: 1280, height: 720 }
      }
    },
  
]
}

module.exports = config


        const capabilities = {
            browserName: "Chrome",
            "LT:Options": {
                user: process.env.LT_USERNAME,
                accessKey: process.env.LT_ACCESS_KEY,
                name: "PW-TEST"
            },
        };
    