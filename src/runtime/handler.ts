import type { EventHandler } from 'h3'
import { createRouter, useBase } from 'h3'

export function createProceduresHandler(procedures: Record<string, EventHandler>): EventHandler {
  // `preemptive` makes the router answer for every request that reaches it
  // instead of returning `undefined` when nothing matches. Without it an
  // unknown path falls out of this handler as `undefined`, and Nitro's own
  // (preemptive) router turns that into a `null` body, which h3 renders as
  // `204 No Content` — a call to a procedure that does not exist looks like a
  // successful empty response. With it, h3 throws its usual `createError`
  // instead: `404 Not Found` for an unregistered path, `405 Method Not
  // Allowed` for a registered path called with anything other than POST.
  //
  // Nitro registers this handler at `/procedures/**` in the same radix router
  // as every other server route, where a more specific static route always
  // wins the lookup. A user-defined `server/routes/procedures/*` route is
  // therefore matched before this handler ever runs, so answering
  // preemptively here cannot shadow it.
  const router = createRouter({ preemptive: true })

  // Register each procedure as a POST route
  for (const [path, handler] of Object.entries(procedures)) {
    router.post(`/${path}`, handler)
  }

  return useBase('/procedures', router.handler)
}
