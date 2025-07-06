const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Metro module resolution issues
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    keep_infinity: true,
  },
};

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web'],
};

module.exports = config;