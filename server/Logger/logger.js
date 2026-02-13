const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path (one file per day)
const getLogFilePath = () => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(logsDir, `google-Drive-Embedded-${today}.log`);
};

// Format timestamp: YYYY-MM-DD HH:mm:ss,SSS
const formatTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${milliseconds}`;
};

// Get client IP address from request
const getClientIP = (req) => {
  if (!req) return "unknown";
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers?.["x-real-ip"] ||
    "unknown"
  );
};

// Get URL from request
const getRequestURL = (req) => {
  return req.originalUrl || req.url || "unknown";
};

// Write log to file
const writeLog = (level, ip, url, message) => {
  const timestamp = formatTimestamp();
  const logEntry = `${timestamp} IP:${ip} ${url} ${level} ${message}\n`;
  const logFile = getLogFilePath();
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
};

// Logger class
class Logger {
  static debug(req, message) {
    const ip = getClientIP(req);
    const url = getRequestURL(req);
    writeLog("DEBUG", ip, url, message);
  }

  static info(req, message) {
    const ip = getClientIP(req);
    const url = getRequestURL(req);
    writeLog("INFO", ip, url, message);
  }

  static warn(req, message) {
    const ip = getClientIP(req);
    const url = getRequestURL(req);
    writeLog("WARN", ip, url, message);
  }

  static error(req, message) {
    const ip = getClientIP(req);
    const url = getRequestURL(req);
    writeLog("ERROR", ip, url, message);
  }

  // Log without request object (for server startup, etc.)
  static log(level, message, ip = "server", url = "system") {
    writeLog(level, ip, url, message);
  }
}

// Express middleware for automatic request logging
const requestLogger = (req, res, next) => {
  const ip = getClientIP(req);
  const url = getRequestURL(req);
  const method = req.method;
  
  // Log request
  Logger.log("INFO", `${method} ${url}`, ip, url);
  
  // Log response when finished
  res.on("finish", () => {
    const statusCode = res.statusCode;
    Logger.log("INFO", `${method} ${url} - Status: ${statusCode}`, ip, url);
  });
  
  next();
};

module.exports = { Logger, requestLogger };
