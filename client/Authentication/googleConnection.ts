import { getGoogleConfiguration } from '../src/apiController/controller';
import { type GoogleConfiguration } from '../src/constants/cosntant';

// Declare Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

/**
 * Loads Google Identity Services script
 */
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.google?.accounts) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Wait for script to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

/**
 * Initializes Google OAuth flow
 * @param onSuccess Callback function when OAuth succeeds
 * @param onError Callback function when OAuth fails
 */
export const initializeGoogleAuth = async (
  onSuccess: (accessToken: string) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    // Fetch Google configuration from backend
    const configResponse = await getGoogleConfiguration();
    if (!configResponse.success || !configResponse.googleConfiguration) {
      throw new Error('Failed to fetch Google configuration');
    }

    const config: GoogleConfiguration = configResponse.googleConfiguration;

    if (!config.googleClientId) {
      throw new Error('Google Client ID is not configured');
    }

    if (!config.googleApiKey) {
      throw new Error('Google API Key is not configured');
    }

    if (!config.googleDiscoveryDoc) {
      throw new Error('Google Discovery Doc is not configured');
    }

    if (!config.googleScopes) {
      throw new Error('Google Scopes are not configured');
    }
    // Load Google Identity Services script
    await loadGoogleScript();

    // Wait a bit for the script to fully initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if Google Identity Services is available
    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services failed to load');
    }

    // Initialize OAuth client
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: config.googleClientId,
      scope: config.googleScopes,
      callback: (response) => {
        if (response.error) {
          onError(response.error);
          return;
        }
        
        if (response.access_token) {
          onSuccess(response.access_token);
        } else {
          onError('No access token received');
        }
      },
    });

    // Request access token (this will trigger the OAuth flow)
    tokenClient.requestAccessToken();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onError(errorMessage);
  }
};

/**
 * Hook to use Google OAuth
 * Returns a function to trigger the OAuth flow
 */
export const useGoogleAuth = () => {
  const handleGoogleAuth = async (
    onSuccess: (accessToken: string) => void,
    onError: (error: string) => void
  ) => {
    await initializeGoogleAuth(onSuccess, onError);
  };

  return { handleGoogleAuth };
};
