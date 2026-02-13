const axios = require('axios');
const { Logger } = require('../Logger/logger');
const { getGoogleAccessToken } = require('../secureStorage/mondaySecureStorage');

/**
 * Fetches Google user details using the stored access token
 * @param {Object} req - Express request object
 * @returns {Promise<Object|null>} - Returns Google user details (email, name, picture) or null if error
 */
async function fetchGoogleUserDetails(req) {
  try {
    // Get the stored Google access token
    const accessToken = await getGoogleAccessToken(req);
    
    if (!accessToken) {
      Logger.error(req, 'No Google access token found. User needs to authenticate with Google first.');
      return null;
    }

    // Fetch user info from Google People API
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data) {
      const userDetails = {
        email: response.data.email || null,
        name: response.data.name || null,
        picture: response.data.picture || null,
        id: response.data.id || null,
        verified_email: response.data.verified_email || false
      };

      Logger.info(req, `Google user details fetched successfully for ${userDetails.email || 'unknown'}`);
      return userDetails;
    }

    Logger.error(req, 'Invalid response from Google API');
    return null;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      Logger.error(req, `Google API error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
    } else if (error.request) {
      // The request was made but no response was received
      Logger.error(req, `No response from Google API: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      Logger.error(req, `Error fetching Google user details: ${error.message}`);
    }
    return null;
  }
}

module.exports = {
  fetchGoogleUserDetails
};
