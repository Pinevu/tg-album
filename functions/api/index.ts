import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  TG_BOT_TOKEN: string
  TG_CHAT_ID: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  if (password !== user.password_hash) return c.json({ error: 'Invalid credentials' }, 401)
  const token = await sign({ uid: user.id, username }, c.env.JWT_SECRET)
  return c.json({ token })
})

export default app
