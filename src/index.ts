import { Hono } from 'hono'
import { instrument } from '@fiberplane/hono-otel';
import telegramApp from './telegram/controller';
import projectApp from './projects/controller';

export type Env = {
  DATABASE_URL: string;
  TELEGRAM_API_SECRET_URL: string;
}

const app = new Hono<{Bindings: Env}>()

app.use('*', (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return next();
});

app.route('/telegram', telegramApp);
app.route('/projects', projectApp);

export default instrument(app)