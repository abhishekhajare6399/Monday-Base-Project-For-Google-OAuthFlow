/**
 * Monday.com user details interface
 */
export interface MondayUser {
    id: string;
    name: string;
    email: string;
    photo_thumb: string;
    is_admin: boolean;
  }

/**
 * Google Configuration interface
 */
export interface GoogleConfiguration {
  googleApiKey: string | undefined;
  googleClientId: string | undefined;
  googleDiscoveryDoc: string | undefined;
  googleScopes: string | undefined;
}

/**
 * Google Configuration API response interface
 */
export interface GoogleConfigurationResponse {
  success: boolean;
  googleConfiguration: GoogleConfiguration | null;
}
