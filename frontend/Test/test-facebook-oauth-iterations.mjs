import axios from 'axios';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class OAuthIterativeTester {
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
    console.log(chalk.bold.blue('🚀 Facebook OAuth Iterative Test - Multiple Login/Logout Cycles\n'));
    console.log(chalk.gray('This test will help you test multiple Facebook OAuth login cycles'));
    console.log(chalk.gray('Each iteration: Generate URL → Login → Exchange Code → Logout → Repeat\n'));

    while (true) {
      this.iteration++;
      console.log(chalk.blue(`\n${'='.repeat(60)}`));
      console.log(chalk.bold.white(`ITERATION #${this.iteration}`));
      console.log(chalk.blue(`${'='.repeat(60)}\n`));

      try {
        // Step 1: Generate OAuth URL
        console.log(chalk.yellow('📍 Step 1: Generating Facebook OAuth URL...'));
        const authUrl = await this.getOAuthUrl();
        
        // Step 2: Display URL and instructions
        console.log(chalk.green('\n✅ Facebook OAuth URL Generated Successfully!\n'));
        console.log(chalk.bgBlue.white(' COPY THIS URL TO YOUR BROWSER: '));
        console.log(chalk.cyan(authUrl));
        
        console.log(chalk.yellow('\n📋 Instructions:'));
        console.log(chalk.white('1. Copy the URL above and paste it in your browser'));
        console.log(chalk.white('2. Complete Facebook authentication'));
        console.log(chalk.white('3. After redirect, copy the "code" parameter from the URL'));
        console.log(chalk.white('4. The URL will look like:'));
        console.log(chalk.gray(`   ${this.frontendURL}/register?code=`) + chalk.green('AUTH_CODE') + chalk.gray('&state=...'));
        
        // Step 3: Wait for code input
        console.log(chalk.yellow('\n📍 Step 2: Waiting for authorization code...'));
        const code = await question(chalk.cyan('Paste the authorization code here (or "skip" to skip): '));
        
        if (code.toLowerCase() === 'skip') {
          console.log(chalk.gray('Skipping code exchange...'));
        } else {
          // Step 4: Exchange code
          await this.exchangeCode(code.trim());
          
          // Step 5: Test authenticated endpoint
          console.log(chalk.yellow('\n📍 Step 4: Testing authenticated endpoint...'));
          await this.testAuthenticatedEndpoint();
          
          // Step 6: Simulate logout
          console.log(chalk.yellow('\n📍 Step 5: Simulating logout...'));
          await this.simulateLogout();
        }
        
        // Ask to continue
        console.log(chalk.yellow('\n📍 Next Steps:'));
        console.log(chalk.white('Options:'));
        console.log(chalk.gray('  - Press ENTER to start next iteration'));
        console.log(chalk.gray('  - Type "stats" to see statistics'));
        console.log(chalk.gray('  - Type "exit" to quit'));
        
        const action = await question(chalk.cyan('Your choice [ENTER/stats/exit]: '));
        
        if (action.toLowerCase() === 'exit') {
          break;
        } else if (action.toLowerCase() === 'stats') {
          this.showStatistics();
          await question(chalk.gray('Press ENTER to continue...'));
        }
        
      } catch (error) {
        console.error(chalk.red('❌ Error in iteration:'), error.message);
        this.failedLogins++;
        
        const continueTest = await question(chalk.yellow('Continue testing? (y/n): '));
        if (continueTest.toLowerCase() !== 'y') {
          break;
        }
      }
    }
    
    // Show final statistics
    this.showStatistics();
    console.log(chalk.green('\n✅ Test completed!'));
    rl.close();
  }

  async getOAuthUrl() {
    try {
      const response = await axios.get(`${this.baseURL}/auth/oauth/facebook/url`);
      return response.data.data.url;
    } catch (error) {
      throw new Error(`Failed to get Facebook OAuth URL: ${error.message}`);
    }
  }

  async exchangeCode(code) {
    console.log(chalk.yellow('\n📍 Step 3: Exchanging authorization code...'));
    console.log(chalk.gray(`Code: ${code.substring(0, 20)}...`));
    
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/oauth/facebook`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.status === 200) {
        console.log(chalk.green('\n✅ Login successful!'));
        
        // Extract tokens from response
        const { token, refreshToken, data } = response.data;
        
        console.log(chalk.white('\n📊 Response Details:'));
        console.log(chalk.gray(`  - Status: ${response.status}`));
        console.log(chalk.gray(`  - Access Token: ${token ? chalk.green('✅ Received') : chalk.red('❌ Missing')}`));
        if (token) {
          console.log(chalk.gray(`    Length: ${token.length} characters`));
          console.log(chalk.gray(`    Preview: ${token.substring(0, 30)}...`));
        }
        console.log(chalk.gray(`  - Refresh Token: ${refreshToken ? chalk.green('✅ Received') : chalk.red('❌ Missing')}`));
        if (refreshToken) {
          console.log(chalk.gray(`    Length: ${refreshToken.length} characters`));
          console.log(chalk.gray(`    Preview: ${refreshToken.substring(0, 30)}...`));
        }
        
        console.log(chalk.white('\n👤 User Details:'));
        console.log(chalk.gray(`  - Email: ${data?.user?.email || 'N/A'}`));
        console.log(chalk.gray(`  - Name: ${data?.user?.firstName || 'N/A'} ${data?.user?.lastName || ''}`));
        console.log(chalk.gray(`  - ID: ${data?.user?.id || 'N/A'}`));
        console.log(chalk.gray(`  - Role: ${data?.user?.role || 'N/A'}`));
        console.log(chalk.gray(`  - Facebook ID: ${data?.user?.facebookId || 'N/A'}`));
        
        this.successfulLogins++;
        
        // Store tokens
        this.currentToken = token;
        this.refreshToken = refreshToken;
        
        return response.data;
      } else {
        throw new Error(`Status ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Code exchange failed!'));
      
      if (error.response?.data?.error === 'duplicate_code') {
        console.log(chalk.yellow('⚠️  This authorization code has already been used.'));
        console.log(chalk.gray('   OAuth codes are single-use only.'));
      } else if (error.response?.status === 401) {
        console.log(chalk.yellow('⚠️  Authentication failed - invalid code.'));
      } else {
        console.log(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
      }
      
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
      console.log(chalk.gray(`  Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`));
    }
  }

  async simulateLogout() {
    try {
      if (this.currentToken) {
        // Attempt to call logout endpoint
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
      } else {
        console.log(chalk.gray('⚠️  No token to logout'));
      }
    } catch (error) {
      // Logout might fail but we continue anyway
      console.log(chalk.gray('⚠️  Logout request failed (this is okay)'));
      if (error.response) {
        console.log(chalk.gray(`   Status: ${error.response.status}`));
      }
    }
    
    // Clear stored tokens
    this.currentToken = null;
    this.refreshToken = null;
    console.log(chalk.gray('   Tokens cleared from memory'));
  }

  showStatistics() {
    console.log(chalk.blue('\n📊 Test Statistics:'));
    console.log(chalk.white(`Total iterations: ${this.iteration}`));
    console.log(chalk.green(`Successful logins: ${this.successfulLogins}`));
    console.log(chalk.red(`Failed logins: ${this.failedLogins}`));
    console.log(chalk.white(`Success rate: ${this.iteration > 0 ? ((this.successfulLogins / this.iteration) * 100).toFixed(1) : 0}%`));
    
    if (this.currentToken || this.refreshToken) {
      console.log(chalk.magenta('\n🔑 Current tokens in memory:'));
      if (this.currentToken) {
        console.log(chalk.gray(`  - Access Token: ${this.currentToken.substring(0, 30)}...`));
      }
      if (this.refreshToken) {
        console.log(chalk.gray(`  - Refresh Token: ${this.refreshToken.substring(0, 30)}...`));
      }
    }
  }
}

// Main execution
async function main() {
  console.clear();
  const tester = new OAuthIterativeTester();
  
  console.log(chalk.bold.blue('Facebook OAuth Multiple Iteration Test'));
  console.log(chalk.gray('\nThis test will help you:'));
  console.log(chalk.gray('• Test multiple Facebook OAuth login cycles'));
  console.log(chalk.gray('• Verify that each new auth attempt works'));
  console.log(chalk.gray('• Track JWT token generation'));
  console.log(chalk.gray('• Test authenticated endpoints'));
  console.log(chalk.gray('• Simulate real user behavior (login → use app → logout → login again)'));
  
  console.log(chalk.yellow('\n⚠️  Note: Make sure Facebook OAuth is properly configured in your backend'));
  console.log(chalk.gray('   - App ID and App Secret should be set'));
  console.log(chalk.gray('   - Redirect URI should be configured in Facebook App'));
  
  const start = await question(chalk.yellow('\nPress ENTER to start testing...'));
  
  await tester.runIterations();
}

main().catch(console.error);
