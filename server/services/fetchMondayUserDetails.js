const axios = require("axios");
const { Logger } = require("../Logger/logger");

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

/**
 * Fetch monday user details using GraphQL API
 */
async function fetchMondayUserDetails(req, res) {
  try {
    const { user_id } = req.mondayUser; // 👈 from decoded sessionToken
    const query = `
      query ($userId: [ID!]) {
        users (ids: $userId) {
          id
          name
          email
          photo_thumb
          is_admin
        }
      }
    `;
    const response = await axios.post(
      "https://api.monday.com/v2",
      {
        query,
        variables: {
          userId: user_id
        }
      },
      {
        headers: {
          Authorization: MONDAY_API_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );
    const userDetails = response.data?.data?.users?.[0];
    return userDetails;
  } catch (error) {
    Logger.error(req, `Error fetching Monday user details: ${error.message}`);
    return null;
  }
}

module.exports = fetchMondayUserDetails;
