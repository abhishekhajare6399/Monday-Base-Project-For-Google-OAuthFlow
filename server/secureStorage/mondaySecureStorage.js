const { SecureStorage } = require('@mondaycom/apps-sdk');
const { Logger } = require('../Logger/logger');
const fetchMondayUserDetails = require('../services/fetchMondayUserDetails');

// Get Monday API token from environment
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

// Key for storing Google access token
const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';

/**
 * Server-side wrapper for monday.com SecureStorage
 * Provides secure storage operations scoped by accountId
 */
class MondaySecureStorage {
    constructor() {
        // Initialize SecureStorage with API token
        this.secureStorage = new SecureStorage(MONDAY_API_TOKEN);
    }

    /**
     * Generate a deterministic storage key that includes accountId
     * Pattern: google_oauth_<accountId>::<key>
     * 
     * @param {string|number} accountId - The monday.com account ID (from verified sessionToken)
     * @param {string} key - The storage key
     * @returns {string} Composite storage key
     */
    _getStorageKey(accountId, key) {
        if (!accountId) {
            throw new Error('accountId is required for secure storage operations');
        }
        return `google_oauth_${accountId}::${key}`;
    }
    
    /**
     * Helper to recursively extract string from nested object
     * @private
     */
    _extractStringFromObject(obj, key) {
        if (typeof obj === 'string') {
            return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const prop in obj) {
                if (typeof obj[prop] === 'string' && obj[prop].length > 0) {
                    return obj[prop];
                }
            }
        }
        return null;
    }

    /**
     * Store a value in secure storage
     * 
     * @param {string|number} accountId - The monday.com account ID
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON stringified)
     * @returns {Promise<void>}
     */
    async set(accountId, key, value) {
        try {
            const storageKey = this._getStorageKey(accountId, key);
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await this.secureStorage.set(storageKey, stringValue);
        } catch (error) {
            console.error(`[SecureStorage] Failed to set key ${key} for accountId ${accountId}`);
            throw new Error(`Failed to store secure data: ${error.message}`);
        }
    }

    /**
     * Retrieve a value from secure storage
     * 
     * @param {string|number} accountId - The monday.com account ID
     * @param {string} key - Storage key
     * @returns {Promise<string|null>} Stored value or null if not found
     */
    async get(accountId, key) {
        try {
            const storageKey = this._getStorageKey(accountId, key);
            const value = await this.secureStorage.get(storageKey);
            
            // Ensure we return a string or null
            if (!value) {
                return null;
            }
            
            // Handle different return types from SecureStorage
            if (typeof value === 'string') {
                // Already a string, return as-is
                return value;
            } else if (typeof value === 'object' && value !== null) {
                // SecureStorage might return an object - check common patterns
                
                // Pattern 1: { value: "..." }
                if (value.value !== undefined) {
                    const extracted = value.value;
                    if (typeof extracted === 'string' && extracted.length > 0) {
                        return extracted;
                    }
                }
                
                // Pattern 2: { data: "..." }
                if (value.data !== undefined) {
                    const extracted = value.data;
                    if (typeof extracted === 'string' && extracted.length > 0) {
                        return extracted;
                    }
                }
                
                // Pattern 3: Check all properties for string values
                for (const prop in value) {
                    if (value.hasOwnProperty(prop) && typeof value[prop] === 'string' && value[prop].length > 10) {
                        return value[prop];
                    }
                }
                
                // Pattern 4: If object has only one property and it's a string
                const keys = Object.keys(value);
                if (keys.length === 1 && typeof value[keys[0]] === 'string') {
                    return value[keys[0]];
                }
                
                // Pattern 5: Try JSON stringify/parse to see if it's a wrapped string
                try {
                    const stringified = JSON.stringify(value);
                    // If stringified looks like a wrapped string ("..."), extract it
                    if (stringified.startsWith('"') && stringified.endsWith('"') && stringified.length > 2) {
                        const parsed = JSON.parse(stringified);
                        if (typeof parsed === 'string') {
                            return parsed;
                        }
                    }
                    return null; // Return null instead of "[object Object]"
                } catch (e) {
                    return null;
                }
            } else {
                // Other types (number, boolean, boolean, etc.) - convert to string
                return String(value);
            }
        } catch (error) {
            // If key doesn't exist, return null (not an error)
            if (error.message && (
                error.message.includes('not found') || 
                error.message.includes('does not exist') ||
                error.message.includes('404')
            )) {
                return null;
            }
            console.error(`[SecureStorage] Failed to get key ${key} for accountId ${accountId}`);
            throw new Error(`Failed to retrieve secure data: ${error.message}`);
        }
    }

    /**
     * Delete a value from secure storage
     * 
     * @param {string|number} accountId - The monday.com account ID
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async delete(accountId, key) {
        try {
            const storageKey = this._getStorageKey(accountId, key);
            await this.secureStorage.delete(storageKey);
        } catch (error) {
            // If key doesn't exist, that's fine (idempotent operation)
            if (error.message && error.message.includes('not found')) {
                return;
            }
            console.error(`[SecureStorage] Failed to delete key ${key} for accountId ${accountId}`);
            throw new Error(`Failed to delete secure data: ${error.message}`);
        }
    }

    /**
     * Delete all Google OAuth keys for an accountId
     * Used during uninstall cleanup
     * 
     * @param {string|number} accountId - The monday.com account ID
     * @returns {Promise<void>}
     */
    async deleteAllForAccount(accountId) {
        try {
            // Delete known Google OAuth keys
            const keys = [GOOGLE_ACCESS_TOKEN_KEY, 'google_refresh_token', 'google_user'];
            await Promise.all(
                keys.map(key => this.delete(accountId, key).catch(() => {
                    // Ignore individual key deletion failures
                }))
            );
        } catch (error) {
            console.error(`[SecureStorage] Failed to delete all keys for accountId ${accountId}`);
            throw new Error(`Failed to cleanup secure storage: ${error.message}`);
        }
    }
}

// Create singleton instance
const mondaySecureStorage = new MondaySecureStorage();

/**
 * Stores Google access token in Monday.com SecureStorage
 * @param {Object} req - Express request object
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function storeGoogleAccessToken(req, accessToken) {
  try {
    // Get Monday user details to get user ID
    const userDetails = await fetchMondayUserDetails(req);
    
    if (!userDetails || !userDetails.id) {
      Logger.error(req, 'Failed to get Monday user details for storing Google access token');
      return false;
    }

    const userId = userDetails.id;
    
    // Get accountId from session token - SecureStorage uses accountId, not userId
    const accountId = req.mondayUser?.account_id || req.mondayUser?.accountId;
    
    if (!accountId) {
      Logger.error(req, 'Failed to get accountId from session token for storing Google access token');
      return false;
    }

    // Prepare the data to store
    const tokenData = {
      accessToken: accessToken,
      userId: userId,
      accountId: accountId,
      storedAt: new Date().toISOString(),
      userEmail: userDetails.email || null
    };
    
    Logger.info(req, `Storing token for accountId: ${accountId}, userId: ${userId}, Key: ${GOOGLE_ACCESS_TOKEN_KEY}`);
    Logger.info(req, `TokenData to store: ${JSON.stringify(tokenData)}`);
    
    // Store the token using the class method
    await mondaySecureStorage.set(accountId.toString(), GOOGLE_ACCESS_TOKEN_KEY, tokenData);
    
    Logger.info(req, `Google access token stored successfully for accountId ${accountId}, userId ${userId} (${userDetails.email || 'unknown email'})`);
    return true;
  } catch (error) {
    Logger.error(req, `Error storing Google access token in SecureStorage: ${error.message}`);
    Logger.error(req, `Error stack: ${error.stack}`);
    return false;
  }
}

/**
 * Retrieves Google access token from Monday.com SecureStorage
 * @param {Object} req - Express request object
 * @returns {Promise<string|null>} - Returns the access token or null if not found
 */
async function getGoogleAccessToken(req) {
  try {
    // Get Monday user details to get user ID
    const userDetails = await fetchMondayUserDetails(req);
    Logger.info(req, `User details: ${JSON.stringify(userDetails)}`);
    
    if (!userDetails || !userDetails.id) {
      Logger.error(req, 'Failed to get Monday user details for retrieving Google access token');
      return null;
    }

    const userId = userDetails.id;
    
    // Get accountId from session token - SecureStorage uses accountId, not userId
    const accountId = req.mondayUser?.account_id || req.mondayUser?.accountId;
    
    if (!accountId) {
      Logger.error(req, 'Failed to get accountId from session token for retrieving Google access token');
      return null;
    }
    
    Logger.info(req, `Attempting to retrieve token for Account ID: ${accountId}, User ID: ${userId}, Key: ${GOOGLE_ACCESS_TOKEN_KEY}`);
    
    // Retrieve using the class method
    const tokenDataString = await mondaySecureStorage.get(accountId.toString(), GOOGLE_ACCESS_TOKEN_KEY);
    
    Logger.info(req, `Raw tokenData from SecureStorage: ${JSON.stringify(tokenDataString)}`);
    Logger.info(req, `TokenData type: ${typeof tokenDataString}`);
    
    if (!tokenDataString) {
      Logger.info(req, `No Google access token found for accountId ${accountId}`);
      return null;
    }

    // Parse the JSON string
    try {
      const tokenData = JSON.parse(tokenDataString);
      
      if (tokenData && tokenData.accessToken) {
        Logger.info(req, `Google access token retrieved successfully for accountId ${accountId}, userId ${userId}`);
        return tokenData.accessToken;
      }
      
      Logger.info(req, `TokenData found but missing accessToken property. Structure: ${JSON.stringify(tokenData)}`);
      return null;
    } catch (parseError) {
      Logger.error(req, `Failed to parse tokenData as JSON: ${parseError.message}`);
      // If it's not JSON, it might be the token itself
      if (tokenDataString.length > 50) {
        Logger.info(req, `TokenData appears to be the access token directly`);
        return tokenDataString;
      }
      return null;
    }
  } catch (error) {
    Logger.error(req, `Error retrieving Google access token from SecureStorage: ${error.message}`);
    Logger.error(req, `Error stack: ${error.stack}`);
    return null;
  }
}

/**
 * Deletes Google access token from Monday.com SecureStorage
 * @param {Object} req - Express request object
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function deleteGoogleAccessToken(req) {
  try {
    // Get Monday user details to get user ID
    const userDetails = await fetchMondayUserDetails(req);
    
    if (!userDetails || !userDetails.id) {
      Logger.error(req, 'Failed to get Monday user details for deleting Google access token');
      return false;
    }

    const userId = userDetails.id;
    
    // Get accountId from session token - SecureStorage uses accountId, not userId
    const accountId = req.mondayUser?.account_id || req.mondayUser?.accountId;
    
    if (!accountId) {
      Logger.error(req, 'Failed to get accountId from session token for deleting Google access token');
      return false;
    }
    
    // Delete using the class method
    await mondaySecureStorage.delete(accountId.toString(), GOOGLE_ACCESS_TOKEN_KEY);
    
    Logger.info(req, `Google access token deleted successfully for accountId ${accountId}, userId ${userId}`);
    return true;
  } catch (error) {
    Logger.error(req, `Error deleting Google access token from SecureStorage: ${error.message}`);
    return false;
  }
}

// Export both the class instance and the original functions for backward compatibility
module.exports = {
  storeGoogleAccessToken,
  getGoogleAccessToken,
  deleteGoogleAccessToken,
  // Also export the class instance for advanced usage
  mondaySecureStorage
};

