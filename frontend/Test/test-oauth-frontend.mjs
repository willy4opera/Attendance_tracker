import axios from 'axios';
import chalk from 'chalk';

const baseURL = 'http://localhost:5000/api/v1';
const frontendURL = 'https://localhost:5173';

async function testOAuthURL(provider = 'google') {
  console.log(chalk.blue('\n🔍 Testing OAuth URL Generation...'));
  console.log(`Provider: ${provider}`);
  
  try {
    const response = await axios.get(`${baseURL}/auth/oauth/${provider}/url`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(chalk.green('✅ OAuth URL Response received'));
    
    const authUrl = response.data.data.url;
    console.log(chalk.white('\n📋 Generated Auth URL:'));
    console.log(chalk.yellow(authUrl));
    
    // Parse the URL to check redirect_uri
    const url = new URL(authUrl);
    const redirectUri = url.searchParams.get('redirect_uri');
    console.log(chalk.white('\n🔗 Redirect URI:'), chalk.cyan(redirectUri));
    
    // Verify redirect URI points to frontend
    if (redirectUri && redirectUri.includes('localhost:5173')) {
      console.log(chalk.green('✅ Redirect URI correctly points to frontend'));
    } else {
      console.log(chalk.red('❌ Redirect URI does not point to frontend!'));
    }
    
    return authUrl;
  } catch (error) {
    console.error(chalk.red('❌ Error getting OAuth URL:'), error.response?.data || error.message);
    throw error;
  }
}

async function showFrontendFlow() {
  console.log(chalk.blue('\n🎯 Frontend OAuth Flow Overview\n'));
  
  console.log(chalk.white('1. User clicks "Sign in with Google" button'));
  console.log(chalk.gray('   - Calls: useSocialLogin hook → handleSocialLogin("google")'));
  
  console.log(chalk.white('\n2. Frontend requests OAuth URL from backend'));
  console.log(chalk.gray('   - API call: GET /api/v1/auth/oauth/google/url'));
  
  console.log(chalk.white('\n3. Frontend opens OAuth URL in popup window'));
  console.log(chalk.gray('   - Popup shows Google login page'));
  
  console.log(chalk.white('\n4. After Google auth, redirected to:'));
  console.log(chalk.cyan(`   ${frontendURL}/register?code=AUTH_CODE&scope=...`));
  
  console.log(chalk.white('\n5. Register.tsx detects OAuth callback'));
  console.log(chalk.gray('   - Checks URL params for "code" or "error"'));
  console.log(chalk.gray('   - Renders OAuthCallbackHandler component'));
  
  console.log(chalk.white('\n6. OAuthCallbackHandler extracts code'));
  console.log(chalk.gray('   - Posts message to parent window (popup opener)'));
  console.log(chalk.gray('   - Message contains: { type: "oauth-callback", provider, code }'));
  
  console.log(chalk.white('\n7. useSocialLogin receives message'));
  console.log(chalk.gray('   - Calls authService.authenticateOAuth("google", { code })'));
  
  console.log(chalk.white('\n8. Backend exchanges code for tokens'));
  console.log(chalk.gray('   - API call: POST /api/v1/auth/oauth/google'));
  console.log(chalk.gray('   - Body: { code: "AUTH_CODE" }'));
  
  console.log(chalk.white('\n9. Frontend stores tokens and redirects'));
  console.log(chalk.gray('   - Stores tokens in localStorage'));
  console.log(chalk.gray('   - Redirects to dashboard'));
}

async function main() {
  console.log(chalk.bold.blue('🚀 OAuth Frontend Integration Test\n'));
  
  try {
    // Test OAuth URL generation
    const authUrl = await testOAuthURL('google');
    
    // Show the flow
    await showFrontendFlow();
    
    console.log(chalk.yellow('\n\n📋 To Test the Complete Flow:'));
    console.log(chalk.white('1. Make sure frontend is running on https://localhost:5173'));
    console.log(chalk.white('2. Go to https://localhost:5173/register'));
    console.log(chalk.white('3. Click "Sign in with Google"'));
    console.log(chalk.white('4. Complete Google authentication'));
    console.log(chalk.white('5. You should be logged in and redirected to dashboard'));
    
    console.log(chalk.yellow('\n\n🔍 To Debug Issues:'));
    console.log(chalk.white('1. Open browser DevTools Console'));
    console.log(chalk.white('2. Look for messages starting with [OAuth], [useSocialLogin], or [AuthService]'));
    console.log(chalk.white('3. Check Network tab for API calls to /auth/oauth/google'));
    console.log(chalk.white('4. Verify popup window opens and redirects correctly'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
  }
}

main();
