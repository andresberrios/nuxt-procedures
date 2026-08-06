import z from 'zod'

// Exercises the positive path: input and output both use a type (`Date`)
// that only round-trips correctly through superjson, not plain JSON.
export default defineProcedure({
  input: z.date(),
  output: z.date(),
  handler: ({ input }) => input,
})
