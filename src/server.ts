import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Trust proxy для корректной работы за Nginx
app.set('trust proxy', true);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1h',
    index: false,
    redirect: false,
    setHeaders: (res, path) => {
      console.log(`[STATIC] Serving file: ${path}`);
      // Устанавливаем правильные MIME-типы
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        console.log(`[STATIC] Content-Type: application/javascript`);
      } else if (path.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        console.log(`[STATIC] Content-Type: application/javascript`);
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        console.log(`[STATIC] Content-Type: text/css`);
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  console.log(`[SSR] Request: ${req.method} ${req.url}`);
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        console.log(`[SSR] Rendering: ${req.url}`);
        writeResponseToNodeResponse(response, res);
      } else {
        console.log(`[SSR] No response, passing to next middleware: ${req.url}`);
        next();
      }
    })
    .catch((err) => {
      console.error(`[SSR] Error rendering ${req.url}:`, err);
      next(err);
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
