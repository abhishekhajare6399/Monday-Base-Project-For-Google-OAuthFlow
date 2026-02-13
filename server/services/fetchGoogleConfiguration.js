const { Logger } = require("../Logger/logger");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_DISCOVERY_DOC = process.env.GOOGLE_DISCOVERY_DOC;
const GOOGLE_SCOPES = process.env.GOOGLE_SCOPES;

async function fetchGoogleConfiguration(req, res) {
  try {
    return {
      googleApiKey: GOOGLE_API_KEY,
      googleClientId: GOOGLE_CLIENT_ID,
      googleDiscoveryDoc: GOOGLE_DISCOVERY_DOC,
      googleScopes: GOOGLE_SCOPES
    };
  }catch (error) {
    Logger.error(req, `Error fetching Google configuration: ${error.message}`);
    return null;
  }
}

module.exports = {
  fetchGoogleConfiguration
};