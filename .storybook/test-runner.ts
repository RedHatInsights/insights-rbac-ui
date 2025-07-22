import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page, {id}) {
    // force the same viewport Chromatic uses
    await page.setViewportSize({ width: 1200, height: 500 });
  },
  // Hook to execute after each story is tested
  async postVisit(page, context) {
    // Add any custom assertions or checks here
    // For example, check for console errors
    const logs = await page.evaluate(() => {
      return window.console.errors || [];
    });
    
    if (logs.length > 0) {
      console.warn(`Console errors in story ${context.title}/${context.name}:`, logs);
    }
  },
  
  // Configure tags to skip certain stories if needed
  tags: {
    skip: ['skip-test'],
  },
  
  // Increase timeout for slower stories
  timeout: 20000,
};

export default config; 