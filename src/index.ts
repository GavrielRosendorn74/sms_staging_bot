import { Hono } from 'hono'
import { instrument } from '@fiberplane/hono-otel';

type Bindings = {
  DATABASE_URL: string;
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  const { shouldHonk } = c.req.query();
  const honk = typeof shouldHonk !== "undefined" ? 'Honk honk!' : '';
  return c.text(`Helloo !!`.trim())
})

export default instrument(app)