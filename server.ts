import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

type UserRole = 'ADMIN' | 'USER';

interface SessionUser {
  username: string;
  role: UserRole;
}

const DEMO_USERS: Array<SessionUser & { password: string }> = [
  { username: 'admin', password: 'admin123', role: 'ADMIN' },
  { username: 'user', password: 'user123', role: 'USER' }
];

function parseAuth(req: express.Request): SessionUser | null {
  const raw = req.headers['authorization'];
  if (!raw || !raw.startsWith('Bearer role-')) {
    return null;
  }

  const token = raw.replace('Bearer role-', '');
  const [roleToken, username] = token.split(':');
  const role = (roleToken || '').toUpperCase() as UserRole;

  if (!username || (role !== 'ADMIN' && role !== 'USER')) {
    return null;
  }

  return { username, role };
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const session = parseAuth(req);
  if (!session) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  (req as any).sessionUser = session;
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const session = (req as any).sessionUser as SessionUser | undefined;
    if (!session || !allowedRoles.includes(session.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  server.use(express.json());

  server.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const match = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === String(username || '').toLowerCase() && u.password === password
    );

    if (!match) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    res.json({
      username: match.username,
      role: match.role,
      token: `role-${match.role.toLowerCase()}:${match.username}`
    });
  });

  server.get('/api/auth/me', requireAuth, (req, res) => {
    res.json((req as any).sessionUser);
  });

  server.get('/api/user/ping', requireAuth, (_req, res) => {
    res.json({ status: 'ok', scope: 'user' });
  });

  server.get('/api/admin/ping', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    res.json({ status: 'ok', scope: 'admin' });
  });

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
