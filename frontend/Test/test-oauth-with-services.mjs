import axios from 'axios';
import chalk from 'chalk';
import { authService } from './src/services/auth.service.ts';

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock window for Node.js environment
global.window = {
  location: {
    origin: 'https://localhost:5173'
  }
};

async function testOAuthWithServices() {
  console.log(chalk.bold.blue('🚀 Testing OAuth with Frontend Services\n'));
  
  try {
    // Step 1: Get OAuth URL using auth service
    console.log(chalk.yellow('Step 1: Getting OAuth URL via authService...'));
    const { url } = await authService.getOAuthUrl('google');
    
    console.log(chalk.green('✅ OAuth URL received:'));
    console.log(chalk.cyan(url));
    
    // Step 2: Show manual instructions
    console.log(chalk.yellow('\nStep 2: Manual steps:'));
    console.log('1. Open the URL in your browser');
    console.log('2. Complete authentication');
    console.log('3. Copy the authorization code from the redirect URL');
    
    // Step 3: Test code exchange using auth service
    console.log(chalk.yellow('\nStep 3: Testing code exchange...'));
    console.log(chalk.gray('(This would normally happen via React components)'));
    
    // Simulate what would happen in the browser
    const mockCode = '4/0AVMBsJj...'; // You would paste real code here
    
    try {
      console.log(chalk.gray('\nCalling authService.authenticateOAuth("google", { code })'));
      // Uncomment to test with real code:
      // const result = await authService.authenticateOAuth('google', { code: mockCode });
      // console.log(chalk.green('✅ Authentication successful!'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
  }
}

testOAuthWithServices();
