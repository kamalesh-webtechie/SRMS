const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('express-async-handler');

// Middleware to load system settings and attach to req
const loadSystemSettings = asyncHandler(async (req, res, next) => {
    // We can use the caching logic here too if we export the getSettings function better,
    // or just rely on the database for now. 
    // For middleware, we want it fast, so a simple check is good.
    // To avoid circular dependency with controller, we'll re-implement simple cache or just fetch.

    // For now, let's fetch to be safe and accurate.
    // In production, we'd import the cached version from a service.
    const settings = await SystemSettings.getSettings();

    req.systemSettings = settings;
    next();
});

module.exports = { loadSystemSettings };
