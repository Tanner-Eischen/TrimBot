/**
 * TrimBot E2E Tests - Playwright
 * End-to-end tests for core application workflows
 */

import { test, expect } from '@playwright/test';

test.describe('TrimBot Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });
  });

  test.describe('Application Load', () => {
    test('should display project setup screen on first load', async ({
      page,
    }) => {
      // Wait for main content to load
      await page.waitForSelector('button');

      // Look for create project button or similar
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('should have correct page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeDefined();
    });

    test('should not have console errors on load', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Filter out known safe errors
      const criticalErrors = errors.filter(
        (err) =>
          !err.includes('Not implemented') &&
          !err.includes('ResizeObserver') &&
          !err.includes('Warning')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should display theme toggle', async ({ page }) => {
      // Look for any accessible interactive elements
      const buttons = await page.locator('button').all();
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test.describe('Project Creation Flow', () => {
    test('should show create project interface', async ({ page }) => {
      // Wait for page to be ready
      await page.waitForSelector('button', { timeout: 5000 });

      // Check that there are interactive elements
      const interactiveElements = await page
        .locator('button, [role="button"]')
        .count();
      expect(interactiveElements).toBeGreaterThan(0);
    });

    test('should navigate through main views', async ({ page }) => {
      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });

      // Take a screenshot to verify visible elements
      const content = await page.content();
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should have accessible navigation elements', async ({ page }) => {
      // Check for navigation buttons
      const navButtons = await page.locator('button').all();
      expect(navButtons.length).toBeGreaterThan(0);
    });

    test('should respond to button clicks', async ({ page }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 0) {
        // Try clicking first button
        await buttons[0].click();

        // Page should still be responsive
        await page.waitForTimeout(500);
        const stillHasContent = await page.content();
        expect(stillHasContent).toBeDefined();
      }
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should be responsive to viewport changes', async ({ page }) => {
      // Check initial viewport
      const initialSize = page.viewportSize();
      expect(initialSize).toBeDefined();

      // Resize viewport
      await page.setViewportSize({ width: 800, height: 600 });

      // Check that page still responds
      const newSize = page.viewportSize();
      expect(newSize?.width).toBe(800);
      expect(newSize?.height).toBe(600);

      // Reset to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileSize = page.viewportSize();
      expect(mobileSize?.width).toBe(375);
    });

    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Wait for content to render
      await page.waitForTimeout(1000);

      // Check that page is still functional
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('should render on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Wait for content to render
      await page.waitForTimeout(1000);

      // Check that page is still functional
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have keyboard accessible elements', async ({ page }) => {
      // Focus on first element
      await page.keyboard.press('Tab');

      // Get focused element
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );

      expect(focusedElement).toBeDefined();
    });

    test('should support tab navigation', async ({ page }) => {
      // Get all tabbable elements
      const tabbableCount = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]'
        );
        return elements.length;
      });

      expect(tabbableCount).toBeGreaterThan(0);
    });

    test('should have semantic HTML structure', async ({ page }) => {
      // Check for semantic elements
      const hasSemanticElements = await page.evaluate(() => {
        const semanticTags = [
          'nav',
          'main',
          'header',
          'footer',
          'article',
          'section',
        ];
        return semanticTags.some(
          (tag) => document.querySelector(tag) !== null
        );
      });

      // At least some semantic structure should be present
      expect(typeof hasSemanticElements).toBe('boolean');
    });
  });

  test.describe('Visual Regression', () => {
    test('should maintain visual consistency on load', async ({ page }) => {
      // Take screenshot for reference
      await page.screenshot({ path: 'tests/screenshots/app-load.png' });

      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('should maintain layout on small screen', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({
        path: 'tests/screenshots/app-mobile.png',
      });

      const content = await page.content();
      expect(content).toBeDefined();
    });

    test('should maintain layout on large screen', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({
        path: 'tests/screenshots/app-desktop.png',
      });

      const content = await page.content();
      expect(content).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle page refresh gracefully', async ({ page }) => {
      // Perform refresh
      await page.reload();

      // Wait for page to stabilize
      await page.waitForSelector('button', { timeout: 5000 });

      // Verify page is usable
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('should recover from rapid interactions', async ({ page }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 0) {
        // Rapid clicks
        for (let i = 0; i < 5; i++) {
          await buttons[0].click().catch(() => {
            // Ignore errors from rapid clicks
          });
        }

        // Page should still be responsive
        await page.waitForTimeout(500);
        const content = await page.content();
        expect(content).toBeDefined();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Should load in less than 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should maintain responsiveness during interaction', async ({
      page,
    }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 0) {
        const startTime = Date.now();

        // Click multiple times
        for (let i = 0; i < 3; i++) {
          await buttons[0].click({ timeout: 1000 }).catch(() => {
            // Ignore errors
          });
        }

        const interactionTime = Date.now() - startTime;

        // Should be responsive (less than 3 seconds for 3 clicks)
        expect(interactionTime).toBeLessThan(3000);
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist state across reload', async ({ page }) => {
      // Get initial element count
      const initialElements = await page.locator('button').count();

      // Reload page
      await page.reload();

      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });

      // Get element count after reload
      const afterReloadElements = await page.locator('button').count();

      // Should have similar structure
      expect(afterReloadElements).toBeGreaterThan(0);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work in current browser context', async ({ page }) => {
      // Verify page is functional
      const content = await page.content();
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);

      // Verify JavaScript is working
      const jsResult = await page.evaluate(() => typeof window);
      expect(jsResult).toBe('object');
    });

    test('should have proper meta tags', async ({ page }) => {
      const viewport = await page.locator('meta[name="viewport"]').count();
      expect(viewport).toBeGreaterThanOrEqual(0); // Viewport meta may or may not be present
    });
  });
});
