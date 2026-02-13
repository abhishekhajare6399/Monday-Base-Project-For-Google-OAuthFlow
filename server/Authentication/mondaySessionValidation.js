const jwt = require("jsonwebtoken");
const { Logger } = require("../Logger/logger");

// Monday.com session tokens are verified using CLIENT_SECRET, not SIGNING_SECRET
const MONDAY_CLIENT_SECRET = process.env.MONDAY_CLIENT_SECRET || process.env.MONDAY_SIGNING_SECRET;

/**
 * Middleware to validate Monday.com session token
 * Verifies JWT token using Monday.com client secret
 * If valid, attaches decoded user info to request and allows access
 * If invalid, returns 401/403 error and denies access
 */
function validateMondaySession(req, res, next) {
  try {
    // Get token from X-Monday-Session-Token header (Express converts headers to lowercase)
    const token = req.headers['x-monday-session-token'];
    if (!token) {
      Logger.warn(req, "Monday session token missing in request headers");
      return res.status(401).json({
        error: "Missing monday session token"
      });
    }

    // Check if client secret is configured
    if (!MONDAY_CLIENT_SECRET) {
      Logger.error(req, "MONDAY_CLIENT_SECRET or MONDAY_SIGNING_SECRET is not configured in environment variables");
      return res.status(500).json({
        error: "Server configuration error: Monday client secret not found"
      });
    }
    const decoded = jwt.verify(token, MONDAY_CLIENT_SECRET);
    req.mondayUser = decoded.dat || decoded;
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      Logger.warn(req, `Invalid Monday session token: ${error.message}`);
      return res.status(403).json({
        error: "Invalid monday session token"
      });
    }

    if (error.name === 'TokenExpiredError') {
      Logger.warn(req, "Monday session token has expired");
      return res.status(403).json({
        error: "Monday session token has expired"
      });
    }

    // Handle other errors
    Logger.error(req, `Token validation failed: ${error.message}`);
    return res.status(403).json({
      error: "Invalid monday session token"
    });
  }
}

module.exports = validateMondaySession;
