const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildServer() {
  try {
    await esbuild.build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: 'build/server/index.js',
      sourcemap: true,
      external: ['pg-native'],
    });
    console.log('Server build completed successfully.');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

// Make sure the build directory exists
if (!fs.existsSync('build/server')) {
  fs.mkdirSync('build/server', { recursive: true });
}

buildServer();