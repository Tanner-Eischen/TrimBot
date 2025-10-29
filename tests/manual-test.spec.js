// Manual test script to simulate project creation
import { test, expect } from '@playwright/test';

test('Manual project creation test', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:1420/');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Take a screenshot of initial state
  await page.screenshot({ path: 'initial-state.png' });
  
  // Check if Create New Project button is visible
  const createButton = page.locator('button:has-text("Create New Project")');
  await expect(createButton).toBeVisible();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for dialog events (file picker)
  page.on('dialog', async dialog => {
    console.log(`Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
    await dialog.dismiss();
  });
  
  // Click the create project button
  console.log('Clicking Create New Project button...');
  await createButton.click();
  
  // Wait for any async operations
  await page.waitForTimeout(5000);
  
  // Take a screenshot after clicking
  await page.screenshot({ path: 'after-click.png' });
  
  // Check what's visible now
  const isProjectSetupStillVisible = await page.locator('text=Create New Project').isVisible();
  const isMediaImportVisible = await page.locator('text=Import Media').isVisible();
  const isErrorVisible = await page.locator('.error, [class*="error"]').isVisible();
  
  console.log('Project setup still visible:', isProjectSetupStillVisible);
  console.log('Media import visible:', isMediaImportVisible);
  console.log('Error visible:', isErrorVisible);
  
  // Check for any error messages
  const errorElements = await page.locator('.error, [class*="error"], [role="alert"]').all();
  for (const errorEl of errorElements) {
    const errorText = await errorEl.textContent();
    console.log('Error found:', errorText);
  }
});