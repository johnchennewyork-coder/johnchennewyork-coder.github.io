import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

// Simple content type detection
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    pdf: 'application/pdf',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    ico: 'image/x-icon',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}

// Plugin to copy resources directory and blog directory to dist after build and serve during dev
const copyResourcesPlugin = (): Plugin => {
  return {
    name: 'copy-resources',
    writeBundle() {
      const resourcesSrc = resolve(__dirname, 'resources');
      if (existsSync(resourcesSrc)) {
        try {
          execSync(`cp -r "${resourcesSrc}" "${resolve(__dirname, 'dist')}/"`);
          console.log('✓ Copied resources directory to dist');
        } catch (error) {
          console.warn('Could not copy resources directory:', error);
        }
      }
      
      // Copy blog directory from prev/blog to dist/blog
      const blogSrc = resolve(__dirname, 'prev', 'blog');
      if (existsSync(blogSrc)) {
        try {
          execSync(`cp -r "${blogSrc}" "${resolve(__dirname, 'dist')}/"`);
          console.log('✓ Copied blog directory to dist');
        } catch (error) {
          console.warn('Could not copy blog directory:', error);
        }
      }
    },
    configureServer(server) {
      // Serve resources directory during dev
      server.middlewares.use('/resources', (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }
        const filePath = resolve(__dirname, 'resources', req.url.replace(/^\/resources/, ''));
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const content = readFileSync(filePath);
          const contentType = getContentType(filePath);
          res.setHeader('Content-Type', contentType);
          res.end(content);
        } else {
          next();
        }
      });
      
      // Serve blog directory during dev
      // This middleware handles all /blog/* requests
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/blog')) {
          next();
          return;
        }
        
        // Normalize the URL path
        let urlPath = req.url;
        // Remove query string and hash
        urlPath = urlPath.split('?')[0].split('#')[0];
        // Remove /blog prefix
        urlPath = urlPath.replace(/^\/blog\/?/, '');
        // If empty or just slash, serve index.html
        if (!urlPath || urlPath === '' || urlPath === '/') {
          urlPath = 'index.html';
        }
        // Remove leading slash
        urlPath = urlPath.replace(/^\//, '');
        
        // Try to find the file
        let filePath = resolve(__dirname, 'prev', 'blog', urlPath);
        
        // Check if it's a file
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          try {
            let content = readFileSync(filePath);
            const contentType = getContentType(filePath);
            
            // Rewrite absolute URLs to relative URLs for localhost (for HTML, CSS, JS, XML)
            if (contentType.includes('text/') || contentType.includes('application/javascript') || contentType.includes('application/xml')) {
              const contentStr = content.toString();
              // Replace absolute URLs with relative URLs
              const rewritten = contentStr
                .replace(/https:\/\/johntiger1\.github\.io\/blog\//g, '/blog/')
                .replace(/https:\/\/johntiger1\.github\.io\/blog"/g, '/blog"')
                .replace(/https:\/\/johntiger1\.github\.io\/blog'/g, "/blog'")
                .replace(/https:\/\/johntiger1\.github\.io\/blog/g, '/blog');
              content = Buffer.from(rewritten);
            }
            
            res.setHeader('Content-Type', contentType);
            res.end(content);
            return;
          } catch (error) {
            console.error('Error reading blog file:', filePath, error);
            next();
            return;
          }
        }
        
        // Check if it's a directory - try index.html
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
          const indexPath = resolve(filePath, 'index.html');
          if (existsSync(indexPath)) {
            try {
              let content = readFileSync(indexPath);
              // Rewrite absolute URLs to relative URLs for localhost
              const contentStr = content.toString();
              const rewritten = contentStr
                .replace(/https:\/\/johntiger1\.github\.io\/blog\//g, '/blog/')
                .replace(/https:\/\/johntiger1\.github\.io\/blog"/g, '/blog"')
                .replace(/https:\/\/johntiger1\.github\.io\/blog'/g, "/blog'")
                .replace(/https:\/\/johntiger1\.github\.io\/blog/g, '/blog');
              content = Buffer.from(rewritten);
              res.setHeader('Content-Type', 'text/html');
              res.end(content);
              return;
            } catch (error) {
              console.error('Error reading blog index:', indexPath, error);
            }
          }
        }
        
        // If path doesn't have extension, try adding .html
        if (!urlPath.includes('.')) {
          const htmlPath = resolve(__dirname, 'prev', 'blog', urlPath + '.html');
          if (existsSync(htmlPath) && statSync(htmlPath).isFile()) {
            try {
              let content = readFileSync(htmlPath);
              // Rewrite absolute URLs to relative URLs
              const contentStr = content.toString();
              const rewritten = contentStr
                .replace(/https:\/\/johntiger1\.github\.io\/blog\//g, '/blog/')
                .replace(/https:\/\/johntiger1\.github\.io\/blog"/g, '/blog"')
                .replace(/https:\/\/johntiger1\.github\.io\/blog'/g, "/blog'")
                .replace(/https:\/\/johntiger1\.github\.io\/blog/g, '/blog');
              content = Buffer.from(rewritten);
              res.setHeader('Content-Type', 'text/html');
              res.end(content);
              return;
            } catch (error) {
              console.error('Error reading blog HTML file:', htmlPath, error);
            }
          }
        }
        
        // If still not found, try as directory with index.html
        const dirPath = resolve(__dirname, 'prev', 'blog', urlPath);
        if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
          const indexPath = resolve(dirPath, 'index.html');
          if (existsSync(indexPath)) {
            try {
              let content = readFileSync(indexPath);
              // Rewrite absolute URLs to relative URLs for localhost
              const contentStr = content.toString();
              const rewritten = contentStr
                .replace(/https:\/\/johntiger1\.github\.io\/blog\//g, '/blog/')
                .replace(/https:\/\/johntiger1\.github\.io\/blog"/g, '/blog"')
                .replace(/https:\/\/johntiger1\.github\.io\/blog'/g, "/blog'")
                .replace(/https:\/\/johntiger1\.github\.io\/blog/g, '/blog');
              content = Buffer.from(rewritten);
              res.setHeader('Content-Type', 'text/html');
              res.end(content);
              return;
            } catch (error) {
              console.error('Error reading blog directory index:', indexPath, error);
            }
          }
        }
        
        // Not found, let Vite handle it (might be a 404)
        next();
      });
    },
  };
};

export default defineConfig({
  base: '/', // GitHub Pages base path (use '/' for username.github.io repos)
  root: '.',
  // Resources will be copied by plugin, but we also serve it during dev
  publicDir: false,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'rl-simulator': resolve(__dirname, 'rl-simulator.html'),
        'agents': resolve(__dirname, 'agents.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // Serve resources from root during dev
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyResourcesPlugin()],
});

