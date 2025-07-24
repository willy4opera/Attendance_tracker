import axios from 'axios';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class LinkedInOAuthIterativeTester {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.frontendURL = 'https://localhost:5173';
    this.iteration = 0;
    this.successfulLogins = 0;
    this.failedLogins = 0;
    this.currentToken = null;
    this.refreshToken = null;
  }

  async runIterations() {
    console.log(chalk.bold.blue('🚀 LinkedIn OAuth Iterative Test - Multiple Login/Logout Cycles\n'));
    console.log(chalk.gray('This test will help you test multiple LinkedIn OAuth login cycles'));
    console.log(chalk.gray('Each iteration: Generate URL → Login → Exchange Code → Logout → Repeat\n'));

    while (true) {
      this.iteration++;
      console.log(chalk.blue(`\n${'='.repeat(60)}`));
      console.log(chalk.bold.white(`ITERATION #${this.iteration}`));
      console.log(chalk.blue(`${'='.repeat(60)}\n`));

      try {
        // Step 1: Generate OAuth URL
        console.log(chalk.yellow('📍 Step 1: Generating LinkedIn OAuth URL...'));
        const authUrl = await this.getOAuthUrl();
        
        // Step 2: Display URL and instructions
        console.log(chalk.green('\n✅ LinkedIn OAuth URL Generated Successfully!\n'));
        console.log(chalk.bgBlue.white(' COPY THIS URL TO YOUR BROWSER: '));
        console.log(chalk.cyan(authUrl));
        
        console.log(chalk.yellow('\n📋 Instructions:'));
        console.log(chalk.white('1. Copy the URL above and paste it in your browser'));
        console.log(chalk.white('2. Complete LinkedIn authentication'));
        console.log(chalk.white('3. After redirect, copy the "code" parameter from the URL'));
        console.log(chalk.white('4. The URL will look like:'));
        console.log(chalk.gray(`   ${this.frontendURL}/register?code=`) + chalk.green('AUTH_CODE') + chalk.gray('&state=...'));
        
        // Step 3: Wait for authorization code
        console.log(chalk.yellow('\n📍 Step 2: Waiting for authorization code...'));
        console.log(chalk.gray('   You can paste the full URL or just the code parameter'));
        const input = await question(chalk.cyan('Paste the authorization code or full URL here (or "skip" to skip): '));
        
        if (input.toLowerCase() === 'skip') {
          console.log(chalk.gray('⏭️  Skipping this iteration...'));
          continue;
        }

        // Extract code from input - handle both full URL and just the code
        let code = input.trim();
        let state = null;
        
        if (input.includes('?code=') || input.includes('&code=')) {
          // Parse as URL
          const urlMatch = input.match(/code=([^&]+)/);
          const stateMatch = input.match(/state=([^&]+)/);
          
          if (urlMatch) {
            code = urlMatch[1];
          }
          if (stateMatch) {
            state = stateMatch[1];
          }
        } else {
          // Assume it's just the code, clean any trailing characters
          code = code.replace(/[&\n\r\s]+$/, '');
        }

        // Step 4: Exchange code for tokens
        console.log(chalk.yellow('\n📍 Step 3: Exchanging authorization code...'));
        console.log(chalk.gray(`Code: ${code.substring(0, 20)}...`));
        
        await this.exchangeCodeForToken(code, state);
        
        // Step 5: Test authenticated endpoint
        console.log(chalk.yellow('\n📍 Step 4: Testing authenticated endpoint...'));
        await this.testAuthenticatedEndpoint();
        
        // Step 6: Simulate logout
        console.log(chalk.yellow('\n📍 Step 5: Simulating logout...'));
        await this.logout();
        
      } catch (error) {
        console.log(chalk.red('\n❌ Error during iteration:'));
        console.log(chalk.red(error.message));
        if (error.response) {
          console.log(chalk.red(`Status: ${error.response.status}`));
          console.log(chalk.red(`Data: ${JSON.stringify(error.response.data)}`));
        }
        this.failedLogins++;
      }

      // Ask for next action
      console.log(chalk.yellow('\n📍 Next Steps:'));
      console.log(chalk.gray('Options:'));
      console.log(chalk.gray('  - Press ENTER to start next iteration'));
      console.log(chalk.gray('  - Type "stats" to see statistics'));
      console.log(chalk.gray('  - Type "exit" to quit'));
      
      const nextAction = await question(chalk.cyan('Your choice [ENTER/stats/exit]: '));
      
      if (nextAction.toLowerCase() === 'exit') {
        break;
      } else if (nextAction.toLowerCase() === 'stats') {
        this.showStats();
      }
    }

    console.log(chalk.green('\n✅ Test session completed!'));
    this.showStats();
    rl.close();
  }

  async getOAuthUrl() {
    const state = Math.random().toString(36).substring(7);
    
    try {
      const response = await axios.get(`${this.baseURL}/auth/oauth/linkedin/url`, {
        params: { state }
      });
      
      return response.data.data.url;
    } catch (error) {
      throw new Error(`Failed to get LinkedIn OAuth URL: ${error.message}`);
    }
  }

  async exchangeCodeForToken(code, state) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/oauth/linkedin`, {
        code,
        state: state || 'test-state' // Use provided state or fallback
      });

      if (response.data.token) {
        this.currentToken = response.data.token;
        this.refreshToken = response.data.refreshToken;
        this.successfulLogins++;
        
        console.log(chalk.green('\n✅ Login successful!\n'));
        console.log(chalk.gray('📊 Response Details:'));
        console.log(chalk.gray(`  - Status: ${response.status}`));
        console.log(chalk.gray(`  - Access Token: ${this.currentToken ? '✅ Received' : '❌ Not received'}`));
        if (this.currentToken) {
          console.log(chalk.gray(`    Length: ${this.currentToken.length} characters`));
          console.log(chalk.gray(`    Preview: ${this.currentToken.substring(0, 30)}...`));
        }
        console.log(chalk.gray(`  - Refresh Token: ${this.refreshToken ? '✅ Received' : '❌ Not received'}`));
        if (this.refreshToken) {
          console.log(chalk.gray(`    Length: ${this.refreshToken.length} characters`));
          console.log(chalk.gray(`    Preview: ${this.refreshToken.substring(0, 30)}...`));
        }
        
        if (response.data.data && response.data.data.user) {
          const user = response.data.data.user;
          console.log(chalk.gray('\n👤 User Details:'));
          console.log(chalk.gray(`  - Email: ${user.email || 'N/A'}`));
          console.log(chalk.gray(`  - Name: ${user.firstName || ''} ${user.lastName || ''}`));
          console.log(chalk.gray(`  - ID: ${user.id || 'N/A'}`));
          console.log(chalk.gray(`  - Role: ${user.role || 'N/A'}`));
          console.log(chalk.gray(`  - LinkedIn ID: ${user.linkedinId || 'N/A'}`));
        }
      } else {
        throw new Error('No token received in response');
      }
    } catch (error) {
      this.failedLogins++;
      throw error;
    }
  }

  async testAuthenticatedEndpoint() {
    if (!this.currentToken) {
      console.log(chalk.gray('⚠️  No token available to test authenticated endpoint'));
      return;
    }

    try {
      console.log(chalk.gray('\n  Testing /api/v1/users/me endpoint...'));
      
      const response = await axios.get(
        `${this.baseURL}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${this.currentToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log(chalk.green('  ✅ Authenticated endpoint test successful'));
      console.log(chalk.gray(`  Response: ${JSON.stringify(response.data).substring(0, 100)}...`));
      
    } catch (error) {
      console.log(chalk.red('  ❌ Authenticated endpoint test failed'));
      console.log(chalk.red(`  Error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`));
    }
  }

  async logout() {
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/logout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.currentToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log(chalk.green('✅ Logout successful'));
      console.log(chalk.gray(`   Response status: ${response.status}`));
      
      // Clear tokens
      this.currentToken = null;
      this.refreshToken = null;
      console.log(chalk.gray('   Tokens cleared from memory'));
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Logout request failed, but continuing...'));
      console.log(chalk.gray(`   Error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`));
      
      // Clear tokens anyway
      this.currentToken = null;
      this.refreshToken = null;
    }
  }

  showStats() {
    console.log(chalk.blue('\n📊 Test Statistics:'));
    console.log(chalk.gray(`  - Total iterations: ${this.iteration}`));
    console.log(chalk.green(`  - Successful logins: ${this.successfulLogins}`));
    console.log(chalk.red(`  - Failed logins: ${this.failedLogins}`));
    console.log(chalk.gray(`  - Success rate: ${this.iteration > 0 ? ((this.successfulLogins / this.iteration) * 100).toFixed(1) : 0}%`));
  }
}

// Show intro
console.log(chalk.bold.cyan('LinkedIn OAuth Multiple Iteration Test\n'));
console.log(chalk.white('This test will help you:'));
console.log(chalk.gray('• Test multiple LinkedIn OAuth login cycles'));
console.log(chalk.gray('• Verify that each new auth attempt works'));
console.log(chalk.gray('• Track JWT token generation'));
console.log(chalk.gray('• Test authenticated endpoints'));
console.log(chalk.gray('• Simulate real user behavior (login → use app → logout → login again)'));
console.log(chalk.yellow('\n⚠️  Note: Make sure LinkedIn OAuth is properly configured in your backend'));
console.log(chalk.gray('   - Client ID and Client Secret should be set'));
console.log(chalk.gray('   - Redirect URI should be configured in LinkedIn App'));

// Start the test
async function main() {
  await question(chalk.cyan('\nPress ENTER to start testing...'));
  const tester = new LinkedInOAuthIterativeTester();
  await tester.runIterations();
  process.exit(0);
}

main().catch(console.error);
