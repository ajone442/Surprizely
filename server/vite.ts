import express, { type Express, Application, Request, Response, NextFunction } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Application): Promise<void> {
  const vite = await createViteServer({
    root: path.join(__dirname, '..', 'client'),
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: {
      exclude: ['@tanstack/react-query']
    }
  });

  app.use(vite.middlewares);
}

export function serveStatic() {
  const staticPath = path.join(__dirname, '..', 'dist', 'public');
  const staticMiddleware = express.static(staticPath);
  
  return (req: Request, res: Response, next: NextFunction) => {
    staticMiddleware(req, res, (err) => {
      if (err) {
        next(err);
      } else if (!res.headersSent) {
        // Serve index.html for all unmatched routes in production
        res.sendFile(path.join(staticPath, 'index.html'));
      }
    });
  };
}

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export async function setupViteLegacy(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
