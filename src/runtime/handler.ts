import type { EventHandler } from 'h3'
import { createRouter, useBase } from 'h3'

export function createProceduresHandler(procedures: Record<string, EventHandler>): EventHandler {
  const router = createRouter()

  // Register each procedure as a POST route
  for (const [path, handler] of Object.entries(procedures)) {
    router.post(`/${path}`, handler)
  }

  return useBase('/procedures', router.handler)
}
