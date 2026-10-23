const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const outputDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8089', { waitUntil: 'networkidle0' });

  // 1. Initial Landing Page
  console.log('Capturing 01-uploader-landing.png...');
  await page.screenshot({
    path: path.join(outputDir, '01-uploader-landing.png'),
    fullPage: false
  });

  // Click on the first sample image to open workstation & start Step 1
  console.log('Clicking sample photo to activate workstation...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sampleBtn = btns.find(b => b.textContent && b.textContent.includes('GUIDE ➔')) ||
                      btns.find(b => b.textContent && b.textContent.includes('DEMO SAMPLE'));
    if (sampleBtn) {
      sampleBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Pause the tour autoPlay so steps don't change automatically
  await page.evaluate(() => {
    const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Pause'));
    if (pauseBtn) pauseBtn.click();
  });

  // 2. Step 1: Cropper & Aspect Ratio
  console.log('Capturing 02-step1-cropper-matrix.png...');
  await page.screenshot({
    path: path.join(outputDir, '02-step1-cropper-matrix.png'),
    fullPage: false
  });

  // Advance to Step 2
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('NEXT'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 03-step2-target-size-compression.png...');
  await page.screenshot({
    path: path.join(outputDir, '03-step2-target-size-compression.png'),
    fullPage: false
  });

  // Advance to Step 3
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('NEXT'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 04-step3-split-wiper-telemetry.png...');
  await page.screenshot({
    path: path.join(outputDir, '04-step3-split-wiper-telemetry.png'),
    fullPage: false
  });

  // Advance to Step 4
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('NEXT'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 05-step4-export-download.png...');
  await page.screenshot({
    path: path.join(outputDir, '05-step4-export-download.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
