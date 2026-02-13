const { SecureStorage } = require('@mondaycom/apps-sdk');
const { Logger } = require('../Logger/logger');
const fetchMondayUserDetails = require('../services/fetchMondayUserDetails');

// Get Monday API token from environment
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

// Initialize SecureStorage with API token
const secureStorage = new SecureStorage(MONDAY_API_TOKEN);

// Key for storing Google access token
const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';

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
    
    // Prepare the data to store
    const tokenData = {
      accessToken: accessToken,
      userId: userId,
      storedAt: new Date().toISOString(),
      userEmail: userDetails.email || null
    };

    // Store the token in SecureStorage
    await secureStorage.set(userId, GOOGLE_ACCESS_TOKEN_KEY, tokenData);
    
    Logger.info(req, `Google access token stored successfully for user ${userId} (${userDetails.email || 'unknown email'})`);
    return true;
  } catch (error) {
    Logger.error(req, `Error storing Google access token in SecureStorage: ${error.message}`);
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
    
    if (!userDetails || !userDetails.id) {
      Logger.error(req, 'Failed to get Monday user details for retrieving Google access token');
      return null;
    }

    const userId = userDetails.id;
    
    // Retrieve the token from SecureStorage
    const tokenData = await secureStorage.get(userId, GOOGLE_ACCESS_TOKEN_KEY);
    
    if (!tokenData || !tokenData.accessToken) {
      Logger.info(req, `No Google access token found for user ${userId}`);
      return null;
    }

    Logger.info(req, `Google access token retrieved successfully for user ${userId}`);
    return tokenData.accessToken;
  } catch (error) {
    Logger.error(req, `Error retrieving Google access token from SecureStorage: ${error.message}`);
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
    
    // Delete the token from SecureStorage
    await secureStorage.delete(userId, GOOGLE_ACCESS_TOKEN_KEY);
    
    Logger.info(req, `Google access token deleted successfully for user ${userId}`);
    return true;
  } catch (error) {
    Logger.error(req, `Error deleting Google access token from SecureStorage: ${error.message}`);
    return false;
  }
}

module.exports = {
  storeGoogleAccessToken,
  getGoogleAccessToken,
  deleteGoogleAccessToken
};
