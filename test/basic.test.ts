import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

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
})

function extractJson(html: string, elementId: string) {
  const match = html.match(new RegExp(`<pre id="${elementId}"[^>]*>([\\s\\S]*?)</pre>`))
  const captured = match?.[1]
  if (captured === undefined) {
    throw new Error(`Could not find #${elementId} in rendered HTML`)
  }
  return JSON.parse(decodeURIComponent(captured))
}
