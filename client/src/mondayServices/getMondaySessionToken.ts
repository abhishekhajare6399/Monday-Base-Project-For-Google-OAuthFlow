/**
 * Fetches the Monday.com session token for the logged-in user
 * This function uses the Monday.com SDK or global monday object
 * available in the Monday.com app iframe context
 * 
 * @returns Promise<string> - The session token of the logged-in user
 * @throws Error if the token cannot be retrieved
 */


export async function getMondaySessionToken(): Promise<string | null> {
    try {
      // Dynamically import monday SDK to avoid issues if not available
      const mondaySdkModule = await import('monday-sdk-js');
      const mondaySdk = mondaySdkModule.default || mondaySdkModule;
      const monday = mondaySdk();
      const tokenResult = await monday.get('sessionToken');
      const token = (tokenResult && typeof tokenResult === 'object' && 'data' in tokenResult) 
        ? tokenResult.data 
        : (typeof tokenResult === 'string' ? tokenResult : null);
      return token || null;
    } catch (error) {
      return null;
    }
  }