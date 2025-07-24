import axios from 'axios';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class LiveOAuthTester {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.frontendURL = 'https://localhost:5173';
  }

  async testLiveFlow() {
    console.log(chalk.bold.blue('🚀 Live OAuth Flow Test\n'));
    
    try {
      // Step 1: Get OAuth URL
      console.log(chalk.yellow('Step 1: Requesting OAuth URL from backend...'));
      const response = await axios.get(`${this.baseURL}/auth/oauth/google/url`);
      const authUrl = response.data.data.url;
      
      console.log(chalk.green('✅ OAuth URL received!\n'));
      console.log(chalk.white('OAuth URL:'));
      console.log(chalk.cyan(authUrl));
      
      // Verify redirect URI
      const url = new URL(authUrl);
      const redirectUri = url.searchParams.get('redirect_uri');
      console.log(chalk.white('\nRedirect URI:'), chalk.cyan(redirectUri));
      
      if (redirectUri === `${this.frontendURL}/register`) {
        console.log(chalk.green('✅ Redirect URI is correctly set to frontend!\n'));
      }
      
      // Step 2: Instructions for manual testing
      console.log(chalk.yellow('\nStep 2: Manual Testing Instructions\n'));
      console.log(chalk.white('Option A: Test with Frontend UI (Recommended)'));
      console.log(chalk.gray('1. Open your browser to: ' + chalk.cyan(`${this.frontendURL}/register`)));
      console.log(chalk.gray('2. Click the Google button'));
      console.log(chalk.gray('3. Complete authentication'));
      console.log(chalk.gray('4. You should be logged in and redirected to dashboard\n'));
      
      console.log(chalk.white('Option B: Test OAuth URL Directly'));
      console.log(chalk.gray('1. Copy the OAuth URL above'));
      console.log(chalk.gray('2. Open it in your browser'));
      console.log(chalk.gray('3. Complete Google authentication'));
      console.log(chalk.gray('4. You will be redirected to: ' + chalk.cyan(`${this.frontendURL}/register?code=...`)));
      console.log(chalk.gray('5. The frontend will handle the OAuth callback\n'));
      
      // Ask if user wants to test code exchange
      const testExchange = await question(chalk.yellow('\nDo you have an authorization code to test? (y/n): '));
      
      if (testExchange.toLowerCase() === 'y') {
        const code = await question(chalk.yellow('Enter the authorization code: '));
        await this.testCodeExchange(code.trim());
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.response?.data || error.message);
    } finally {
      rl.close();
    }
  }

  async testCodeExchange(code) {
    console.log(chalk.yellow('\nStep 3: Testing Code Exchange...'));
    
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/oauth/google`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log(chalk.green('✅ Code exchange successful!\n'));
      console.log(chalk.white('Response:'));
      console.log(chalk.gray('- Status:', response.data.status));
      console.log(chalk.gray('- Token:', response.data.token ? '✅ Received' : '❌ Missing'));
      console.log(chalk.gray('- Refresh Token:', response.data.refreshToken ? '✅ Received' : '❌ Missing'));
      console.log(chalk.gray('- User Email:', response.data.data?.user?.email || 'N/A'));
      
    } catch (error) {
      console.error(chalk.red('❌ Code exchange failed:'));
      if (error.response?.data?.error === 'duplicate_code') {
        console.log(chalk.yellow('This authorization code has already been used.'));
        console.log(chalk.gray('OAuth codes can only be used once. Please generate a new one.'));
      } else {
        console.log(chalk.red(error.response?.data?.message || error.message));
      }
    }
  }

  showDebugTips() {
    console.log(chalk.blue('\n\n🔍 Debugging Tips\n'));
    
    console.log(chalk.white('Browser Console Messages:'));
    console.log(chalk.gray('Look for these log patterns:'));
    console.log(chalk.gray('- [OAuth v4] - OAuthCallbackHandler messages'));
    console.log(chalk.gray('- [useSocialLogin] - Hook messages'));
    console.log(chalk.gray('- [AuthService] - Service messages\n'));
    
    console.log(chalk.white('Network Tab:'));
    console.log(chalk.gray('Check these API calls:'));
    console.log(chalk.gray('- GET  /api/v1/auth/oauth/google/url'));
    console.log(chalk.gray('- POST /api/v1/auth/oauth/google\n'));
    
    console.log(chalk.white('Common Issues:'));
    console.log(chalk.gray('1. Popup blocked - Allow popups for localhost'));
    console.log(chalk.gray('2. CORS errors - Check backend CORS settings'));
    console.log(chalk.gray('3. Redirect URI mismatch - Verify Google Console settings'));
    console.log(chalk.gray('4. Duplicate code - Each code can only be used once'));
  }
}

// Main execution
async function main() {
  const tester = new LiveOAuthTester();
  await tester.testLiveFlow();
  tester.showDebugTips();
}

main();
