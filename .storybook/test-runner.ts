import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page, {id}) {
    // force the same viewport Chromatic uses
    await page.setViewportSize({ width: 1200, height: 500 });
    
    // Attach a listener to capture all browser console messages
    page.on('console', async (msg) => {
      const text = msg.text();
      const type = msg.type();
      
      // Ignore React Router warnings as per project rules
      if (text.includes('React Router')) {
        return;
      }
      
      // Only log warnings and errors to keep output clean
      if (type === 'warning' || type === 'error') {
        console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
      }
    });
  },
  // Hook to execute after each story is tested
  async postVisit(page, context) {
    // Cleanup if needed
  },
  
  // Configure tags to skip certain stories if needed
  tags: {
    skip: ['skip-test'],
  },
  
  // Increase timeout for slower stories
  timeout: 20000,
};

export default config; 