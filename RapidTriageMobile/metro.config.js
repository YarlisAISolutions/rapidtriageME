const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for absolute imports
config.resolver.alias = {
  '@': './src',
  '@ui': './src/ui',
  '@components': './src/ui/components',
  '@screens': './src/ui/screens',
  '@navigation': './src/ui/navigation',
  '@services': './src/services',
  '@store': './src/store',
  '@utils': './src/utils',
  '@constants': './src/constants',
  '@assets': './assets',
};

module.exports = config;