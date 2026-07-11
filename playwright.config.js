import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  fullyParallel:false,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[['html',{outputFolder:'playwright-report',open:'never'}],['list']]:'list',
  use:{baseURL:'http://127.0.0.1:3201',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run start:e2e',url:'http://127.0.0.1:3201/api/health/live',reuseExistingServer:false,timeout:60000},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}},
  ],
});
