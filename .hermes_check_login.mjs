import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto('https://projecthub-rose.vercel.app', { waitUntil: 'networkidle' });

    // Wait for the page to render fully
    await page.waitForTimeout(2000);

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for login buttons
    const bodyText = await page.textContent('body');
    const hasGoogle = bodyText.includes('Continue with Google') || bodyText.includes('Google');
    const hasGitHub = bodyText.includes('Continue with GitHub') || bodyText.includes('GitHub');
    console.log('Contains "Continue with Google":', hasGoogle);
    console.log('Contains "Continue with GitHub":', hasGitHub);

    // Check for button elements specifically
    const buttons = await page.locator('button, a').all();
    console.log('Total button/link elements found:', buttons.length);
    for (const btn of buttons) {
      const text = (await btn.textContent())?.trim();
      if (text && (text.includes('Google') || text.includes('GitHub'))) {
        console.log('  Login button found:', JSON.stringify(text));
      }
    }

    // Take screenshot
    await page.screenshot({ path: '/Users/leo/Desktop/projects/ProjectsHub/login_screenshot.png', fullPage: false });
    console.log('\nScreenshot saved to login_screenshot.png');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
