require("dotenv").config();
const express = require("express");
const { Logger, requestLogger } = require("./Logger/logger");
const { getHelloWorldController, fetchGoogleConfigurationController, saveGoogleAccessTokenController } = require("./apiContoller/controller");
const { validateMondaySession } = require("./Authentication/mondaySessionValidation");
const app = express();
const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV;
const basePath = process.env.BASE_PATH || '/api';

// Trust proxy to get correct IP addresses
app.set("trust proxy", true);

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware (allow requests from client)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Monday-Session-Token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Use request logger middleware for all routes
app.use(requestLogger);

// Health check endpoint - no validation required
app.get(`${basePath}/health`, (req, res) => {
  try{
    const healthData = {
      status: "Healthy",
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env,
      port: PORT
    };
    Logger.info(req, "Health check successful");
    res.status(200).json(healthData);
  }catch(error){
    Logger.error(req, `Health check failed: ${error.message}`);
    res.status(500).json({
      status: "Unhealthy",
      message: "Server is unhealthy",
      error: error.message,
      environment: env,
      port: PORT
    });
  }
});

// Apply Monday session validation middleware to all API routes under basePath
// This middleware will validate the token for all routes except health check (defined above)
// If token is invalid, it returns an error. If valid, it calls next() to proceed.
app.use(`${basePath}`, (req, res, next) => {
  // Skip validation for health check endpoint
  if (req.path === '/health' || req.path === `${basePath}/health`) {
    return next();
  }
  // Apply validation middleware to all other routes
  validateMondaySession(req, res, next);
});

// ============================================
// Protected API Routes
// All routes below this point require valid Monday session token
// ============================================

// Hello World API route (protected by validateMondaySession middleware)
app.get(`${basePath}/hello-world`, getHelloWorldController);
app.get(`${basePath}/google-configuration`, fetchGoogleConfigurationController);
app.post(`${basePath}/save-google-access-token`, saveGoogleAccessTokenController);

app.listen(PORT, () => {
  Logger.log("INFO", `Server started successfully on port ${PORT}`);
  console.log(`Server started successfully on port ${PORT}`);
});
