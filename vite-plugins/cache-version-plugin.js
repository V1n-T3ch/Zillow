import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import process from 'node:process';

export function cacheVersionPlugin() {
  return {
    name: 'cache-version-plugin',
    writeBundle() {
      try {
        const serviceWorkerPath = join(process.cwd(), 'public/serviceWorker.js');
        
        // Check if service worker file exists
        if (!existsSync(serviceWorkerPath)) {
          console.warn('⚠️  Service worker file not found, skipping cache version update');
          return;
        }

        let content = readFileSync(serviceWorkerPath, 'utf8');
        
        // Generate version based on git commit hash or timestamp fallback
        let version;
        try {
          // Try to get git commit hash
          const gitHash = execSync('git rev-parse --short HEAD', { 
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'] // Suppress error output
          }).trim();
          const buildTime = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          version = `${gitHash}-${buildTime}`;
        } catch (gitError) {
          // Fallback to timestamp if git is not available
          const timestamp = Date.now();
          const buildTime = new Date().toISOString().slice(0, 10);
          version = `${buildTime}-${timestamp}`;
          console.warn('⚠️  Git not available, using timestamp for cache version', gitError);
        }
        
        // Replace the cache version
        const updatedContent = content.replace(
          /const CACHE_NAME = ['"`][^'"`]*['"`];?/g,
          `const CACHE_NAME = 'dwella-${version}';`
        );
        
        // Only write if content actually changed
        if (updatedContent !== content) {
          writeFileSync(serviceWorkerPath, updatedContent);
          console.log(`✅ Cache version updated to: dwella-${version}`);
        } else {
          console.log(`ℹ️  Cache version already up to date`);
        }
        
      } catch (error) {
        console.error('❌ Failed to update cache version:', error.message);
        // Don't fail the build, just warn
      }
    },
    // Also run during development
    configureServer(server) {
      // Update cache version when service worker is requested in dev mode
      server.middlewares.use('/serviceWorker.js', (req, res, next) => {
        try {
          const serviceWorkerPath = join(process.cwd(), 'public/serviceWorker.js');
          if (existsSync(serviceWorkerPath)) {
            let content = readFileSync(serviceWorkerPath, 'utf8');
            const devVersion = `dev-${Date.now()}`;
            content = content.replace(
              /const CACHE_NAME = ['"`][^'"`]*['"`];?/g,
              `const CACHE_NAME = 'dwella-${devVersion}';`
            );
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.end(content);
            return;
          }
        } catch (error) {
          console.error('Error serving service worker in dev mode:', error);
        }
        next();
      });
    }
  };
}