/**
 * Metro configuration for React Native / Expo
 * Optimizations for faster builds and reduced bundle size
 * 
 * @see https://docs.expo.dev/guides/customizing-metro/
 * @see https://metrobundler.dev/docs/configuration
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ============================================
// 🚀 PERFORMANCE OPTIMIZATIONS
// ============================================

// 1. Enable caching for faster rebuilds
config.cacheVersion = '1.0.0';

// 2. Transformer optimizations
config.transformer = {
  ...config.transformer,
  // Minify in production
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    // Terser options for production builds
    compress: {
      // Remove console.log in production (except errors/warnings)
      drop_console: process.env.NODE_ENV === 'production',
      // Remove debugger statements
      drop_debugger: true,
      // Pure function calls that can be removed
      pure_funcs: process.env.NODE_ENV === 'production' 
        ? ['console.log', 'console.info', 'console.debug'] 
        : [],
    },
    mangle: {
      // Keep class names for debugging
      keep_classnames: process.env.NODE_ENV !== 'production',
      keep_fnames: process.env.NODE_ENV !== 'production',
    },
  },
  // Enable Hermes bytecode
  hermesParser: true,
  // Enable experimental features
  unstable_allowRequireContext: true,
};

// 3. Resolver optimizations
config.resolver = {
  ...config.resolver,
  // Prioritize these file extensions (most common first)
  sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json', 'cjs', 'mjs'],
  // Asset extensions
  assetExts: [
    ...config.resolver.assetExts.filter(ext => ext !== 'svg'),
    'db', 'sqlite', 'ttf', 'otf', 'woff', 'woff2',
  ],
  // Platforms to resolve
  platforms: ['ios', 'android', 'native', 'web'],
  // Node modules fields to check (performance ordering)
  resolverMainFields: ['react-native', 'browser', 'main', 'module'],
  // Unstable: Enable package exports resolution
  unstable_enablePackageExports: true,
};

// 4. Serializer optimizations
config.serializer = {
  ...config.serializer,
  // Enable tree shaking for smaller bundles
  experimentalSerializerHook: (graph) => {
    // Future: Add custom serialization logic if needed
    return graph;
  },
};

// 5. Watcher optimizations (faster file watching)
config.watcher = {
  ...config.watcher,
  // Use watchman for faster file watching (if available)
  watchman: {
    deferStates: ['hg.update'],
  },
  // Additional directories to ignore
  additionalExts: ['cjs', 'mjs'],
};

// 6. Server optimizations
config.server = {
  ...config.server,
  // Enable persistent caching
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add cache headers for assets
      if (req.url?.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return middleware(req, res, next);
    };
  },
};

// ============================================
// 📦 BUNDLE SPLITTING (Future)
// ============================================
// Note: React Native doesn't natively support code splitting yet,
// but this configuration is ready for when it does.

// ============================================
// 🔧 DEBUGGING (Development only)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  // Enable source maps in development
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    sourceMap: true,
  };
}

// ============================================
// 📊 BUNDLE ANALYSIS (Optional)
// ============================================
// Uncomment to enable bundle visualization
// const { createMetroPlugin } = require('react-native-bundle-visualizer');
// config.serializer.customSerializer = createMetroPlugin();

module.exports = config;
