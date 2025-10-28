import z from 'zod'

export default defineProcedure({
  input: z.string(),
  output: z.string(),
  handler: ({ input }) => {
    return `Hello, ${input}!`
  },
})
