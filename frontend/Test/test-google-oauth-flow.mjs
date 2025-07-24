import axios from 'axios';
import chalk from 'chalk';
import { EventEmitter } from 'events';

class OAuthFlowSimulator extends EventEmitter {
  constructor() {
    super();
    this.baseURL = 'http://localhost:5000/api/v1';
    this.frontendURL = 'https://localhost:5173';
    this.authWindow = null;
    this.messageHandler = null;
  }

  // Simulate clicking the Google button
  async simulateGoogleButtonClick() {
    console.log(chalk.blue('\n🖱️  Simulating Google Button Click\n'));
    
    // 1. Button click triggers onSocialLogin('Google')
    console.log(chalk.yellow('1. User clicks Google button'));
    console.log(chalk.gray('   → SocialLoginButtons.handleClick("Google")'));
    console.log(chalk.gray('   → Calls onSocialLogin("Google")'));
    
    // 2. This calls useSocialLogin hook's handleSocialLogin
    console.log(chalk.yellow('\n2. useSocialLogin.handleSocialLogin("google") is called'));
    await this.simulateHandleSocialLogin('google');
  }

  // Simulate the handleSocialLogin function from useSocialLogin hook
  async simulateHandleSocialLogin(provider) {
    console.log(chalk.gray('   → Clear any expired OAuth codes'));
    console.log(chalk.gray('   → Set loading state'));
    console.log(chalk.gray('   → Show SweetAlert modal'));
    
    // Simulate SweetAlert modal
    console.log(chalk.cyan('\n   📦 SweetAlert Modal:'));
    console.log(chalk.gray('   Title: "Connecting to google for Sign In..."'));
    console.log(chalk.gray('   Shows spinner and loading message'));
    
    // 3. Request OAuth URL from backend
    console.log(chalk.yellow('\n3. Request OAuth URL from backend'));
    const authUrl = await this.getOAuthUrl(provider);
    
    // 4. Open popup window
    console.log(chalk.yellow('\n4. Open OAuth URL in popup window'));
    this.simulatePopupWindow(authUrl);
    
    // 5. Set up message listener
    console.log(chalk.yellow('\n5. Set up message listener for OAuth callback'));
    this.setupMessageListener();
  }

  // Get OAuth URL from backend
  async getOAuthUrl(provider) {
    console.log(chalk.gray(`   → GET ${this.baseURL}/auth/oauth/${provider}/url`));
    
    try {
      const response = await axios.get(`${this.baseURL}/auth/oauth/${provider}/url`);
      const authUrl = response.data.data.url;
      
      console.log(chalk.green('   ✅ OAuth URL received:'));
      console.log(chalk.gray(`   ${authUrl.substring(0, 100)}...`));
      
      return authUrl;
    } catch (error) {
      console.error(chalk.red('   ❌ Error getting OAuth URL:'), error.message);
      throw error;
    }
  }

  // Simulate opening popup window
  simulatePopupWindow(authUrl) {
    const width = 600;
    const height = 700;
    const left = 100;
    const top = 100;
    
    console.log(chalk.gray(`   → window.open(url, "Google Login", "width=${width},height=${height}...")`));
    console.log(chalk.cyan('\n   🪟 Popup Window:'));
    console.log(chalk.gray(`   - Size: ${width}x${height}`));
    console.log(chalk.gray(`   - Position: left=${left}, top=${top}`));
    console.log(chalk.gray(`   - URL: ${authUrl.substring(0, 80)}...`));
    
    // Store popup reference
    this.authWindow = { closed: false, _timeout: null };
    
    // Set timeout
    console.log(chalk.gray('\n   ⏱️  Set 5-minute timeout for authentication'));
  }

  // Set up message listener
  setupMessageListener() {
    console.log(chalk.gray('   → window.addEventListener("message", handleMessage)'));
    console.log(chalk.gray('   → Waiting for OAuth callback message...'));
    
    // Simulate receiving message after user completes OAuth
    setTimeout(() => this.simulateOAuthCallback(), 2000);
  }

  // Simulate OAuth callback
  async simulateOAuthCallback() {
    console.log(chalk.blue('\n\n🔄 Simulating OAuth Callback\n'));
    
    // 6. User completes Google authentication
    console.log(chalk.yellow('6. User completes Google authentication'));
    console.log(chalk.gray('   → Google redirects to: ' + chalk.cyan(`${this.frontendURL}/register?code=4/0AY0e-g7...&scope=...`)));
    
    // 7. Register component detects OAuth callback
    console.log(chalk.yellow('\n7. Register.tsx detects OAuth callback'));
    console.log(chalk.gray('   → Checks URL params: hasOAuthCode = true'));
    console.log(chalk.gray('   → window.opener exists (popup context)'));
    console.log(chalk.gray('   → Renders <OAuthCallbackHandler />'));
    
    // 8. OAuthCallbackHandler processes the callback
    console.log(chalk.yellow('\n8. OAuthCallbackHandler extracts code'));
    const mockCode = '4/0AY0e-g7MockAuthCode123';
    console.log(chalk.gray(`   → Extract code from URL: ${mockCode.substring(0, 20)}...`));
    console.log(chalk.gray('   → Check if code already processed (deduplication)'));
    console.log(chalk.gray('   → Post message to parent window:'));
    
    const message = {
      type: 'oauth-callback',
      provider: 'google',
      code: mockCode,
      error: null
    };
    console.log(chalk.cyan('   ' + JSON.stringify(message, null, 2)));
    
    // 9. Parent window receives message
    console.log(chalk.yellow('\n9. useSocialLogin receives message'));
    console.log(chalk.gray('   → Verify message origin'));
    console.log(chalk.gray('   → Extract provider and code from message'));
    console.log(chalk.gray('   → Check if code already processed'));
    
    // 10. Exchange code for tokens
    console.log(chalk.yellow('\n10. Exchange authorization code for tokens'));
    await this.simulateTokenExchange('google', mockCode);
    
    // 11. Close popup and complete flow
    console.log(chalk.yellow('\n11. Complete OAuth flow'));
    console.log(chalk.gray('   → Close popup window'));
    console.log(chalk.gray('   → Close SweetAlert modal'));
    console.log(chalk.gray('   → Show success toast'));
    console.log(chalk.gray('   → Navigate to dashboard'));
  }

  // Simulate token exchange
  async simulateTokenExchange(provider, code) {
    console.log(chalk.gray(`   → authService.authenticateOAuth("${provider}", { code })`));
    console.log(chalk.gray(`   → POST ${this.baseURL}/auth/oauth/${provider}`));
    console.log(chalk.gray(`   → Body: { code: "${code.substring(0, 20)}..." }`));
    
    try {
      // Simulate API call (don't actually call with fake code)
      console.log(chalk.cyan('\n   📡 Backend Processing:'));
      console.log(chalk.gray('   1. Receive code from frontend'));
      console.log(chalk.gray('   2. Exchange code with Google OAuth2 API'));
      console.log(chalk.gray('   3. Get user info from Google'));
      console.log(chalk.gray('   4. Create/update user in database'));
      console.log(chalk.gray('   5. Generate JWT tokens'));
      console.log(chalk.gray('   6. Return tokens and user data'));
      
      // Simulate response
      const mockResponse = {
        status: 'success',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_token_here',
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };
      
      console.log(chalk.green('\n   ✅ Token exchange successful'));
      console.log(chalk.gray('   → Store tokens in localStorage'));
      console.log(chalk.gray('   → setTokens(token, refreshToken)'));
      console.log(chalk.gray('   → Refresh user data'));
      
      return mockResponse;
    } catch (error) {
      console.error(chalk.red('   ❌ Token exchange failed:'), error.message);
      throw error;
    }
  }

  // Show complete flow summary
  showFlowSummary() {
    console.log(chalk.blue('\n\n📊 Complete OAuth Flow Summary\n'));
    
    const steps = [
      'User clicks Google button in SocialLoginButtons',
      'useSocialLogin hook handles the click',
      'Frontend requests OAuth URL from backend API',
      'Frontend opens Google OAuth URL in popup window',
      'User authenticates with Google',
      'Google redirects to frontend /register with code',
      'Register.tsx renders OAuthCallbackHandler',
      'OAuthCallbackHandler posts message to parent',
      'useSocialLogin receives message and exchanges code',
      'Backend validates code with Google and returns tokens',
      'Frontend stores tokens and redirects to dashboard'
    ];
    
    steps.forEach((step, index) => {
      console.log(chalk.white(`${index + 1}. ${step}`));
    });
    
    console.log(chalk.yellow('\n\n🔍 Key Components Involved:'));
    console.log(chalk.white('• Frontend:'));
    console.log(chalk.gray('  - SocialLoginButtons.tsx - UI buttons'));
    console.log(chalk.gray('  - useSocialLogin.ts - OAuth flow logic'));
    console.log(chalk.gray('  - Register.tsx - Handles OAuth redirect'));
    console.log(chalk.gray('  - OAuthCallbackHandler.tsx - Extracts code'));
    console.log(chalk.gray('  - auth.service.ts - API calls'));
    
    console.log(chalk.white('\n• Backend:'));
    console.log(chalk.gray('  - /auth/oauth/:provider/url - Generate OAuth URL'));
    console.log(chalk.gray('  - /auth/oauth/:provider - Exchange code for tokens'));
  }
}

// Main execution
async function main() {
  console.log(chalk.bold.blue('🚀 Google OAuth Flow Simulation\n'));
  
  const simulator = new OAuthFlowSimulator();
  
  try {
    await simulator.simulateGoogleButtonClick();
    simulator.showFlowSummary();
    
    console.log(chalk.green('\n\n✅ Simulation Complete!\n'));
    console.log(chalk.yellow('To test the actual flow:'));
    console.log(chalk.white('1. Start frontend: cd /var/www/html/Attendance_tracker/frontend && npm run dev'));
    console.log(chalk.white('2. Open browser: https://localhost:5173/register'));
    console.log(chalk.white('3. Click the Google button'));
    console.log(chalk.white('4. Complete authentication'));
    console.log(chalk.white('5. Check browser console for debug messages'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Simulation failed:'), error.message);
  }
}

main();
