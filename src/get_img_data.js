(async()=>{
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({headless:true});
  const page = await browser.newPage();
  await Promise.all([
    page.coverage.startCSSCoverage(),
    page.coverage.startJSCoverage()
  ]);
  await page.emulate(iPhone);
  await page.goto('http://m.gzhuiai.net/wa/jf610_jt/');
  
  await browser.close();
})()