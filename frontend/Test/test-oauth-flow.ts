import axios from 'axios';

interface OAuthURLResponse {
  status: string;
  data: {
    url: string;
  };
}

interface OAuthTokenResponse {
  status: string;
  token: string;
  refreshToken: string;
  data: {
    user: any;
  };
}

class OAuthFlowTester {
  private baseURL: string = 'http://localhost:5000/api/v1';
  private frontendURL: string = 'https://localhost:5173';

  async testGetOAuthURL(provider: string = 'google') {
    console.log('\n🔍 Testing OAuth URL Generation...');
    console.log(`Provider: ${provider}`);
    
    try {
      const response = await axios.get<OAuthURLResponse>(
        `${this.baseURL}/auth/oauth/${provider}/url`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ OAuth URL Response:', response.data);
      
      const authUrl = response.data.data.url;
      console.log('\n📋 Generated Auth URL:', authUrl);
      
      // Parse the URL to check redirect_uri
      const url = new URL(authUrl);
      const redirectUri = url.searchParams.get('redirect_uri');
      console.log('🔗 Redirect URI:', redirectUri);
      
      // Verify redirect URI points to frontend
      if (redirectUri && redirectUri.includes('localhost:5173')) {
        console.log('✅ Redirect URI correctly points to frontend');
      } else {
        console.log('❌ Redirect URI does not point to frontend!');
      }
      
      return authUrl;
    } catch (error: any) {
      console.error('❌ Error getting OAuth URL:', error.response?.data || error.message);
      throw error;
    }
  }

  async testExchangeCode(provider: string = 'google', code: string) {
    console.log('\n🔄 Testing Code Exchange...');
    console.log(`Provider: ${provider}`);
    console.log(`Code: ${code.substring(0, 20)}...`);
    
    try {
      const response = await axios.post<OAuthTokenResponse>(
        `${this.baseURL}/auth/oauth/${provider}`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ Token Exchange Response:', {
        status: response.data.status,
        hasToken: !!response.data.token,
        hasRefreshToken: !!response.data.refreshToken,
        user: response.data.data?.user?.email
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error exchanging code:', error.response?.data || error.message);
      throw error;
    }
  }

  async simulateFrontendFlow() {
    console.log('\n🎯 Simulating Complete Frontend OAuth Flow\n');
    console.log('This test will:');
    console.log('1. Get OAuth URL from backend');
    console.log('2. Show you the URL to open in browser');
    console.log('3. Wait for you to complete auth and get redirected');
    console.log('4. Show how to extract the code from redirect URL');
    console.log('5. Exchange the code for tokens\n');

    try {
      // Step 1: Get OAuth URL
      const authUrl = await this.testGetOAuthURL('google');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Open this URL in your browser:');
      console.log(`   ${authUrl}`);
      console.log('\n2. Complete Google authentication');
      console.log('\n3. You will be redirected to:');
      console.log(`   ${this.frontendURL}/register?code=YOUR_CODE&scope=...`);
      console.log('\n4. The frontend Register component will:');
      console.log('   - Detect the OAuth code in URL');
      console.log('   - Show OAuthCallbackHandler component');
      console.log('   - Post message to parent window (if popup)');
      console.log('   - Exchange code for tokens via API');
      
      console.log('\n💡 Frontend Flow Summary:');
      console.log('- Register.tsx detects OAuth params and renders OAuthCallbackHandler');
      console.log('- OAuthCallbackHandler extracts code and posts message');
      console.log('- useSocialLogin hook receives message and calls authService');
      console.log('- authService exchanges code with backend API');
      console.log('- User is logged in and redirected to dashboard');
      
    } catch (error) {
      console.error('❌ Flow test failed:', error);
    }
  }

  async testFrontendComponents() {
    console.log('\n🧩 Frontend Component Structure:\n');
    
    console.log('1. Register.tsx (src/pages/auth/Register.tsx)');
    console.log('   - Checks URL for OAuth params');
    console.log('   - Renders OAuthCallbackHandler if OAuth callback detected');
    console.log('   - Otherwise shows normal registration form with social buttons');
    
    console.log('\n2. OAuthCallbackHandler.tsx (src/pages/auth/OAuthCallbackHandler.tsx)');
    console.log('   - Extracts OAuth code/error from URL');
    console.log('   - Posts message to parent window (for popup flow)');
    console.log('   - Shows loading spinner');
    
    console.log('\n3. useSocialLogin.ts (src/pages/auth/shared-components/useSocialLogin.ts)');
    console.log('   - Opens OAuth URL in popup window');
    console.log('   - Listens for messages from OAuthCallbackHandler');
    console.log('   - Calls authService to exchange code');
    
    console.log('\n4. auth.service.ts (src/services/auth.service.ts)');
    console.log('   - getOAuthUrl(): Gets OAuth URL from backend');
    console.log('   - authenticateOAuth(): Exchanges code for tokens');
    console.log('   - Handles deduplication to prevent duplicate requests');
  }
}

// Run tests
async function main() {
  const tester = new OAuthFlowTester();
  
  console.log('🚀 OAuth Flow Test Script\n');
  
  // Show component structure
  await tester.testFrontendComponents();
  
  // Simulate the flow
  await tester.simulateFrontendFlow();
  
  console.log('\n\n💻 To test code exchange manually:');
  console.log('const tester = new OAuthFlowTester();');
  console.log('await tester.testExchangeCode("google", "YOUR_AUTH_CODE");');
}

// Check if running directly
if (require.main === module) {
  main().catch(console.error);
}

export { OAuthFlowTester };
