import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import superjson from 'superjson'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  it('round-trips superjson-only types (Date) on a successful call', async () => {
    const html = await $fetch('/')
    const result = extractJson(html, 'success-result')
    expect(result).toEqual({
      isDate: true,
      iso: '2024-01-01T00:00:00.000Z',
    })
  })

  it('surfaces createError data on the client instead of undefined', async () => {
    const html = await $fetch('/')
    const result = extractJson(html, 'error-result')
    expect(result.threw).toBe(true)
    expect(result.statusCode).toBe(400)
    // h3's `sendError` wraps whatever was passed to `createError({ data })`
    // as `{ statusCode, statusMessage, stack, data }` in the response body,
    // so the original payload comes back at `err.data.data`.
    expect(result.data).toBeDefined()
    expect(result.data.data).toEqual({ foo: 'bar' })
  })

  it('returns 404 for a path with no registered procedure', async () => {
    const res = await fetch('/procedures/does/not/exist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(superjson.serialize(undefined)),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.statusCode).toBe(404)
  })

  it('returns 405 for a registered procedure called with the wrong method', async () => {
    const res = await fetch('/procedures/echo-date', { method: 'GET' })
    expect(res.status).toBe(405)
    const body = await res.json()
    expect(body.statusCode).toBe(405)
  })

  it('still succeeds for a procedure that returns nothing', async () => {
    const res = await fetch('/procedures/returns-nothing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(superjson.serialize(undefined)),
    })
    expect(res.status).toBe(200)
    expect(superjson.deserialize(await res.json())).toBeUndefined()
  })

  it('gives the client undefined for a procedure that returns nothing', async () => {
    const html = await $fetch('/')
    const result = extractJson(html, 'void-result')
    expect(result).toEqual({ threw: false, isUndefined: true })
  })

  it('does not shadow a plain server route under the /procedures prefix', async () => {
    const res = await fetch('/procedures/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

function extractJson(html: string, elementId: string) {
  const match = html.match(new RegExp(`<pre id="${elementId}"[^>]*>([\\s\\S]*?)</pre>`))
  const captured = match?.[1]
  if (captured === undefined) {
    throw new Error(`Could not find #${elementId} in rendered HTML`)
  }
  return JSON.parse(decodeURIComponent(captured))
}
