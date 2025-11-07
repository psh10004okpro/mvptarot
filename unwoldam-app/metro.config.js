const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Enable inline requires for better performance
      },
    }),
    // Enable minification in production
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
  resolver: {
    // Enable source map generation
    sourceExts: [...defaultConfig.resolver.sourceExts, 'json'],
  },
  // Performance optimizations
  maxWorkers: 4,
  resetCache: false,
  cacheStores: [
    // Use file system cache
    {
      get: async (key) => {
        // Custom cache implementation can go here
        return null;
      },
      set: async (key, value) => {
        // Custom cache implementation can go here
      },
    },
  ],
};

module.exports = mergeConfig(defaultConfig, config);
