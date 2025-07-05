const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable legacy bundler for compatibility
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = false;

module.exports = config;