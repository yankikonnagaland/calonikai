const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// SDK 53 compatible configuration
config.resolver.alias = {
  // Add any custom aliases here if needed
};

module.exports = config;