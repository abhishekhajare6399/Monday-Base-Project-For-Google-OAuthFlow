const { Logger } = require("../Logger/logger");
const { getHelloWorld } = require("../services/hello-world");
const { fetchGoogleConfiguration } = require("../services/fetchGoogleConfiguration");
const { storeGoogleAccessToken } = require("../secureStorage/mondaySecureStorage");
const { fetchGoogleUserDetails } = require("../services/fetchGoogleUserDetials");

/**
 * API Controller for Hello World
 * Handles the request and calls the service
 */
const getHelloWorldController = async (req, res) => {
  try {

    const result = await getHelloWorld(req, res);    
    res.status(200).json({
      success: true,
      message: result.message,
      mondayUser: result.mondayUser
    });
  } catch (error) {
    Logger.error(req, `Hello World API error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const fetchGoogleConfigurationController = async (req, res) => {
  try {
    const result = await fetchGoogleConfiguration(req, res);
    res.status(200).json({
      success: true,
      googleConfiguration: result
    });
  } catch (error) {
    Logger.error(req, `Google Configuration API error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const saveGoogleAccessTokenController = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      Logger.error(req, 'Google Access Token is missing in request body');
      return res.status(400).json({
        success: false,
        message: "Access token is required"
      });
    }

    // Store the access token in Monday.com SecureStorage
    const stored = await storeGoogleAccessToken(req, accessToken);
    
    if (!stored) {
      Logger.error(req, 'Failed to store Google access token in SecureStorage');
      return res.status(500).json({
        success: false,
        message: "Failed to store access token in SecureStorage"
      });
    }

    res.status(200).json({
      success: true,
      message: "Google access token saved successfully in SecureStorage"
    });
  } catch (error) {
    Logger.error(req, `Save Google Access Token API error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const fetchGoogleUserDetailsController = async (req, res) => {
  try {
    const userDetails = await fetchGoogleUserDetails(req);
    
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "Google user details not found. Please authenticate with Google first."
      });
    }

    res.status(200).json({
      success: true,
      googleUser: userDetails
    });
  } catch (error) {
    Logger.error(req, `Fetch Google User Details API error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getHelloWorldController,
  fetchGoogleConfigurationController,
  saveGoogleAccessTokenController,
  fetchGoogleUserDetailsController
};
