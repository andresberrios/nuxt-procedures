import { createError } from 'h3'

// Exercises the error path: the handler throws a plain H3Error carrying a
// `data` payload, which h3's `sendError` renders as ordinary (non-superjson)
// JSON — the client must still be able to read `data` back out.
export default defineProcedure({
  handler: () => {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad thing',
      data: { foo: 'bar' },
    })
  },
})
