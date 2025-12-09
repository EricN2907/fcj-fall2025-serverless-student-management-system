import { Amplify } from 'aws-amplify';

/**
 * AWS Cognito Configuration
 * ✅ SECURE: Credentials loaded from environment variables
 */

// Validate required environment variables
const requiredEnvVars = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION,
};

// Check if any required variable is missing
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required Cognito environment variables:', missingVars);
  console.error('Please check your .env file and ensure these variables are set:');
  console.error('- VITE_COGNITO_USER_POOL_ID');
  console.error('- VITE_COGNITO_CLIENT_ID');
  console.error('- VITE_COGNITO_REGION');
}

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: requiredEnvVars.userPoolId || '',
      userPoolClientId: requiredEnvVars.clientId || '',
      region: requiredEnvVars.region || 'ap-southeast-1',
      
      // Các cấu hình tuỳ chọn
      signUpVerificationMethod: 'code' as const, // 'code' hoặc 'link'
      loginWith: {
        email: true,
        username: false,
      },
    }
  }
};

// Initialize Amplify
export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
  console.log('Amplify configured successfully');
};
