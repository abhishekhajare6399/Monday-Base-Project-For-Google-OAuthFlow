/**
 * Client API Controller
 * Handles API calls to the backend server
 */

import { getMondaySessionToken } from '../mondayServices/getMondaySessionToken';
import { type MondayUser } from '../constants/cosntant';
import { type GoogleConfigurationResponse } from '../constants/cosntant';

// Use proxy in development, or full URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/api';

/**
 * Gets request headers with Monday.com session token
 * @returns Promise with headers object including the session token
 */
const getHeadersWithToken = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const sessionToken = await getMondaySessionToken();
    if (sessionToken) {
      headers['X-Monday-Session-Token'] = sessionToken;
    }
  } catch (error) {
    console.warn('Could not retrieve Monday.com session token:', error);
  }

  return headers;
};

/**
 * Hello World API response interface
 */
export interface HelloWorldResponse {
  success: boolean;
  message: string;
  mondayUser: MondayUser | null;
}

/**
 * Fetches hello world message and Monday user details from the server
 * @returns Promise with the hello world response including Monday user data
*/
export const getHelloWorld = async (): Promise<HelloWorldResponse> => {
  const url = `${API_BASE_URL}${BASE_PATH}/hello-world`;  
  try {
    const headers = await getHeadersWithToken();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: data.success,
        message: data.message || '',
        mondayUser: data.mondayUser || null
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching hello world:', error);
    throw error;
  }
};

/**
 * Fetches Google configuration from the server
 * @returns Promise with the Google configuration response
 */
export const getGoogleConfiguration = async (): Promise<GoogleConfigurationResponse> => {
  const url = `${API_BASE_URL}${BASE_PATH}/google-configuration`;
  try {
    const headers = await getHeadersWithToken();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: data.success,
        googleConfiguration: data.googleConfiguration || null
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching Google configuration:', error);
    throw error;
  }
};

/**
 * Saves Google access token to the server
 * @param accessToken The Google OAuth access token
 * @returns Promise with the save response
 */
export const saveGoogleAccessToken = async (accessToken: string): Promise<{ success: boolean; message?: string }> => {
  const url = `${API_BASE_URL}${BASE_PATH}/save-google-access-token`;
  try {
    const headers = await getHeadersWithToken();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error saving Google access token:', error);
    throw error;
  }
};
